import os
import re
import time
import json
import uuid
import base64
import hashlib
from datetime import datetime
from collections import defaultdict, deque

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

import requests
import phonenumbers
import dns.resolver

from presidio_analyzer import AnalyzerEngine, PatternRecognizer, Pattern
from presidio_anonymizer import AnonymizerEngine
from presidio_analyzer.predefined_recognizers import PhoneRecognizer
from presidio_analyzer.nlp_engine import NlpEngineProvider

from cryptography.fernet import Fernet, InvalidToken

import firebase_admin
from firebase_admin import credentials, firestore

import google.generativeai as genai
from langchain_community.utilities import GoogleSearchAPIWrapper
from langchain_community.retrievers import WikipediaRetriever, ArxivRetriever
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage


# ============================================================
# ENV
# ============================================================
load_dotenv()
GEMINI_API_KEY  = os.getenv("GEMINI_API_KEY")
GOOGLE_CSE_ID   = os.getenv("GOOGLE_CSE_ID")
GOOGLE_API_KEY  = os.getenv("GOOGLE_API_KEY")
ENCRYPTION_KEY  = os.getenv("ENCRYPTION_KEY")
SECRET_KEY      = os.getenv("SECRET_KEY", "trustguard-secret-2025")

app = Flask(__name__)

# ── CORS ──────────────────────────────────────────────────────
_raw_origins = os.getenv("FRONTEND_URL", "")
if _raw_origins and _raw_origins != "*":
    _allowed = [o.strip().rstrip("/") for o in _raw_origins.split(",") if o.strip()]
else:
    _allowed = []

ALLOWED_ORIGINS = _allowed + [
    "https://trust-guard-phase2.vercel.app",
    "https://trustguard.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

CORS(app,
     resources={r"/*": {"origins": ALLOWED_ORIGINS}},
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])


# ============================================================
# FIREBASE  (Firestore)
# ============================================================
db = None
if not firebase_admin._apps:
    # ── Priority 1: env var (Render / production) ──────────────
    _fb_creds_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
    if _fb_creds_json:
        try:
            _creds_dict = json.loads(_fb_creds_json)
            cred = credentials.Certificate(_creds_dict)
            firebase_admin.initialize_app(cred)
            db = firestore.client()
            print("🔥 Firebase connected via FIREBASE_CREDENTIALS_JSON env var!")
        except Exception as e:
            print(f"⚠️ Firebase env var error: {e}")
    # ── Priority 2: local file (development) ──────────────────
    elif os.path.exists("firebase_credentials.json"):
        try:
            cred = credentials.Certificate("firebase_credentials.json")
            firebase_admin.initialize_app(cred)
            db = firestore.client()
            print("🔥 Firebase connected via firebase_credentials.json!")
        except Exception as e:
            print(f"⚠️ Firebase file error: {e}")
    else:
        print("⚠️ No Firebase credentials found — running in in-memory mode.")
        print("   Set FIREBASE_CREDENTIALS_JSON env var on Render to enable Firestore.")


# ============================================================
# GLOBAL / IN-MEMORY STATE
# ============================================================
USER_SCAN_LOGS   = defaultdict(lambda: deque(maxlen=200))
USER_STATS       = defaultdict(lambda: {
    "total_scans":0,"pii_blocked":0,"hallucinations_found":0,
    "verified_safe":0,"blocked_requests":0,"top_pii_types":{},
})
GLOBAL_SCAN_LOGS = deque(maxlen=500)
SESSIONS         = {}
AUDIT_LOG        = deque(maxlen=500)
RATE_LIMIT       = defaultdict(list)
USER_PREFS_CACHE: dict = {}
MEMORY_CACHE:     dict = {}
VERIFY_STORE:     dict = {}
MEMORY_LIMIT = 50

ACTIVE_SETTINGS = {
    "rag":          True,
    "urlCheck":     True,
    "encryption":   True,
    "autoRedact":   True,
    "publicFigure": True,
    "piiThreshold": 0.4,
}

if db:
    try:
        _doc = db.collection("system").document("settings").get()
        if _doc.exists:
            _saved = _doc.to_dict() or {}
            _allowed_keys = {"rag","urlCheck","encryption","autoRedact","publicFigure","piiThreshold"}
            for _k, _v in _saved.items():
                if _k in _allowed_keys:
                    ACTIVE_SETTINGS[_k] = _v
            print(f"⚙️  Settings loaded from Firestore: {ACTIVE_SETTINGS}")
    except Exception as _e:
        print(f"⚠️  Settings load error: {_e}")


# ============================================================
# ENCRYPTION
# ============================================================
cipher_suite = None

def _is_valid_fernet_key(k):
    if not k or not isinstance(k, str):
        return False
    try:
        return len(base64.urlsafe_b64decode(k.encode())) == 32
    except Exception:
        return False

if ENCRYPTION_KEY:
    if _is_valid_fernet_key(ENCRYPTION_KEY):
        try:
            cipher_suite = Fernet(ENCRYPTION_KEY.encode())
            print("🔒 Fernet encryption ready.")
        except Exception as e:
            print(f"⚠️ Fernet init error: {e}")
    else:
        print("❌ ENCRYPTION_KEY invalid — encryption disabled.")
else:
    print("⚠️ ENCRYPTION_KEY missing — encryption disabled.")


def is_encryption_on() -> bool:
    return bool(cipher_suite) and bool(ACTIVE_SETTINGS.get("encryption", True))

def encrypt_data(text: str) -> str:
    if not is_encryption_on() or text is None:
        return text
    if text == "":
        return ""
    return cipher_suite.encrypt(text.encode()).decode()

def decrypt_data(maybe_enc: str) -> str:
    if maybe_enc is None:
        return maybe_enc
    if maybe_enc == "":
        return ""
    if not cipher_suite:
        return maybe_enc
    try:
        return cipher_suite.decrypt(maybe_enc.encode()).decode()
    except (InvalidToken, Exception):
        return maybe_enc

def sha256_text(text: str) -> str:
    return hashlib.sha256((text or "").encode()).hexdigest()

def hash_password(pw: str) -> str:
    return hashlib.sha256((pw + SECRET_KEY).encode()).hexdigest()


# ============================================================
# RATE LIMITING
# ============================================================
RATE_LIMIT_WINDOW = 60
RATE_LIMIT_MAX    = 30

def is_rate_limited(ip: str) -> bool:
    now = time.time()
    RATE_LIMIT[ip] = [t for t in RATE_LIMIT[ip] if now - t < RATE_LIMIT_WINDOW]
    if len(RATE_LIMIT[ip]) >= RATE_LIMIT_MAX:
        USER_STATS["_global"]["blocked_requests"] = \
            USER_STATS["_global"].get("blocked_requests", 0) + 1
        return True
    RATE_LIMIT[ip].append(now)
    return False


# ============================================================
# SESSION / UID HELPERS
# ============================================================
def get_uid_from_request() -> str:
    auth = request.headers.get("Authorization", "")
    token = auth.replace("Bearer ", "").strip()
    if token and token in SESSIONS:
        return SESSIONS[token].get("uid") or SESSIONS[token].get("email") or "anonymous"
    return "anonymous"

def _safe_uid(uid: str) -> str:
    return re.sub(r'[^\w\-]', '_', uid)[:128] or "anonymous"


# ============================================================
# AUDIT
# ============================================================
def audit(event, detail, ip="unknown", user="anonymous"):
    entry = {
        "id": str(uuid.uuid4())[:8],
        "timestamp": datetime.now().isoformat(),
        "event": event, "detail": detail,
        "ip": ip, "user": user, "ts_unix": time.time(),
    }
    AUDIT_LOG.appendleft(entry)
    if db:
        try:
            payload = dict(entry)
            payload["detail"] = encrypt_data(entry["detail"])
            payload["enc"] = is_encryption_on()
            db.collection("audit_log").add({**payload, "created_at": firestore.SERVER_TIMESTAMP})
        except Exception as e:
            print(f"Audit write error: {e}")


# ============================================================
# RETRY
# ============================================================
def invoke_with_retry(model, prompt, max_retries=3):
    for attempt in range(max_retries):
        try:
            return model.invoke(prompt)
        except Exception:
            if attempt + 1 == max_retries:
                raise
            time.sleep(2 ** attempt)


# ============================================================
# URL / SEARCH HELPERS
# ============================================================
def check_url_validity(url):
    try:
        r = requests.head(url, timeout=5, allow_redirects=True)
        return "VALID" if 200 <= r.status_code < 400 else f"INVALID ({r.status_code})"
    except Exception as e:
        return f"INVALID ({type(e).__name__})"

def extract_links(text):
    return re.compile(r'https?://[^\s/\.]+[^\s]+').findall(text or "")


# ============================================================
# PUBLIC FIGURE DETECTION
# ============================================================
_KNOWN_PUBLIC_FIGURES = {
    "ms dhoni","mahendra singh dhoni","virat kohli","rohit sharma","sachin tendulkar",
    "shivam dube","hardik pandya","jasprit bumrah","ravindra jadeja","suryakumar yadav",
    "rishabh pant","ben stokes","joe root","steve smith","pat cummins","babar azam",
    "kane williamson","ricky ponting","brian lara","shane warne","wasim akram",
    "cristiano ronaldo","lionel messi","neymar","kylian mbappe","erling haaland",
    "ronaldo","messi","pele","maradona","zinedine zidane","david beckham",
    "lebron james","michael jordan","stephen curry","kevin durant","kobe bryant",
    "roger federer","rafael nadal","novak djokovic","serena williams","venus williams",
    "amitabh bachchan","shahrukh khan","shah rukh khan","salman khan","aamir khan",
    "deepika padukone","priyanka chopra","ranveer singh","akshay kumar","hrithik roshan",
    "brad pitt","angelina jolie","tom cruise","leonardo dicaprio","robert downey jr",
    "scarlett johansson","dwayne johnson","will smith","denzel washington",
    "narendra modi","rahul gandhi","joe biden","donald trump","barack obama",
    "angela merkel","boris johnson","emmanuel macron","xi jinping","vladimir putin",
    "elon musk","jeff bezos","bill gates","mark zuckerberg","sundar pichai",
    "satya nadella","tim cook","larry page","sergey brin","sam altman",
    "taylor swift","beyonce","ed sheeran","ar rahman","lata mangeshkar",
    "arijit singh","sonu nigam","kishore kumar",
    "albert einstein","isaac newton","stephen hawking","marie curie","nikola tesla",
    "david schwimmer","jennifer aniston","courteney cox","matt leblanc","matthew perry",
    "lisa kudrow","friends cast",
}

def _normalize_name(name):
    return re.sub(r'\s+', ' ', (name or "").lower().strip())

def is_known_public_figure(name):
    return _normalize_name(name) in _KNOWN_PUBLIC_FIGURES

def is_public_figure_wikipedia(name):
    name = (name or "").strip()
    if len(name) < 3:
        return False
    if is_known_public_figure(name):
        return True
    try:
        r = requests.get("https://en.wikipedia.org/w/api.php", params={
            "action":"query","list":"search","srsearch":name,"format":"json","srlimit":3,
        }, timeout=5)
        r.raise_for_status()
        hits = r.json().get("query",{}).get("search",[])
        for hit in hits:
            title = (hit.get("title") or "").lower()
            q = name.lower()
            parts = q.split()
            if all(p in title for p in parts): return True
            if title in q or q in title: return True
            if hit.get("size",0) > 5000 and parts[-1] in title: return True
        return False
    except Exception:
        return False

def check_wikipedia_for_public_figure_google(name, google_wrapper):
    if not google_wrapper:
        return False
    name = (name or "").strip()
    if len(name) < 4:
        return False
    for term in ([name] + ([name.split()[-1]] if len(name.split()) > 1 else [])):
        try:
            results = google_wrapper.results(f'"{term}" wikipedia', num_results=3)
            for r in results:
                if 'wikipedia.org' in r.get('link','').lower() and term.lower() in r.get('title','').lower():
                    return True
        except Exception:
            pass
    return False

def check_public_figure(name, google_wrapper=None):
    return (is_known_public_figure(name) or is_public_figure_wikipedia(name) or
            (google_wrapper and check_wikipedia_for_public_figure_google(name, google_wrapper)))


# ============================================================
# MODELS / RAG
# ============================================================
CLASSIFIER_SYSTEM_PROMPT = SystemMessage(
    content="You are a query classifier. Respond ONLY with 'FACTUAL' or 'CONVERSATIONAL'."
)

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("CRITICAL: GEMINI_API_KEY missing.")

chat_model       = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.7,  google_api_key=GEMINI_API_KEY)
analysis_model   = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.2,  google_api_key=GEMINI_API_KEY)
correction_model = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.4,  google_api_key=GEMINI_API_KEY)
intent_model     = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.1,  google_api_key=GEMINI_API_KEY)

try:
    wiki_retriever        = WikipediaRetriever(top_k_results=5, doc_content_chars_max=8000)
    arxiv_retriever       = ArxivRetriever(top_k_results=3, doc_content_chars_max=8000)
    google_search_wrapper = GoogleSearchAPIWrapper(k=5) if (GOOGLE_CSE_ID and GOOGLE_API_KEY) else None
    print("✅ RAG initialized.")
except Exception as e:
    print(f"⚠️ Retriever error: {e}")
    wiki_retriever = arxiv_retriever = google_search_wrapper = None


# ============================================================
# PII CONFIG
# ============================================================
ALWAYS_EXEMPT = {
    "DATE_TIME","NRP","LOCATION","ADDRESS","URL","IP_ADDRESS","ORG","TITLE","AGE","LANGUAGE"
}
BASE_RISK_ADJUSTMENTS = {
    "DATE_TIME":-0.80,"NRP":-0.80,"LOCATION":-0.70,"ADDRESS":-0.50,
    "ORG":-0.40,"URL":-0.80,"IP_ADDRESS":-0.60,"PERSON":-0.25,
}
HIGH_THRESHOLD   = 0.72
MEDIUM_THRESHOLD = 0.42
PRIVATE_TYPES = {
    "PERSON","EMAIL_ADDRESS","PHONE_NUMBER","CREDIT_CARD","IBAN_CODE",
    "MEDICAL_LICENSE","US_SSN","US_PASSPORT","US_DRIVER_LICENSE","US_BANK_NUMBER"
}

provider   = NlpEngineProvider(nlp_configuration={
    'nlp_engine_name':'spacy','models':[{'lang_code':'en','model_name':'en_core_web_sm'}]
})
nlp_engine = provider.create_engine()
analyzer   = AnalyzerEngine(nlp_engine=nlp_engine, supported_languages=["en"])
analyzer.registry.add_recognizer(PhoneRecognizer(context=["phone","number","contact","call"]))
analyzer.registry.add_recognizer(PatternRecognizer(
    supported_entity="PERSON",
    patterns=[Pattern("academic_author", r"\b([A-Z]\.\s*){1,3}([a-zA-Z]+\s?){1,3}\b", 0.6)]
))
anonymizer = AnonymizerEngine()


# ============================================================
# PII VERIFY
# ============================================================
def verify_pii_entity(text, entity, model):
    ent_text = text[entity.start:entity.end].strip()
    ent_type = entity.entity_type
    if len(ent_text.split()) == 1 and len(ent_text) < 4:
        return None

    signals = {}

    if ent_type == "PHONE_NUMBER":
        try:
            pn = phonenumbers.parse(ent_text, "IN")
            signals["phone_is_valid"] = phonenumbers.is_valid_number(pn)
        except Exception:
            signals["phone_is_valid"] = False

    if ent_type == "EMAIL_ADDRESS":
        try:
            dns.resolver.resolve(ent_text.split("@")[-1], "MX")
            signals["domain_check_mx"] = True
        except Exception:
            signals["domain_check_mx"] = False

    if ent_type == "PERSON":
        if is_known_public_figure(ent_text):
            signals["public_figure"]   = True
            signals["known_celebrity"] = True
        else:
            pub = is_public_figure_wikipedia(ent_text)
            if not pub and google_search_wrapper:
                pub = check_wikipedia_for_public_figure_google(ent_text, google_search_wrapper)
            signals["public_figure"] = pub
        if not ACTIVE_SETTINGS.get("publicFigure", True):
            signals["public_figure"] = False
    else:
        signals["public_figure"] = False

    if ent_type == "NRP":
        signals["is_nationality_or_group"] = True
        signals["public_figure"] = True
    if ent_type in ("LOCATION","ADDRESS","ORG","DATE_TIME","URL","IP_ADDRESS"):
        signals["is_public_entity"] = True
        signals["public_figure"]    = True

    if ent_type in PRIVATE_TYPES and not signals.get("public_figure", False):
        try:
            context = text[max(0,entity.start-60):min(len(text),entity.end+60)]
            resp = invoke_with_retry(
                model,
                f"Is '{ent_text}' in '...{context}...' a PRIVATE individual's PII "
                f"(not a celebrity, public figure, athlete, or politician)? YES or NO only."
            ).content
            signals["llm_confirmed_pii"] = "yes" in (resp or "").lower()
        except Exception:
            signals["llm_confirmed_pii"] = False
    else:
        signals["llm_confirmed_pii"] = False

    score = entity.score + BASE_RISK_ADJUSTMENTS.get(ent_type, 0.0)
    if signals.get("phone_is_valid"):    score += 0.15
    if signals.get("domain_check_mx"):   score += 0.10
    if signals.get("llm_confirmed_pii"): score += 0.20
    if signals.get("public_figure"):     score -= 0.60
    if signals.get("known_celebrity"):   score -= 0.20
    if ent_type not in PRIVATE_TYPES:    score -= 0.30

    final_score = min(max(score, 0.0), 1.0)
    threshold   = ACTIVE_SETTINGS.get("piiThreshold", 0.4)
    verdict = "HIGH" if final_score > HIGH_THRESHOLD else ("MEDIUM" if final_score > MEDIUM_THRESHOLD else "LOW")
    if ent_type in ALWAYS_EXEMPT:
        verdict = "LOW"; final_score = min(final_score, 0.35)
    if signals.get("public_figure"):
        verdict = "LOW"; final_score = min(final_score, 0.30)
    if final_score < threshold:
        verdict = "LOW"

    return {
        "entity":ent_text,"type":ent_type,"risk_score":f"{final_score:.2f}",
        "verdict":verdict,"signals":signals,"is_public":signals.get("public_figure",False),
        "start_index":entity.start,"end_index":entity.end,
    }


def custom_redact_pii(text, pii_details, start_offset):
    if not ACTIVE_SETTINGS.get("autoRedact", True):
        return text[start_offset:].strip() if start_offset else text.strip()
    sorted_details = sorted(pii_details, key=lambda x: x['start_index'], reverse=True)
    modified = list(text)
    for d in sorted_details:
        is_public  = d.get("is_public",False) or d["signals"].get("public_figure",False)
        is_exempt  = d["type"] in ALWAYS_EXEMPT
        is_private = d["type"] in PRIVATE_TYPES
        if is_private and d["verdict"]=="HIGH" and not is_public and not is_exempt:
            modified[d['start_index']:d['end_index']] = list(f"<{d['type']}>")
    return "".join(modified)[start_offset:].strip()


# ============================================================
# PER-USER FIRESTORE HELPERS
# ============================================================
def _user_ref(uid: str):
    return db.collection("users").document(_safe_uid(uid))

def write_chat_message(role: str, text: str, uid: str = "anonymous",
                       source: str = "Internal Chat", session_id: str = "default"):
    payload = {
        "role":        role,
        "uid":         uid,
        "source":      source,
        "session_id":  session_id,
        "created_at":  firestore.SERVER_TIMESTAMP if db else datetime.now().isoformat(),
        "ts_unix":     time.time(),
        "enc":         is_encryption_on(),
        "text_sha256": sha256_text(text),
        "text":        encrypt_data(text),
    }
    if db:
        try:
            _user_ref(uid).collection("chat_history").add(payload)
            _update_session_meta(uid, session_id, role, text, source)
        except Exception as e:
            print(f"chat_history write error ({uid}): {e}")
    else:
        payload["created_at"] = datetime.now().isoformat()
        USER_SCAN_LOGS[uid].appendleft({
            "timestamp": datetime.now().strftime("%H:%M:%S"),
            "source": source, "snippet": text[:60],
            "status": "Safe", "risk": "Chat", "user": uid,
            "session_id": session_id,
        })


def _update_session_meta(uid: str, session_id: str, role: str, text: str, source: str):
    if not db:
        return
    try:
        sref = _user_ref(uid).collection("chat_sessions").document(session_id)
        doc  = sref.get()
        now  = time.time()
        if not doc.exists:
            title = text[:55] + ("…" if len(text) > 55 else "") if role == "user" else "New conversation"
            sref.set({
                "session_id":  session_id,
                "uid":         uid,
                "source":      source,
                "title":       title,
                "created_at":  firestore.SERVER_TIMESTAMP,
                "updated_at":  now,
                "msg_count":   1,
                "risk_count":  0,
                "pii_count":   0,
            })
        else:
            sref.update({
                "updated_at": now,
                "msg_count":  firestore.Increment(1),
            })
    except Exception as e:
        print(f"Session meta update error ({uid}/{session_id}): {e}")


def log_activity(text, source, status, risk_type, uid: str = "anonymous", session_id: str = "default"):
    us = USER_STATS[uid]
    us["total_scans"] = us.get("total_scans", 0) + 1
    if status == "Risk":
        if "PII"          in risk_type: us["pii_blocked"]          = us.get("pii_blocked",0) + 1
        if "Hallucination" in risk_type: us["hallucinations_found"] = us.get("hallucinations_found",0) + 1
    else:
        us["verified_safe"] = us.get("verified_safe",0) + 1

    snippet = (text[:50] + "...") if (text and len(text) > 50) else (text or "")
    entry = {
        "timestamp":  datetime.now().strftime("%H:%M:%S"),
        "source":     source,
        "snippet":    encrypt_data(snippet),
        "status":     status,
        "risk":       risk_type,
        "uid":        uid,
        "session_id": session_id,
        "ts_unix":    time.time(),
        "enc":        is_encryption_on(),
    }

    if db:
        try:
            uref = _user_ref(uid)
            uref.collection("scan_logs").add({**entry, "created_at": firestore.SERVER_TIMESTAMP})
            uref.collection("meta").document("stats").set(
                {**us, "updated_at": firestore.SERVER_TIMESTAMP}
            )
            if status == "Risk" and session_id and session_id != "default":
                try:
                    sref = uref.collection("chat_sessions").document(session_id)
                    updates = {}
                    if "PII" in risk_type:           updates["pii_count"]  = firestore.Increment(1)
                    if "Hallucination" in risk_type: updates["risk_count"] = firestore.Increment(1)
                    if updates: sref.update(updates)
                except Exception: pass
        except Exception as e:
            print(f"scan_logs write error ({uid}): {e}")
    else:
        entry["id"] = str(uuid.uuid4())[:8]
        USER_SCAN_LOGS[uid].appendleft(entry)
        GLOBAL_SCAN_LOGS.appendleft(entry)


# ============================================================
# HEALTH
# ============================================================
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "healthy":    bool(GEMINI_API_KEY),
        "gemini":     bool(GEMINI_API_KEY),
        "firebase":   db is not None,
        "encryption": is_encryption_on(),
        "version":    "2.9.0",
        "timestamp":  datetime.now().isoformat(),
    })


# ============================================================
# SETTINGS
# ============================================================
@app.route('/api/settings', methods=['GET','POST','OPTIONS'])
def settings_endpoint():
    if request.method == 'OPTIONS':
        return '', 204
    global ACTIVE_SETTINGS
    if request.method == 'GET':
        return jsonify({"settings": ACTIVE_SETTINGS})
    data    = request.get_json() or {}
    allowed = {"rag","urlCheck","encryption","autoRedact","publicFigure","piiThreshold"}
    for k, v in data.items():
        if k in allowed:
            ACTIVE_SETTINGS[k] = v
    if db:
        try:
            db.collection("system").document("settings").set(
                {**ACTIVE_SETTINGS, "updated_at": firestore.SERVER_TIMESTAMP}
            )
        except Exception as e:
            print(f"Settings write error: {e}")
    return jsonify({"settings": ACTIVE_SETTINGS, "message": "Settings updated"})


# ============================================================
# AUTH
# ============================================================
_DEMO_USERS = {
    "admin@trustguard.io": {
        "hash":     hash_password("howyoudoin"),
        "name":     "Admin User",
        "role":     "Administrator",
        "clearance":"Administrator",
        "avatar":   "AU",
        "uid":      "admin_uid",
    },
}

def verify_firebase_token(id_token):
    if not firebase_admin._apps:
        return None
    try:
        from firebase_admin import auth as fb_auth
        return fb_auth.verify_id_token(id_token)
    except Exception as e:
        print(f"Firebase token verify failed: {e}")
        return None

def _init_user_in_firestore(uid: str, profile: dict):
    if not db:
        return
    try:
        uref = _user_ref(uid)
        doc  = uref.get()
        if not doc.exists:
            uref.set({
                **profile,
                "uid":        uid,
                "created_at": firestore.SERVER_TIMESTAMP,
            })
            print(f"✅ Firestore user profile created: {uid}")
    except Exception as e:
        print(f"Profile init error ({uid}): {e}")


@app.route('/api/auth/firebase-verify', methods=['POST','OPTIONS'])
def firebase_verify():
    if request.method == 'OPTIONS':
        return '', 204
    ip = request.remote_addr
    if is_rate_limited(ip):
        return jsonify({"error": "Rate limit exceeded."}), 429
    data     = request.get_json()
    id_token = data.get('idToken','')
    if not id_token:
        return jsonify({"error": "No ID token"}), 400
    decoded = verify_firebase_token(id_token)
    if not decoded:
        audit("FIREBASE_VERIFY_FAILED","Invalid token",ip=ip)
        return jsonify({"error": "Invalid token"}), 401

    uid   = decoded.get('uid','')
    email = decoded.get('email','')
    name  = decoded.get('name', email.split('@')[0] if email else 'User')
    profile = {}
    if db:
        try:
            snap = _user_ref(uid).get()
            if snap.exists:
                profile = snap.to_dict()
        except Exception:
            pass

    _init_user_in_firestore(uid, {"name": name, "email": email,
                                   "role": profile.get('role','Analyst'),
                                   "clearance": profile.get('clearance','Analyst')})
    token = str(uuid.uuid4())
    SESSIONS[token] = {
        "uid": uid, "email": email,
        "name":      profile.get('name', name),
        "role":      profile.get('role','Analyst'),
        "clearance": profile.get('clearance','Analyst'),
        "avatar":    (profile.get('name', name) or 'U')[:2].upper(),
        "created_at":datetime.now().isoformat(), "scan_count":0,
    }
    audit("FIREBASE_LOGIN", f"Firebase login: {email}", ip=ip, user=email)
    return jsonify({"token": token,
                    "user":  {k:v for k,v in SESSIONS[token].items() if k != "created_at"}})


@app.route('/api/auth/login', methods=['POST','OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return '', 204
    ip = request.remote_addr
    if is_rate_limited(ip):
        return jsonify({"error": "Rate limit exceeded."}), 429
    data  = request.get_json()
    email = data.get('email','')
    pw    = data.get('password','')
    u     = _DEMO_USERS.get(email)
    if not u or u["hash"] != hash_password(pw):
        audit("LOGIN_FAILED", f"Bad login: {email}", ip=ip)
        return jsonify({"error": "Invalid credentials"}), 401
    uid   = u["uid"]
    token = str(uuid.uuid4())
    SESSIONS[token] = {
        "uid": uid, "email": email,
        "name": u["name"], "role": u["role"],
        "clearance": u["clearance"], "avatar": u["avatar"],
        "created_at": datetime.now().isoformat(), "scan_count": 0,
    }
    _init_user_in_firestore(uid, {"name":u["name"],"email":email,
                                   "role":u["role"],"clearance":u["clearance"]})
    audit("LOGIN_SUCCESS", f"Login: {email}", ip=ip, user=email)
    return jsonify({"token": token,
                    "user":  {k:v for k,v in SESSIONS[token].items() if k != "created_at"}})


@app.route('/api/auth/register', methods=['POST','OPTIONS'])
def register():
    if request.method == 'OPTIONS':
        return '', 204
    ip   = request.remote_addr
    data = request.get_json()
    email, pw, name, org_key = (
        data.get('email',''), data.get('password',''),
        data.get('name',''),  data.get('orgKey','')
    )
    if org_key != 'TRUSTGUARD-ENT-2025':
        return jsonify({"error": "Invalid enterprise key"}), 403
    if len(pw) < 8:
        return jsonify({"error": "Password must be 8+ characters"}), 400

    uid   = _safe_uid(email)
    token = str(uuid.uuid4())
    user_data = {"email":email,"name":name,"role":"Analyst",
                 "clearance":"Analyst","avatar":name[:2].upper(),"scan_count":0}
    SESSIONS[token] = {"uid": uid, **user_data, "created_at": datetime.now().isoformat()}
    _init_user_in_firestore(uid, {"name":name,"email":email,"role":"Analyst","clearance":"Analyst",
                                   "createdAt": datetime.now().isoformat()})
    audit("REGISTER_SUCCESS", f"New user: {email}", ip=ip, user=email)
    return jsonify({"token": token, "user": {**user_data, "uid": uid}})


@app.route('/api/auth/token-verify', methods=['GET','OPTIONS'])
def token_verify():
    if request.method == 'OPTIONS':
        return '', 204
    auth  = request.headers.get("Authorization", "")
    token = auth.replace("Bearer ", "").strip()
    if not token:
        return jsonify({"error": "No token provided"}), 401
    if token not in SESSIONS:
        return jsonify({"error": "Token not found — please log in to TrustGuard first"}), 401
    sess = SESSIONS[token]
    return jsonify({
        "valid": True,
        "uid":   sess.get("uid"),
        "name":  sess.get("name"),
        "email": sess.get("email"),
        "role":  sess.get("role"),
    })


@app.route('/api/auth/refresh', methods=['POST','OPTIONS'])
def refresh_session():
    if request.method == 'OPTIONS':
        return '', 204
    data     = request.get_json() or {}
    id_token = data.get('idToken', '')
    if not id_token:
        return jsonify({"error": "No Firebase ID token provided"}), 400
    decoded = verify_firebase_token(id_token)
    if not decoded:
        return jsonify({"error": "Invalid Firebase token — please log in again"}), 401

    uid   = decoded.get('uid', '')
    email = decoded.get('email', '')
    name  = decoded.get('name', email.split('@')[0] if email else 'User')
    profile = {}
    if db:
        try:
            snap = _user_ref(uid).get()
            if snap.exists:
                profile = snap.to_dict()
        except Exception:
            pass

    token = str(uuid.uuid4())
    SESSIONS[token] = {
        "uid":       uid, "email":     email,
        "name":      profile.get('name', name),
        "role":      profile.get('role', 'Analyst'),
        "clearance": profile.get('clearance', 'Analyst'),
        "avatar":    (profile.get('name', name) or 'U')[:2].upper(),
        "created_at":datetime.now().isoformat(), "scan_count": 0,
    }
    print(f"🔄 Session refreshed for {email} [{uid[:12]}]")
    return jsonify({
        "token": token,
        "user":  {k: v for k, v in SESSIONS[token].items() if k != "created_at"}
    })


@app.route('/api/auth/logout', methods=['POST','OPTIONS'])
def do_logout():
    if request.method == 'OPTIONS':
        return '', 204
    token = request.headers.get('Authorization','').replace('Bearer ','')
    if token in SESSIONS:
        audit("LOGOUT", f"Logout: {SESSIONS[token].get('email','?')}", ip=request.remote_addr)
        del SESSIONS[token]
    return jsonify({"message": "Logged out"})


# ============================================================
# CHAT
# ============================================================
@app.route('/api/chat', methods=['POST','OPTIONS'])
def internal_chat():
    if request.method == 'OPTIONS':
        return '', 204
    ip = request.remote_addr
    if is_rate_limited(ip):
        return jsonify({"response": "⚠ Rate limit exceeded."}), 429
    uid      = get_uid_from_request()
    data     = request.get_json() or {}
    user_msg = (data.get('message') or "").strip()
    source   = data.get('source', 'Internal Chat')
    if not user_msg:
        return jsonify({"response": "Empty message"}), 400

    session_id = data.get('session_id', 'default')
    write_chat_message("user", user_msg, uid=uid, source=source, session_id=session_id)

    try:
        cls = invoke_with_retry(intent_model, [CLASSIFIER_SYSTEM_PROMPT, user_msg]).content.strip().upper()
    except Exception:
        cls = "CONVERSATIONAL"

    user_prefs  = _get_user_prefs(uid)
    system_text = _build_system_prompt_with_memory(user_prefs, uid)

    try:
        bot_text = invoke_with_retry(chat_model, [
            SystemMessage(content=system_text),
            user_msg
        ]).content.strip()
        write_chat_message("bot", bot_text, uid=uid, source=source, session_id=session_id)
        log_activity(user_msg, source, "Safe", f"Chat ({cls})", uid=uid, session_id=session_id)

        import threading
        t = threading.Thread(
            target=_extract_memories_from_exchange,
            args=(user_msg, bot_text, uid),
            daemon=True
        )
        t.start()

        return jsonify({"response": bot_text, "intent": cls})
    except Exception as e:
        return jsonify({"response": f"Engine error: {e}", "intent": "ERROR"}), 500


# ============================================================
# ANALYZE
# ============================================================
@app.route('/analyze', methods=['POST', 'OPTIONS'])
def analyze():
    if request.method == 'OPTIONS':
        return '', 204
    ip = request.remote_addr
    if is_rate_limited(ip):
        return jsonify({"error": "Rate limited"}), 429
    uid  = get_uid_from_request()
    data = request.get_json() or {}
    text_to_analyze = data.get('text','') or ''
    original_query  = data.get('user_query','') or ''

    results = {
        "hallucination_info": {"detected":False,"reason":"N/A","correction":"N/A"},
        "pii_info":           {"detected":False,"details":[],"refined_text":text_to_analyze},
        "url_check":          [],
    }

    try:
        cls        = invoke_with_retry(intent_model, [CLASSIFIER_SYSTEM_PROMPT, original_query]).content.strip().upper()
        is_factual = (cls == "FACTUAL")
    except Exception:
        is_factual = True

    combined  = f"{original_query} |::SEPARATOR::| {text_to_analyze}" if original_query else text_to_analyze
    sep_idx   = combined.find(" |::SEPARATOR::| ")
    start_idx = sep_idx + len(" |::SEPARATOR::| ") if sep_idx != -1 else 0

    threshold = ACTIVE_SETTINGS.get("piiThreshold", 0.4)
    pii_hits  = analyzer.analyze(text=combined, language="en", score_threshold=threshold)

    verified_pii = []
    high_risk    = False
    for hit in pii_hits:
        ed = verify_pii_entity(combined, hit, analysis_model)
        if ed:
            verified_pii.append(ed)
            if ed['verdict']=='HIGH' and ed['type'] in PRIVATE_TYPES and not ed.get('is_public',False):
                high_risk = True
                us = USER_STATS[uid]
                us["top_pii_types"] = us.get("top_pii_types",{})
                us["top_pii_types"][ed['type']] = us["top_pii_types"].get(ed['type'],0) + 1

    results["pii_info"]["details"] = verified_pii
    if verified_pii:
        results["pii_info"]["detected"]     = True
        results["pii_info"]["refined_text"] = custom_redact_pii(combined, verified_pii, start_idx)
        if high_risk:
            results["hallucination_info"] = {
                "detected":True,
                "reason":"Policy Violation: High-risk private PII detected.",
                "correction": results["pii_info"]["refined_text"],
            }
            log_activity(text_to_analyze,"Internal Chat","Risk","Output PII", uid=uid)
            return jsonify(results)

    if is_factual and ACTIVE_SETTINGS.get("rag",True):
        context = ""
        if google_search_wrapper:
            try:
                res = google_search_wrapper.results(original_query, num_results=5)
                context += "--- GOOGLE ---\n" + "\n".join(r.get('snippet','') for r in res) + "\n"
            except Exception: pass
        if wiki_retriever:
            try:
                docs = wiki_retriever.invoke(original_query)
                context += "--- WIKI ---\n" + "\n".join(d.page_content for d in docs) + "\n"
            except Exception: pass
        if arxiv_retriever:
            try:
                docs = arxiv_retriever.invoke(original_query)
                context += "--- ARXIV ---\n" + "\n".join(d.page_content for d in docs) + "\n"
            except Exception: pass

        links       = extract_links(text_to_analyze)
        url_results = []
        if ACTIVE_SETTINGS.get("urlCheck", True):
            for link in links:
                url_results.append({"url":link,"status":check_url_validity(link)})
        results["url_check"] = url_results
        if links:
            context += "\n--- URL CHECK ---\n" + "\n".join(f"{r['url']}: {r['status']}" for r in url_results)

        if context.strip():
            verify_prompt = f"""
Context (live sources):
{context}

Statement: "{text_to_analyze}"

Respond exactly:
Verification: [Supported/Contradicted/Not Mentioned]
Reasoning: [Brief]
Correction/Refinement: [Corrected version or N/A]
"""
            try:
                resp = invoke_with_retry(analysis_model, verify_prompt).content or ""
                if "Contradicted" in resp or "Not Mentioned" in resp:
                    results["hallucination_info"]["detected"] = True
                    results["hallucination_info"]["reason"]   = resp
                    m = re.search(r"Correction/Refinement:\s*(.+?)(?:\n|$)", resp, re.DOTALL)
                    if m:
                        _extracted = m.group(1).strip()
                        if _extracted and _extracted not in ("N/A","None","n/a","none"):
                            results["hallucination_info"]["correction"] = _extracted
                    _corr = (results["hallucination_info"].get("correction") or "").strip()
                    _bad  = {"N/A", "None", "none", "n/a", "N/a", ""}
                    if not _corr or _corr in _bad:
                        _prompt = original_query if original_query else f"What is the correct answer to: {text_to_analyze}"
                        try:
                            corr = invoke_with_retry(correction_model, [
                                SystemMessage(content=(
                                    "You are a factual correction engine. "
                                    "Provide the correct, concise factual answer. Be direct. No preamble."
                                )),
                                f"User question: {_prompt}\n\nIncorrect/unverified answer: {text_to_analyze}\n\nCorrect answer:"
                            ])
                            results["hallucination_info"]["correction"] = (corr.content or "").strip()
                        except Exception as _ce:
                            print(f"Correction model error: {_ce}")
                    log_activity(text_to_analyze,"Internal Chat","Risk","Hallucination", uid=uid)
                else:
                    log_activity(text_to_analyze,"Internal Chat","Safe","Verified Fact", uid=uid)
            except Exception as e:
                print(f"Verification error: {e}")
    return jsonify(results)


# ============================================================
# STATS
# ============================================================
@app.route('/stats', methods=['GET','OPTIONS'])
def get_stats():
    if request.method == 'OPTIONS':
        return '', 204
    uid = get_uid_from_request()
    decrypted_logs = []
    current_stats  = dict(USER_STATS[uid])

    if db:
        try:
            uref = _user_ref(uid)
            stats_doc = uref.collection("meta").document("stats").get()
            if stats_doc.exists:
                current_stats = stats_doc.to_dict() or current_stats
            current_stats.pop("updated_at", None)
            docs = (uref.collection("scan_logs")
                    .order_by("ts_unix", direction=firestore.Query.DESCENDING)
                    .limit(50).stream())
            for d in docs:
                log = d.to_dict() or {}
                log['id']      = d.id
                log['snippet'] = decrypt_data(log.get('snippet',''))
                log.pop('created_at', None)
                decrypted_logs.append(log)
        except Exception as e:
            print(f"Stats read error ({uid}): {e}")
    else:
        for log in USER_SCAN_LOGS[uid]:
            dl = dict(log)
            dl['snippet'] = decrypt_data(dl.get('snippet',''))
            decrypted_logs.append(dl)

    return jsonify({"stats": current_stats, "logs": decrypted_logs})


# ============================================================
# CHAT HISTORY
# ============================================================
@app.route('/api/chat/history', methods=['GET','OPTIONS'])
def chat_history():
    if request.method == 'OPTIONS':
        return '', 204
    uid   = get_uid_from_request()
    limit = int(request.args.get("limit","50"))
    limit = max(1, min(limit, 200))
    out   = []

    if db:
        try:
            docs = (_user_ref(uid).collection("chat_history")
                    .order_by("ts_unix", direction=firestore.Query.DESCENDING)
                    .limit(limit).stream())
            for d in docs:
                m = d.to_dict() or {}
                out.append({
                    "id":         d.id,
                    "role":       m.get("role"),
                    "uid":        m.get("uid"),
                    "source":     m.get("source","Internal Chat"),
                    "session_id": m.get("session_id","default"),
                    "ts_unix":    m.get("ts_unix"),
                    "created_at": str(m.get("created_at","")),
                    "text":       decrypt_data(m.get("text","")),
                    "enc":        bool(m.get("enc",False)),
                })
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    else:
        return jsonify({"messages": []})

    out.reverse()
    return jsonify({"messages": out, "uid": uid})


# ============================================================
# CHAT SESSIONS
# ============================================================
@app.route('/api/chat/sessions', methods=['GET','OPTIONS'])
def chat_sessions():
    if request.method == 'OPTIONS':
        return '', 204
    uid = get_uid_from_request()
    sessions = []
    if db:
        try:
            docs = (_user_ref(uid).collection("chat_sessions")
                    .order_by("updated_at", direction=firestore.Query.DESCENDING)
                    .limit(50).stream())
            for d in docs:
                s = d.to_dict() or {}
                sessions.append({
                    "session_id": d.id,
                    "title":      s.get("title", "Untitled conversation"),
                    "source":     s.get("source", "Internal Chat"),
                    "msg_count":  s.get("msg_count", 0),
                    "risk_count": s.get("risk_count", 0),
                    "pii_count":  s.get("pii_count", 0),
                    "updated_at": s.get("updated_at", 0),
                })
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    else:
        seen = {}
        for log in USER_SCAN_LOGS[uid]:
            sid = log.get("session_id", "default")
            if sid not in seen:
                seen[sid] = {"session_id": sid, "title": log.get("snippet","Chat")[:50],
                             "source": log.get("source","Internal Chat"),
                             "msg_count": 0, "risk_count": 0, "pii_count": 0, "updated_at": log.get("ts_unix",0)}
            seen[sid]["msg_count"] += 1
            if log.get("status") == "Risk":
                seen[sid]["risk_count"] += 1
        sessions = list(seen.values())
    return jsonify({"sessions": sessions, "uid": uid})


@app.route('/api/chat/session/<session_id>', methods=['GET','OPTIONS'])
def chat_session_messages(session_id):
    if request.method == 'OPTIONS':
        return '', 204
    uid   = get_uid_from_request()
    out   = []
    if db:
        try:
            docs = (_user_ref(uid).collection("chat_history")
                    .order_by("ts_unix")
                    .limit(500)
                    .stream())
            for d in docs:
                m = d.to_dict() or {}
                if m.get("session_id") != session_id:
                    continue
                out.append({
                    "id":         d.id,
                    "role":       m.get("role"),
                    "text":       decrypt_data(m.get("text", "")),
                    "source":     m.get("source", "Internal Chat"),
                    "session_id": m.get("session_id", ""),
                    "ts_unix":    m.get("ts_unix"),
                    "enc":        bool(m.get("enc", False)),
                })
        except Exception as e:
            return jsonify({"error": str(e), "messages": []}), 500
    else:
        for log in USER_SCAN_LOGS[uid]:
            if log.get("session_id") == session_id:
                out.append({
                    "id": str(uuid.uuid4())[:8], "role": "user",
                    "text": decrypt_data(log.get("snippet", "")),
                    "source": log.get("source", ""), "session_id": session_id,
                    "ts_unix": log.get("ts_unix", 0), "enc": bool(log.get("enc", False)),
                })
    return jsonify({"messages": out, "session_id": session_id, "uid": uid})


# ============================================================
# MEMORY
# ============================================================
def _load_memories(uid: str) -> list:
    if uid in MEMORY_CACHE:
        return MEMORY_CACHE[uid]
    memories = []
    if db:
        try:
            docs = (_user_ref(uid).collection("memories")
                    .order_by("ts_unix", direction=firestore.Query.DESCENDING)
                    .limit(MEMORY_LIMIT).stream())
            for d in docs:
                m = d.to_dict() or {}
                memories.append({
                    "id":         d.id,
                    "text":       decrypt_data(m.get("text", "")),
                    "ts_unix":    m.get("ts_unix", 0),
                    "created_at": str(m.get("created_at", "")),
                })
            memories.reverse()
        except Exception as e:
            print(f"⚠️  _load_memories [{uid[:12]}]: {e}")
    MEMORY_CACHE[uid] = memories
    return memories


def _save_memory(uid: str, text: str) -> dict:
    text = text.strip()
    if not text or uid == "anonymous":
        return None
    memories = _load_memories(uid)
    if any(m["text"].lower().strip() == text.lower() for m in memories):
        return None
    if len(memories) >= MEMORY_LIMIT:
        return None

    ts     = time.time()
    doc_id = str(uuid.uuid4())[:16]
    entry  = {
        "uid": uid, "text": encrypt_data(text),
        "ts_unix": ts, "enc": is_encryption_on(),
        "created_at": firestore.SERVER_TIMESTAMP if db else datetime.now().isoformat(),
    }
    if db:
        try:
            _user_ref(uid).collection("memories").document(doc_id).set(entry)
        except Exception as e:
            print(f"⚠️  _save_memory write [{uid[:12]}]: {e}")

    cache_entry = {"id": doc_id, "text": text, "ts_unix": ts}
    MEMORY_CACHE[uid] = MEMORY_CACHE.get(uid, []) + [cache_entry]
    return cache_entry


def _delete_memory(uid: str, memory_id: str) -> bool:
    if db:
        try:
            _user_ref(uid).collection("memories").document(memory_id).delete()
        except Exception as e:
            print(f"⚠️  _delete_memory [{uid[:12]}]: {e}")
            return False
    if uid in MEMORY_CACHE:
        MEMORY_CACHE[uid] = [m for m in MEMORY_CACHE[uid] if m["id"] != memory_id]
    return True


def _clear_all_memories(uid: str) -> int:
    count = 0
    if db:
        try:
            docs = _user_ref(uid).collection("memories").stream()
            for d in docs:
                d.reference.delete()
                count += 1
        except Exception as e:
            print(f"⚠️  _clear_all_memories [{uid[:12]}]: {e}")
    cache_count = len(MEMORY_CACHE.get(uid, []))
    MEMORY_CACHE[uid] = []
    return max(count, cache_count)


def _extract_memories_from_exchange(user_msg: str, bot_response: str, uid: str):
    if uid == "anonymous":
        return
    extraction_prompt = (
        'You are a memory extraction assistant. Read this conversation exchange and extract ONLY '
        'facts worth remembering about the user long-term.\n\n'
        f'User said: "{user_msg[:400]}"\n'
        f'Assistant replied: "{bot_response[:400]}"\n\n'
        'Rules:\n'
        '- Each memory MUST be a complete sentence about the USER\n'
        '- Only extract facts EXPLICITLY STATED — never infer\n'
        '- Skip trivial chat\n'
        '- Maximum 3 memories per exchange\n'
        '- If nothing worth remembering, return exactly: NONE\n\n'
        'Output one memory per line, no bullets, no numbers.'
    )
    try:
        resp = invoke_with_retry(
            ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.1, google_api_key=GEMINI_API_KEY),
            extraction_prompt
        ).content.strip()
        if not resp or resp.strip().upper() == "NONE":
            return
        lines = [l.strip() for l in resp.split("\n")
                 if l.strip() and l.strip().upper() != "NONE"
                    and not l.strip().startswith("#") and len(l.strip()) > 10]
        for line in lines[:3]:
            _save_memory(uid, line)
    except Exception as e:
        print(f"⚠️  Memory extraction error [{uid[:12]}]: {e}")


@app.route('/api/memory', methods=['GET','OPTIONS'])
def get_memories():
    if request.method == 'OPTIONS':
        return '', 204
    uid = get_uid_from_request()
    if uid == "anonymous":
        return jsonify({"error": "Not authenticated"}), 401
    memories = _load_memories(uid)
    used = len(memories)
    return jsonify({"memories": memories, "count": used, "limit": MEMORY_LIMIT,
                    "pct_used": round((used / MEMORY_LIMIT) * 100), "full": used >= MEMORY_LIMIT})


@app.route('/api/memory', methods=['POST'])
def add_memory_route():
    uid  = get_uid_from_request()
    if uid == "anonymous":
        return jsonify({"error": "Not authenticated"}), 401
    data = request.get_json() or {}
    text = (data.get("text") or "").strip()
    if not text:
        return jsonify({"error": "Memory text is required"}), 400
    if len(text) > 500:
        return jsonify({"error": "Memory too long (max 500 chars)"}), 400
    if len(_load_memories(uid)) >= MEMORY_LIMIT:
        return jsonify({"error": f"Memory full ({MEMORY_LIMIT} entries). Delete some first."}), 400
    entry = _save_memory(uid, text)
    if not entry:
        return jsonify({"error": "Duplicate or could not save"}), 400
    return jsonify({"memory": entry, "message": "Memory saved"})


@app.route('/api/memory/<memory_id>', methods=['DELETE','OPTIONS'])
def delete_memory_route(memory_id):
    if request.method == 'OPTIONS':
        return '', 204
    uid = get_uid_from_request()
    if uid == "anonymous":
        return jsonify({"error": "Not authenticated"}), 401
    ok = _delete_memory(uid, memory_id)
    return jsonify({"deleted": ok, "id": memory_id})


@app.route('/api/memory/clear', methods=['POST','OPTIONS'])
def clear_memories_route():
    if request.method == 'OPTIONS':
        return '', 204
    uid = get_uid_from_request()
    if uid == "anonymous":
        return jsonify({"error": "Not authenticated"}), 401
    count = _clear_all_memories(uid)
    return jsonify({"deleted": count, "message": f"Cleared {count} memories"})


# ============================================================
# PERSONALIZATION
# ============================================================
@app.route('/api/personalization', methods=['GET','POST','OPTIONS'])
def personalization():
    if request.method == 'OPTIONS':
        return '', 204
    uid = get_uid_from_request()
    if uid == "anonymous":
        return jsonify({"error": "Not authenticated",
                        "hint": "Token missing or server restarted. Re-login to get a fresh token."}), 401

    if request.method == 'GET':
        prefs = {}
        if db:
            try:
                doc = _user_ref(uid).collection("meta").document("personalization").get()
                if doc.exists:
                    prefs = doc.to_dict() or {}
                    prefs.pop("updated_at", None)
            except Exception as e:
                print(f"Personalization GET error ({uid}): {e}")
        return jsonify({"prefs": prefs})

    data    = request.get_json() or {}
    allowed = {"nickname","occupation","about","style","tone","warm","enthusiastic","headersLists","emoji","customInstructions"}
    prefs   = {k: v for k, v in data.items() if k in allowed}
    USER_PREFS_CACHE[uid] = prefs

    if db:
        try:
            _user_ref(uid).collection("meta").document("personalization").set(
                {**prefs, "updated_at": firestore.SERVER_TIMESTAMP}
            )
        except Exception as e:
            print(f"⚠️  Personalization Firestore error ({uid}): {e}")

    return jsonify({"prefs": prefs, "message": "Personalization saved"})


def _get_user_prefs(uid: str) -> dict:
    if not uid or uid == "anonymous":
        return {}
    if uid in USER_PREFS_CACHE:
        return USER_PREFS_CACHE[uid]
    if db:
        try:
            doc = _user_ref(uid).collection("meta").document("personalization").get()
            if doc.exists:
                prefs = {k: v for k, v in (doc.to_dict() or {}).items() if k != "updated_at"}
                USER_PREFS_CACHE[uid] = prefs
                return prefs
        except Exception as e:
            print(f"⚠️  _get_user_prefs [{uid[:12]}]: Firestore error — {e}")
    return {}


def _build_system_prompt(prefs: dict) -> str:
    sections = ["You are TrustGuard AI, a helpful assistant embedded in an enterprise AI safety platform."]
    nickname   = (prefs.get("nickname")   or "").strip()
    occupation = (prefs.get("occupation") or "").strip()
    about      = (prefs.get("about")      or "").strip()
    if nickname or occupation or about:
        identity_parts = ["ABOUT THE USER YOU ARE TALKING TO:"]
        if nickname:
            identity_parts.append(f'- Their name is "{nickname}". Address them as "{nickname}" naturally.')
        if occupation:
            identity_parts.append(f"- They work as: {occupation}. Adapt terminology accordingly.")
        if about:
            identity_parts.append(f"- Additional context: {about}")
        sections.append("\n".join(identity_parts))
    style = prefs.get("style", "balanced")
    style_map = {
        "concise":  "RESPONSE LENGTH: Be concise and direct. No preamble.",
        "detailed": "RESPONSE LENGTH: Be thorough. Include context, reasoning, and examples.",
        "balanced": "RESPONSE LENGTH: Use balanced length — complete but not overwhelming.",
    }
    sections.append(style_map.get(style, style_map["balanced"]))
    tone = prefs.get("tone", "neutral")
    tone_map = {
        "formal":  "TONE: Strictly professional. No contractions, no slang.",
        "casual":  "TONE: Casual and conversational. Like talking to a smart friend.",
        "neutral": "TONE: Neutral, professional-but-friendly.",
    }
    sections.append(tone_map.get(tone, tone_map["neutral"]))
    chars = []
    if prefs.get("warm"):        chars.append("Be warm and empathetic.")
    if prefs.get("enthusiastic"):chars.append("Show genuine enthusiasm.")
    if prefs.get("headersLists"):chars.append("Use headers and bullet lists for longer responses.")
    else:                         chars.append("Use flowing prose, not bullet lists, unless content is enumerable.")
    if prefs.get("emoji"):       chars.append("Add relevant emoji occasionally but sparingly.")
    if chars:
        sections.append("STYLE CHARACTERISTICS:\n" + "\n".join(f"- {c}" for c in chars))
    custom = (prefs.get("customInstructions") or "").strip()
    if custom:
        sections.append(f"CRITICAL — USER'S PERSONAL INSTRUCTIONS (override everything):\n{custom}")
    sections.append("Always be accurate and honest. Never make up facts.")
    return "\n\n".join(sections)


def _build_system_prompt_with_memory(prefs: dict, uid: str) -> str:
    base     = _build_system_prompt(prefs)
    memories = _load_memories(uid)
    if not memories:
        return base
    memory_lines = "\n".join(f"- {m['text']}" for m in memories[-40:])
    memory_section = (
        "THINGS YOU REMEMBER ABOUT THIS USER (from previous conversations):\n"
        "Use this context naturally when relevant.\n"
        f"{memory_lines}"
    )
    return base + "\n\n" + memory_section


@app.route('/api/personalization/debug', methods=['GET','OPTIONS'])
def personalization_debug():
    if request.method == 'OPTIONS':
        return '', 204
    uid    = get_uid_from_request()
    prefs  = _get_user_prefs(uid)
    prompt = _build_system_prompt(prefs)
    return jsonify({"uid": uid, "prefs": prefs, "cache_hit": uid in USER_PREFS_CACHE,
                    "has_prefs": bool(prefs), "system_prompt": prompt, "prompt_len": len(prompt)})


# ============================================================
# VERIFY
# ============================================================
@app.route('/verify', methods=['POST', 'OPTIONS'])
def verify_response():
    if request.method == 'OPTIONS':
        return '', 204
    if is_rate_limited(request.remote_addr):
        return jsonify({"error": "Rate limited"}), 429

    uid  = get_uid_from_request()
    data = request.get_json() or {}
    text         = (data.get('text')       or '').strip()
    user_query   = (data.get('user_query') or '').strip()
    source_url   = (data.get('source_url') or '').strip()
    source_label = (data.get('source')     or (
        'ChatGPT' if 'chatgpt' in source_url else
        'Gemini'  if 'google'  in source_url else 'AI Tool'
    ))

    if not text:
        return jsonify({"error": "No text provided"}), 400

    results = {
        "hallucination_info": {"detected": False, "reason": "N/A", "correction": "N/A"},
        "pii_info":           {"detected": False, "details": [], "refined_text": text},
        "url_check":          [],
    }

    try:
        cls        = invoke_with_retry(intent_model, [CLASSIFIER_SYSTEM_PROMPT, user_query or text]).content.strip().upper()
        is_factual = (cls == "FACTUAL")
    except Exception:
        is_factual = True

    threshold = ACTIVE_SETTINGS.get("piiThreshold", 0.4)
    pii_hits  = analyzer.analyze(text=text, language="en", score_threshold=threshold)
    verified_pii = []
    for hit in pii_hits:
        ed = verify_pii_entity(text, hit, analysis_model)
        if ed:
            verified_pii.append(ed)
    if verified_pii:
        results["pii_info"]["detected"]     = True
        results["pii_info"]["details"]      = verified_pii
        results["pii_info"]["refined_text"] = custom_redact_pii(text, verified_pii, 0)

    if is_factual and ACTIVE_SETTINGS.get("rag", True):
        context = ""
        query   = user_query or text
        if google_search_wrapper:
            try:
                res = google_search_wrapper.results(query, num_results=5)
                context += "--- GOOGLE ---\n" + "\n".join(r.get('snippet','') for r in res) + "\n"
            except Exception: pass
        if wiki_retriever:
            try:
                docs = wiki_retriever.invoke(query)
                context += "--- WIKI ---\n" + "\n".join(d.page_content for d in docs) + "\n"
            except Exception: pass

        links = extract_links(text)
        url_results = []
        if ACTIVE_SETTINGS.get("urlCheck", True):
            for link in links:
                url_results.append({"url": link, "status": check_url_validity(link)})
        results["url_check"] = url_results

        if context.strip():
            verify_prompt = f"""
Context (live sources):
{context}

Statement: "{text}"

Respond exactly:
Verification: [Supported/Contradicted/Not Mentioned]
Reasoning: [Brief]
Correction/Refinement: [Corrected version or N/A]
"""
            try:
                resp = invoke_with_retry(analysis_model, verify_prompt).content or ""
                if "Contradicted" in resp or "Not Mentioned" in resp:
                    results["hallucination_info"]["detected"] = True
                    results["hallucination_info"]["reason"]   = resp
                    m = re.search(r"Correction/Refinement:\s*(.+?)(?:\n|$)", resp, re.DOTALL)
                    if m:
                        c = m.group(1).strip()
                        if c and c not in ("N/A","None","n/a"):
                            results["hallucination_info"]["correction"] = c
                    if not results["hallucination_info"].get("correction") or \
                       results["hallucination_info"]["correction"] in ("N/A","None","n/a",""):
                        try:
                            corr = invoke_with_retry(correction_model, [
                                SystemMessage(content="Provide the correct factual answer concisely."),
                                f"User question: {query}\nIncorrect answer: {text}\nCorrect answer:"
                            ])
                            results["hallucination_info"]["correction"] = (corr.content or "").strip()
                        except Exception: pass
                    log_activity(text, source_label, "Risk", "Hallucination", uid=uid)
                else:
                    log_activity(text, source_label, "Safe", "Verified Fact", uid=uid)
            except Exception as e:
                print(f"Verify RAG error: {e}")

    verify_id   = str(uuid.uuid4())
    VERIFY_STORE[verify_id] = {
        "analysis": results, "original_text": text, "user_query": user_query,
        "source": source_label, "source_url": source_url,
        "created_at": time.time(), "uid": uid,
    }
    _frontend = os.getenv("FRONTEND_URL", "https://trust-guard-phase2.vercel.app").split(",")[0].strip().rstrip("/")
    deep_link = f"{_frontend}/?verify={verify_id}"

    return jsonify({
        "verify_id": verify_id, "deep_link": deep_link,
        "analysis": results, "source": source_label, "source_url": source_url,
        "original_text": text, "refined_text": results["pii_info"].get("refined_text", text),
    })


@app.route('/verify/<verify_id>', methods=['GET','OPTIONS'])
def get_verify_result(verify_id):
    if request.method == 'OPTIONS':
        return '', 204
    result = VERIFY_STORE.get(verify_id)
    if not result:
        return jsonify({"error": "Verification result not found or expired"}), 404
    return jsonify(result)


# ============================================================
# SCAN
# ============================================================
@app.route('/scan', methods=['POST','OPTIONS'])
def scan_text():
    if request.method == 'OPTIONS':
        return '', 204
    if is_rate_limited(request.remote_addr):
        return jsonify({"pii_detected": False, "blocked": True}), 429

    uid  = get_uid_from_request()
    data = request.get_json() or {}
    text = (data.get('text') or '').strip()
    url  = data.get('source_url', '') or ''
    source = ("ChatGPT" if "chatgpt" in url else
              "Gemini"  if "gemini"  in url else
              "Claude"  if "claude"  in url else "Extension")

    if not text:
        return jsonify({"pii_detected": False})

    threshold = ACTIVE_SETTINGS.get("piiThreshold", 0.4)
    try:
        hits = analyzer.analyze(text=text, language="en", score_threshold=threshold)
    except Exception as e:
        print(f"⚠️ /scan Presidio error: {e}")
        return jsonify({"pii_detected": False})

    SCAN_PRIVATE = {"EMAIL_ADDRESS","PHONE_NUMBER","CREDIT_CARD","US_SSN","US_PASSPORT",
                    "US_DRIVER_LICENSE","IBAN_CODE","MEDICAL_LICENSE","US_BANK_NUMBER"}
    SCAN_SAFE    = {"NRP","LOCATION","ADDRESS","DATE_TIME","URL","IP_ADDRESS","ORG","TITLE","LANGUAGE"}

    real_pii = []
    for hit in hits:
        if hit.entity_type in SCAN_SAFE or hit.entity_type not in SCAN_PRIVATE or hit.score < 0.65:
            continue
        entity_text = text[hit.start:hit.end]
        if hit.entity_type == "EMAIL_ADDRESS":
            if not re.match(r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$', entity_text):
                continue
        if hit.entity_type == "PHONE_NUMBER":
            try:
                p = phonenumbers.parse(entity_text, "IN")
                if not phonenumbers.is_valid_number(p):
                    continue
            except Exception:
                continue
        real_pii.append({"type": hit.entity_type, "entity": entity_text, "score": round(hit.score, 3)})

    detected = len(real_pii) > 0
    if detected:
        log_activity(text[:200], source, "Risk", "PII in input", uid=uid)
    else:
        log_activity(text[:200], source, "Safe", "Input clean", uid=uid)

    return jsonify({"pii_detected": detected, "entities": real_pii})


@app.route("/")
def home():
    return jsonify({"status": "TrustGuard API running", "version": "2.9.0",
                    "firebase": db is not None, "encryption": is_encryption_on()})


# ============================================================
if __name__ == '__main__':
    port  = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_ENV", "production") == "development"
    print("=" * 60)
    print(f"  TrustGuard Backend v2.9.0  |  port={port}  debug={debug}")
    print(f"  Firebase: {'✅ connected' if db else '⚠️  in-memory mode'}")
    print(f"  Encryption: {'✅ enabled' if cipher_suite else '⚠️  disabled'}")
    print("=" * 60)
    app.run(host='0.0.0.0', port=port, debug=debug)