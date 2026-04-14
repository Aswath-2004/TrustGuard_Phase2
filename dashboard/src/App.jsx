import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Shield, Activity, MessageSquare, Lock, AlertTriangle, CheckCircle,
  Search, Send, FileText, X, Eye, EyeOff, LogOut, User,
  Zap, Globe, ChevronRight, BarChart2, Bell, Settings, Key,
  Mail, RefreshCw, ShieldCheck, AlertCircle, Wifi, WifiOff,
  ArrowRight, Fingerprint, Moon, Sun, TrendingUp, Info, Save,
  MessageCircle, Clock, Plus, Hash, ChevronDown, Edit3, Trash2,
  Sparkles, Database, Cpu, Radio, PenSquare, SidebarOpen, SidebarClose,
  MoreHorizontal, Filter, Download, ChevronLeft,
  Star, Brain, Trash
} from 'lucide-react';

// ─── GLOBAL STYLES ───────────────────────────────────────────
const GlobalStyles = ({ dark }) => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg:        ${dark ? '#0d0d0f' : '#f7f6f3'};
      --bg2:       ${dark ? '#141417' : '#eeece8'};
      --bg3:       ${dark ? '#1a1a1f' : '#e6e4df'};
      --surface:   ${dark ? '#1c1c22' : '#ffffff'};
      --surface2:  ${dark ? '#222228' : '#faf9f7'};
      --surface3:  ${dark ? '#2a2a32' : '#f3f1ed'};
      --border:    ${dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'};
      --border2:   ${dark ? 'rgba(255,255,255,0.11)' : 'rgba(0,0,0,0.11)'};
      --text:      ${dark ? '#e8e6f0' : '#18171c'};
      --text2:     ${dark ? '#8a879f' : '#6b6880'};
      --text3:     ${dark ? '#4a4760' : '#b0adbf'};
      --accent:    #5c47e0;
      --accent2:   #7461f5;
      --accent-bg: ${dark ? 'rgba(92,71,224,0.15)' : 'rgba(92,71,224,0.08)'};
      --ok:        #1ea97c;
      --ok-bg:     ${dark ? 'rgba(30,169,124,0.14)' : 'rgba(30,169,124,0.09)'};
      --warn:      #d08a2a;
      --warn-bg:   ${dark ? 'rgba(208,138,42,0.14)' : 'rgba(208,138,42,0.09)'};
      --danger:    #e04b3a;
      --danger-bg: ${dark ? 'rgba(224,75,58,0.13)' : 'rgba(224,75,58,0.08)'};
      --info:      #3a7fe0;
      --info-bg:   ${dark ? 'rgba(58,127,224,0.14)' : 'rgba(58,127,224,0.09)'};
      --sh:        ${dark ? '0 4px 24px rgba(0,0,0,0.5)' : '0 4px 24px rgba(0,0,0,0.06)'};
      --sh-lg:     ${dark ? '0 16px 48px rgba(0,0,0,0.65)' : '0 16px 48px rgba(0,0,0,0.1)'};
      --radius:    14px;
      --sidebar:   260px;
    }
    html, body { height: 100%; overflow: hidden; }
    body { font-family: 'Geist', sans-serif; background: var(--bg); color: var(--text); -webkit-font-smoothing: antialiased; }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }
    /* Toggle aliases */
    .toggle { width:40px; height:22px; border-radius:11px; cursor:pointer; position:relative; transition:background .2s; flex-shrink:0; }
    .toggle-knob { position:absolute; top:3px; width:16px; height:16px; border-radius:50%; background:#fff; box-shadow:0 1px 3px rgba(0,0,0,.25); transition:left .2s cubic-bezier(.34,1.56,.64,1); }

    @keyframes fadeUp   { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
    @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
    @keyframes scaleIn  { from { opacity:0; transform:scale(.95); } to { opacity:1; transform:scale(1); } }
    @keyframes spin     { to { transform:rotate(360deg); } }
    @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.4} }
    @keyframes slideIn  { from { transform:translateX(-100%); opacity:0; } to { transform:translateX(0); opacity:1; } }
    @keyframes shimmer  { 0%{background-position:-200px 0} 100%{background-position:200px 0} }
    @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:0} }

    .fade-up   { animation: fadeUp  .4s cubic-bezier(.22,1,.36,1) both; }
    .fade-in   { animation: fadeIn  .25s ease both; }
    .scale-in  { animation: scaleIn .3s cubic-bezier(.34,1.56,.64,1) both; }
    .spin      { animation: spin .85s linear infinite; }

    /* Sidebar nav item */
    .nav-item {
      display: flex; align-items: center; gap: 10px; padding: 9px 12px;
      border-radius: 10px; font-size: 13.5px; font-weight: 500; cursor: pointer;
      color: var(--text2); transition: all .18s; user-select: none; position: relative;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .nav-item:hover  { background: var(--bg3); color: var(--text); }
    .nav-item.active { background: var(--accent-bg); color: var(--accent); font-weight: 600; }
    .nav-item .nav-icon { width:18px; height:18px; flex-shrink:0; }

    /* Chat session item */
    .session-item {
      display: flex; align-items: center; gap: 9px; padding: 8px 10px;
      border-radius: 9px; cursor: pointer; transition: all .15s;
      color: var(--text2); font-size: 13px;
    }
    .session-item:hover   { background: var(--bg3); color: var(--text); }
    .session-item.active  { background: var(--accent-bg); color: var(--accent); }
    .session-item .title  { flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:500; }

    /* Bubble */
    .bubble-user {
      background: var(--accent); color: #fff;
      border-radius: 18px 18px 5px 18px; padding: 12px 18px;
      font-size: 14px; line-height: 1.65;
    }
    .bubble-bot {
      background: var(--surface2); border: 1px solid var(--border);
      color: var(--text); border-radius: 5px 18px 18px 18px;
      padding: 14px 18px; font-size: 14px; line-height: 1.72;
      transition: background .3s;
    }
    .bubble-bot.redacted  { border-color: rgba(224,75,58,.3);  background: var(--danger-bg); }
    .bubble-bot.corrected { border-color: rgba(208,138,42,.35); background: var(--warn-bg); }

    /* Buttons */
    .btn { display:inline-flex; align-items:center; gap:7px; padding:9px 18px; border-radius:9px; border:none; cursor:pointer; font-family:'Geist',sans-serif; font-size:13.5px; font-weight:600; transition:all .18s; }
    .btn-primary { background:var(--accent); color:#fff; }
    .btn-primary:hover { background:var(--accent2); transform:translateY(-1px); box-shadow:0 6px 20px rgba(92,71,224,.35); }
    .btn-primary:active { transform:translateY(0); }
    .btn-ghost  { background:transparent; color:var(--text2); border:1px solid var(--border2); }
    .btn-ghost:hover  { color:var(--text); border-color:var(--border2); background:var(--bg3); }
    .btn-danger { background:var(--danger-bg); color:var(--danger); border:1px solid rgba(224,75,58,.2); }
    .btn-danger:hover { background:var(--danger); color:#fff; }
    .btn-icon { padding:7px; border-radius:8px; }

    /* Inputs */
    .inp {
      width:100%; padding:11px 16px; background:var(--bg2); border:1.5px solid var(--border2);
      border-radius:10px; color:var(--text); font-family:'Geist',sans-serif; font-size:14px;
      transition:border-color .18s, box-shadow .18s; outline:none;
    }
    .inp:focus { border-color:var(--accent); box-shadow:0 0 0 3px rgba(92,71,224,.12); }
    .inp::placeholder { color:var(--text3); }
    .inp-lg { padding:14px 18px 14px 48px; font-size:15px; border-radius:12px; }

    /* Chat input area */
    .chat-composer {
      display:flex; align-items:flex-end; gap:10px; padding:12px 16px;
      background:var(--surface2); border:1.5px solid var(--border2);
      border-radius:16px; transition:border-color .18s, box-shadow .18s;
    }
    .chat-composer:focus-within { border-color:var(--accent); box-shadow:0 0 0 3px rgba(92,71,224,.1); }
    .chat-textarea {
      flex:1; background:transparent; border:none; outline:none; resize:none;
      font-family:'Geist',sans-serif; font-size:14.5px; color:var(--text);
      line-height:1.6; max-height:200px; min-height:24px;
    }
    .chat-textarea::placeholder { color:var(--text3); }

    /* Card */
    .card { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); }
    .card-sm { background:var(--surface2); border:1px solid var(--border); border-radius:10px; }

    /* Badge */
    .badge { display:inline-flex; align-items:center; gap:4px; padding:3px 9px; border-radius:20px; font-size:11.5px; font-weight:600; }
    .badge-ok     { background:var(--ok-bg);     color:var(--ok);     }
    .badge-danger { background:var(--danger-bg);  color:var(--danger); }
    .badge-warn   { background:var(--warn-bg);    color:var(--warn);   }
    .badge-info   { background:var(--info-bg);    color:var(--info);   }
    .badge-accent   { background:var(--accent-bg);  color:var(--accent); }
    .badge-neutral  { background:var(--bg3);          color:var(--text2);  }

    /* Progress */
    .prog { height:3px; border-radius:3px; background:var(--border2); overflow:hidden; }
    .prog-fill { height:100%; border-radius:3px; transition:width .6s cubic-bezier(.22,1,.36,1); }
    .prog-md { height:5px; border-radius:5px; }

    /* Toggle */
    .toggle { width:40px; height:22px; border-radius:11px; cursor:pointer; position:relative; transition:background .22s; flex-shrink:0; }
    .toggle-knob { position:absolute; top:3px; width:16px; height:16px; border-radius:50%; background:#fff; box-shadow:0 1px 4px rgba(0,0,0,.22); transition:left .22s cubic-bezier(.34,1.56,.64,1); }

    /* Auth input with icon */
    .auth-field { position:relative; margin-bottom:12px; }
    .auth-field svg { position:absolute; left:14px; top:50%; transform:translateY(-50%); color:var(--text3); pointer-events:none; }
    .auth-field .inp { padding-left:42px; }

    /* Data table */
    .data-table { width:100%; border-collapse:collapse; }
    .data-table th { padding:10px 16px; font-size:11px; font-weight:700; color:var(--text3); text-transform:uppercase; letter-spacing:.5px; text-align:left; background:var(--bg2); border-bottom:1px solid var(--border); }
    .data-table td { padding:11px 16px; font-size:13px; border-bottom:1px solid var(--border); vertical-align:middle; }
    .data-table tbody tr:hover td { background:var(--bg2); }
    /* Memory UI */
    .memory-bar { height:8px; border-radius:8px; background:var(--border2); overflow:hidden; }
    .memory-bar-fill { height:100%; border-radius:8px; transition:width .6s cubic-bezier(.22,1,.36,1); }
    .memory-card { padding:12px 14px; border-radius:11px; background:var(--surface2); border:1px solid var(--border); display:flex; align-items:flex-start; gap:11px; transition:background .15s; }
    .memory-card:hover { background:var(--bg2); }
    .memory-card:hover .mem-del { opacity:1; }
    .mem-del { opacity:0; transition:opacity .15s; background:none; border:none; color:var(--danger); cursor:pointer; padding:3px; border-radius:5px; flex-shrink:0; }
    .mem-del:hover { background:var(--danger-bg); }
    .mem-add-row { display:flex; gap:8px; margin-bottom:14px; }
    .mem-add-input { flex:1; padding:10px 14px; background:var(--surface2); border:1.5px solid var(--border2); border-radius:10px; color:var(--text); font-family:'Geist',sans-serif; font-size:13.5px; outline:none; transition:border-color .15s; }
    .mem-add-input:focus { border-color:var(--accent); }
    .mem-add-input::placeholder { color:var(--text3); font-style:italic; }
    /* Personalization UI */
    .pill-select { display:flex; gap:7px; flex-wrap:wrap; }
    .pill-option { padding:8px 18px; border-radius:22px; font-size:13px; font-weight:500; cursor:pointer; border:1.5px solid var(--border2); color:var(--text2); background:var(--surface2); font-family:'Geist',sans-serif; transition:all .15s; white-space:nowrap; }
    .pill-option:hover   { border-color:var(--accent); color:var(--accent); background:var(--accent-bg); }
    .pill-option.selected { border-color:var(--accent); color:var(--accent); background:var(--accent-bg); font-weight:600; box-shadow:0 0 0 3px var(--accent-bg); }
    .char-toggle { display:flex; align-items:center; justify-content:space-between; padding:14px 0; border-bottom:1px solid var(--border); gap:12px; }
    .char-toggle:last-child { border-bottom:none; padding-bottom:0; }
    .pref-field { width:100%; padding:12px 16px; background:var(--surface2); border:1.5px solid var(--border2); border-radius:11px; color:var(--text); font-family:'Geist',sans-serif; font-size:14px; outline:none; transition:border-color .15s, box-shadow .15s; }
    .pref-field:focus { border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-bg); background:var(--surface); }
    .pref-field::placeholder { color:var(--text3); font-size:13.5px; font-style:italic; }
    textarea.pref-field { min-height:90px; resize:vertical; line-height:1.65; }
    .pref-section { margin-bottom:20px; }
    .pref-section:last-child { margin-bottom:0; }
    .pref-label { font-size:12.5px; font-weight:600; color:var(--text); margin-bottom:8px; display:flex; align-items:center; gap:6px; letter-spacing:.1px; }
    .pref-desc  { font-size:12px; color:var(--text3); margin-top:7px; line-height:1.5; }
    .field-hint { font-size:12px; color:var(--text3); margin-top:7px; line-height:1.5; }
    .save-indicator { display:inline-flex; align-items:center; gap:5px; font-size:12px; font-weight:600; padding:5px 11px; border-radius:7px; }
    /* Toggle aliases */
    .toggle { width:40px; height:22px; border-radius:11px; cursor:pointer; position:relative; transition:background .2s; flex-shrink:0; }
    .toggle-knob { position:absolute; top:3px; width:16px; height:16px; border-radius:50%; background:#fff; box-shadow:0 1px 3px rgba(0,0,0,.25); transition:left .2s cubic-bezier(.34,1.56,.64,1); }
    .data-table tbody tr:last-child td { border-bottom:none; }

    /* Entity tag */
    .entity-tag { display:inline-block; padding:1px 6px; border-radius:4px; font-size:11px; font-weight:700; background:var(--danger-bg); color:var(--danger); border:1px solid rgba(224,75,58,.25); margin:0 2px; vertical-align:middle; }

    /* Sidebar divider */
    .sidebar-section { padding:6px 8px 2px; font-size:10.5px; font-weight:700; color:var(--text3); text-transform:uppercase; letter-spacing:.6px; }

    /* Status dot */
    .status-dot { width:7px; height:7px; border-radius:50%; display:inline-block; }
    .status-dot.live { background:var(--ok); animation: pulse 2s ease infinite; }

    /* Typing indicator */
    .typing-dot { width:6px; height:6px; border-radius:50%; background:var(--text3); display:inline-block; animation: pulse .9s ease infinite; }
    .typing-dot:nth-child(2) { animation-delay:.15s; }
    .typing-dot:nth-child(3) { animation-delay:.3s; }

    /* Serif display */
    .serif { font-family:'Instrument Serif', serif; }

    /* Shimmer loading */
    .shimmer { background:linear-gradient(90deg, var(--bg2) 25%, var(--bg3) 50%, var(--bg2) 75%); background-size:400px; animation:shimmer 1.4s infinite; border-radius:6px; }
  `}</style>
);

// ─── HELPERS ─────────────────────────────────────────────────
const fmt = (text) => {
  if (!text) return '';
  let f = text
    .replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/&lt;([A-Z_]+)&gt;/g, '<span class="entity-tag">$1</span>')
    .replace(/\*\*([\s\S]*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\((.*?)\)/g, '<a href="$2" target="_blank" style="color:var(--accent);text-decoration:underline;">$1</a>');
  const lines = f.split('\n');
  let inList = false, out = [];
  lines.forEach(line => {
    const m = line.match(/^(\s*)([\*\-]|(\d+\.))\s+(.*)/);
    if (m) {
      const tag = m[3] ? 'ol' : 'ul';
      if (!inList) { out.push(`<${tag} style="margin:8px 0;padding-left:20px;">`); inList = tag; }
      out.push(`<li style="margin-bottom:4px;line-height:1.65;">${m[4]}</li>`);
    } else {
      if (inList) { out.push(`</${inList}>`); inList = false; }
      out.push(line);
    }
  });
  if (inList) out.push(`</${inList}>`);
  return out.join('\n').replace(/\n(?!<[uo]l|<li|<\/[uo]l)/g, '<br/>');
};

const riskColor = v => v==='HIGH' ? 'var(--danger)' : v==='MEDIUM' ? 'var(--warn)' : 'var(--ok)';
const riskBg    = v => v==='HIGH' ? 'var(--danger-bg)' : v==='MEDIUM' ? 'var(--warn-bg)' : 'var(--ok-bg)';
const timeAgo   = (ts) => {
  if (!ts) return '';
  const diff = (Date.now() - ts * 1000) / 1000;
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return new Date(ts*1000).toLocaleDateString('en-US',{month:'short',day:'numeric'});
};

// ─── FIREBASE CONFIG ─────────────────────────────────────────
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyD_Al8JC-fWqmhgjYgqhNDPycLaEgN9AtU",
  authDomain: "multi-faceted-analysis-tool.firebaseapp.com",
  projectId: "multi-faceted-analysis-tool",
  storageBucket: "multi-faceted-analysis-tool.firebasestorage.app",
  messagingSenderId: "499657977283",
  appId: "1:499657977283:web:eabd94be2e888ea0d8e176"
};

let _fbAuth = null;
async function getFirebaseAuth() {
  if (_fbAuth) return _fbAuth;
  const { initializeApp, getApps } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
  const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signOut }
    = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
  const { getFirestore, doc, setDoc, getDoc }
    = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
  const fbApp = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
  const auth  = getAuth(fbApp);
  const db    = getFirestore(fbApp);
  _fbAuth = { auth, db, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signOut, doc, setDoc, getDoc };
  return _fbAuth;
}

const ADMIN_USER = { email:'admin@trustguard.io', password:'howyoudoin', name:'Admin User', role:'Administrator', avatar:'AU', clearance:'Administrator' };
const isFirebaseConfigured = () => FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey !== 'YOUR_API_KEY';

// ─── SESSION TOKEN ────────────────────────────────────────────
// _sessionToken: the current bearer token used for all API calls
// _firebaseUser: reference to the Firebase user, used to refresh tokens on 401
let _sessionToken = null;
let _firebaseUser = null;  // set after Firebase login so we can refresh silently

const setSessionToken = t => {
  _sessionToken = t;
  // Also persist to localStorage inside the tg_user object so page refreshes work
  try {
    const raw = localStorage.getItem('tg_user');
    if (raw) {
      const u = JSON.parse(raw);
      u.sessionToken = t;
      localStorage.setItem('tg_user', JSON.stringify(u));
    }
  } catch (_) {}
};
const getSessionToken  = () => _sessionToken;
const setFirebaseUser  = u  => { _firebaseUser = u; };

/**
 * Attempt to silently refresh the TrustGuard session token using Firebase.
 * Called automatically when any API call returns 401.
 * Returns the new token, or null if refresh is not possible.
 */
async function _refreshSessionToken() {
  if (!_firebaseUser) {
    console.warn('⚠️ Cannot refresh — no Firebase user stored');
    return null;
  }
  try {
    const idToken = await _firebaseUser.getIdToken(true); // force-refresh Firebase JWT
    const res = await fetch('http://127.0.0.1:5000/api/auth/refresh', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ idToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.token) {
      setSessionToken(data.token);
      console.log('🔄 Session token refreshed silently');
      return data.token;
    }
  } catch (e) {
    console.error('Token refresh error:', e);
  }
  return null;
}

/**
 * apiFetch — drop-in replacement for fetch() that:
 * 1. Adds Authorization header automatically
 * 2. On 401: silently refreshes the token and retries ONCE
 * 3. On second 401: returns the response as-is (caller handles it)
 */
const apiFetch = async (url, opts = {}, _isRetry = false) => {
  const token = getSessionToken();
  const res = await fetch(url, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  });

  // Auto-refresh on 401 (once only — prevent infinite loop)
  if (res.status === 401 && !_isRetry) {
    console.log('🔄 Got 401 — attempting silent token refresh for:', url);
    const newToken = await _refreshSessionToken();
    if (newToken) {
      // Retry the original request with the new token
      return apiFetch(url, opts, true);
    }
  }

  return res;
};

// ─────────────────────────────────────────────────────────────
// AUTH SCREEN
// ─────────────────────────────────────────────────────────────
function AuthScreen({ onAuth, dark, toggleDark }) {
  const [mode,    setMode]    = useState('login');
  const [form,    setForm]    = useState({ email:'', password:'', name:'', orgKey:'' });
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [adminOpen, setAdminOpen]   = useState(false);
  const [adminPw,   setAdminPw]     = useState('');
  const [adminShow, setAdminShow]   = useState(false);
  const [adminErr,  setAdminErr]    = useState('');
  const [adminLoad, setAdminLoad]   = useState(false);
  const adminRef = useRef(null);

  useEffect(() => {
    if (adminOpen) { setAdminPw(''); setAdminErr(''); setTimeout(() => adminRef.current?.focus(), 80); }
  }, [adminOpen]);

  const submitAdmin = async (e) => {
    e?.preventDefault();
    if (!adminPw) { setAdminErr('Enter the admin password.'); return; }
    setAdminLoad(true); setAdminErr('');
    await new Promise(r => setTimeout(r, 500));
    if (adminPw === ADMIN_USER.password) {
      const u = { ...ADMIN_USER }; delete u.password;
      try {
        const r = await fetch('http://127.0.0.1:5000/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ email:ADMIN_USER.email, password:ADMIN_USER.password }) });
        const d = await r.json();
        if (d.token) { setSessionToken(d.token); u.sessionToken = d.token; }
      } catch(_) {}
      localStorage.setItem('tg_user', JSON.stringify(u)); onAuth(u);
    } else { setAdminErr('Incorrect password.'); }
    setAdminLoad(false);
  };

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (isFirebaseConfigured()) {
        const fb = await getFirebaseAuth();
        if (mode === 'login') {
          const cred = await fb.signInWithEmailAndPassword(fb.auth, form.email, form.password);
          const fbUser = cred.user;
          setFirebaseUser(fbUser);  // store so token can be silently refreshed on 401
          let profile = {};
          try { const snap = await fb.getDoc(fb.doc(fb.db,'users',fbUser.uid)); if(snap.exists()) profile=snap.data(); } catch(_) {}
          const userData = { uid:fbUser.uid, email:fbUser.email, name:fbUser.displayName||profile.name||form.email.split('@')[0], role:profile.role||'Analyst', clearance:profile.clearance||'Analyst', avatar:(fbUser.displayName||profile.name||'U').slice(0,2).toUpperCase() };
          try {
            const idToken = await fbUser.getIdToken();
            const r = await fetch('http://127.0.0.1:5000/api/auth/firebase-verify', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({idToken}) });
            const d = await r.json();
            if (d.token) { setSessionToken(d.token); userData.sessionToken = d.token; }
          } catch(_) {}
          localStorage.setItem('tg_user', JSON.stringify(userData)); onAuth(userData);
        } else {
          if (form.orgKey !== 'TRUSTGUARD-ENT-2025') { setError('Invalid enterprise key.'); setLoading(false); return; }
          if (form.password.length < 8) { setError('Password must be 8+ characters.'); setLoading(false); return; }
          const cred = await fb.createUserWithEmailAndPassword(fb.auth, form.email, form.password);
          await fb.updateProfile(cred.user, { displayName: form.name });
          try { await fb.setDoc(fb.doc(fb.db,'users',cred.user.uid), { name:form.name, role:'Analyst', clearance:'Analyst', email:form.email, createdAt:new Date().toISOString() }); } catch(_) {}
          const userData = { uid:cred.user.uid, email:form.email, name:form.name, role:'Analyst', clearance:'Analyst', avatar:form.name.slice(0,2).toUpperCase() };
          try {
            const idToken = await cred.user.getIdToken();
            const r = await fetch('http://127.0.0.1:5000/api/auth/firebase-verify', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({idToken}) });
            const d = await r.json();
            if (d.token) { setSessionToken(d.token); userData.sessionToken = d.token; }
          } catch(_) {}
          localStorage.setItem('tg_user', JSON.stringify(userData)); onAuth(userData);
        }
      } else {
        await new Promise(r => setTimeout(r, 600));
        if (mode === 'login') {
          if (form.email === ADMIN_USER.email && form.password === ADMIN_USER.password) {
            const u = { ...ADMIN_USER }; delete u.password;
            try {
              const r = await fetch('http://127.0.0.1:5000/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email:form.email,password:form.password}) });
              const d = await r.json();
              if (d.token) { setSessionToken(d.token); u.sessionToken = d.token; }
            } catch(_) {}
            localStorage.setItem('tg_user', JSON.stringify(u)); onAuth(u);
          } else { setError('Incorrect email or password.'); }
        } else {
          if (!form.name||!form.email||!form.password) { setError('All fields required.'); setLoading(false); return; }
          if (form.orgKey !== 'TRUSTGUARD-ENT-2025') { setError('Invalid enterprise key.'); setLoading(false); return; }
          if (form.password.length < 8) { setError('Password must be 8+ characters.'); setLoading(false); return; }
          let nu = { email:form.email, name:form.name, role:'Analyst', avatar:form.name.slice(0,2).toUpperCase(), clearance:'Analyst' };
          try {
            const r = await fetch('http://127.0.0.1:5000/api/auth/register', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email:form.email,password:form.password,name:form.name,orgKey:form.orgKey}) });
            const d = await r.json();
            if (d.token) { setSessionToken(d.token); nu.sessionToken = d.token; }
          } catch(_) {}
          localStorage.setItem('tg_user', JSON.stringify(nu)); onAuth(nu);
        }
      }
    } catch (err) {
      const msgs = { 'auth/user-not-found':'No account found.','auth/wrong-password':'Incorrect password.','auth/email-already-in-use':'Email already registered.','auth/weak-password':'Password too weak.','auth/invalid-email':'Invalid email.','auth/too-many-requests':'Too many attempts.','auth/invalid-credential':'Incorrect email or password.' };
      setError(msgs[err.code] || err.message || 'Authentication failed.');
    }
    setLoading(false);
  };

  return (
    <>
      <GlobalStyles dark={dark}/>

      {/* Admin modal */}
      {adminOpen && (
        <div className="fade-in" style={{ position:'fixed',inset:0,zIndex:300,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
          <div className="card scale-in" style={{ width:'100%',maxWidth:380,padding:32,position:'relative' }}>
            <button onClick={()=>setAdminOpen(false)} className="btn btn-ghost btn-icon" style={{ position:'absolute',top:14,right:14 }}><X size={15}/></button>
            <div style={{ display:'flex',alignItems:'center',gap:14,marginBottom:24 }}>
              <div style={{ width:46,height:46,borderRadius:12,background:'linear-gradient(135deg,var(--accent),var(--accent2))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,boxShadow:'0 6px 18px rgba(92,71,224,.35)' }}>👑</div>
              <div>
                <div style={{ fontSize:16,fontWeight:700,color:'var(--text)' }}>Admin Access</div>
                <div style={{ fontSize:12,color:'var(--text3)',marginTop:2 }}>Enter your administrator password</div>
              </div>
            </div>
            <form onSubmit={submitAdmin}>
              <div style={{ position:'relative',marginBottom:14 }}>
                <Lock size={14} style={{ position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:'var(--text3)',pointerEvents:'none' }}/>
                <input ref={adminRef} className="inp" type={adminShow?'text':'password'} placeholder="Password" value={adminPw}
                  onChange={e=>{setAdminPw(e.target.value);setAdminErr('');}} style={{ paddingLeft:42,paddingRight:44 }}/>
                <button type="button" onClick={()=>setAdminShow(p=>!p)} style={{ position:'absolute',right:13,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'var(--text3)',cursor:'pointer',padding:4 }}>
                  {adminShow?<EyeOff size={14}/>:<Eye size={14}/>}
                </button>
              </div>
              {adminErr && <div className="badge badge-danger fade-in" style={{ marginBottom:12,padding:'8px 12px',borderRadius:8,width:'100%',fontSize:12.5 }}><AlertCircle size={12}/> {adminErr}</div>}
              <button type="submit" className="btn btn-primary" style={{ width:'100%',justifyContent:'center',padding:'12px 0',fontSize:14 }}>
                {adminLoad ? <><div className="spin" style={{ width:14,height:14,border:'2px solid rgba(255,255,255,.35)',borderTopColor:'#fff',borderRadius:'50%' }}/> Verifying…</> : <>Sign in <ArrowRight size={14}/></>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Main auth */}
      <div style={{ minHeight:'100vh',display:'flex',background:'var(--bg)',position:'relative',overflow:'hidden' }}>
        {/* Background decoration */}
        <div style={{ position:'absolute',width:600,height:600,borderRadius:'50%',background:`radial-gradient(circle,${dark?'rgba(92,71,224,0.08)':'rgba(92,71,224,0.12)'} 0%,transparent 65%)`,top:-200,right:-100,pointerEvents:'none' }}/>
        <div style={{ position:'absolute',width:400,height:400,borderRadius:'50%',background:`radial-gradient(circle,${dark?'rgba(30,169,124,0.06)':'rgba(30,169,124,0.09)'} 0%,transparent 65%)`,bottom:-100,left:-60,pointerEvents:'none' }}/>
        <div style={{ position:'absolute',inset:0,backgroundImage:`radial-gradient(${dark?'rgba(255,255,255,0.015)':'rgba(0,0,0,0.02)'} 1px, transparent 1px)`,backgroundSize:'32px 32px',pointerEvents:'none' }}/>

        {/* Left side branding */}
        <div style={{ flex:1,display:'flex',flexDirection:'column',justifyContent:'center',padding:'60px 80px',display:'none' }}/>

        {/* Right side — form */}
        <div style={{ width:'100%',display:'flex',alignItems:'center',justifyContent:'center',padding:24 }}>
          <div className="scale-in" style={{ width:'100%',maxWidth:420 }}>
            {/* Logo */}
            <div style={{ textAlign:'center',marginBottom:32 }}>
              <div style={{ width:56,height:56,background:'linear-gradient(135deg,var(--accent),var(--accent2))',borderRadius:16,display:'inline-flex',alignItems:'center',justifyContent:'center',marginBottom:14,boxShadow:'0 10px 30px rgba(92,71,224,.3)' }}>
                <Shield size={26} color="#fff" fill="#fff"/>
              </div>
              <h1 className="serif" style={{ fontSize:30,color:'var(--text)',letterSpacing:'-0.5px',lineHeight:1.15 }}>TrustGuard</h1>
              <p style={{ color:'var(--text3)',fontSize:13.5,marginTop:5,fontWeight:500 }}>Enterprise AI Safety Platform</p>
            </div>

            <div className="card" style={{ padding:28,boxShadow:'var(--sh)' }}>
              {/* Tab switcher */}
              <div style={{ display:'flex',background:'var(--bg2)',borderRadius:10,padding:3,marginBottom:24,gap:3 }}>
                {['login','register'].map(m => (
                  <button key={m} onClick={()=>{setMode(m);setError('');}}
                    style={{ flex:1,padding:'8px 0',borderRadius:8,border:'none',fontSize:13.5,fontWeight:600,cursor:'pointer',transition:'all .18s',fontFamily:'Geist,sans-serif',
                      background:mode===m?'var(--surface)':'transparent',color:mode===m?'var(--text)':'var(--text3)',
                      boxShadow:mode===m?'0 2px 8px rgba(0,0,0,.06)':'none' }}>
                    {m === 'login' ? 'Sign In' : 'Register'}
                  </button>
                ))}
              </div>

              <form onSubmit={submit} style={{ display:'flex',flexDirection:'column',gap:0 }}>
                {mode==='register' && (
                  <div className="auth-field"><User size={14}/><input className="inp inp-lg" placeholder="Full name" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/></div>
                )}
                <div className="auth-field"><Mail size={14}/><input className="inp inp-lg" type="email" placeholder="Email address" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))}/></div>
                <div className="auth-field" style={{ position:'relative' }}>
                  <Key size={14} style={{ position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:'var(--text3)',pointerEvents:'none',zIndex:1 }}/>
                  <input className="inp inp-lg" type={showPw?'text':'password'} placeholder="Password" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} style={{ paddingLeft:42,paddingRight:48 }}/>
                  <button type="button" onClick={()=>setShowPw(p=>!p)} style={{ position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'var(--text3)',cursor:'pointer',padding:4 }}>
                    {showPw?<EyeOff size={14}/>:<Eye size={14}/>}
                  </button>
                </div>
                {mode==='register' && (
                  <div className="auth-field">
                    <Fingerprint size={14}/>
                    <input className="inp inp-lg" placeholder="Enterprise key" value={form.orgKey} onChange={e=>setForm(p=>({...p,orgKey:e.target.value}))}/>
                  </div>
                )}
                {error && <div className="badge badge-danger fade-in" style={{ marginBottom:14,padding:'9px 12px',borderRadius:9,width:'100%',fontSize:12.5,justifyContent:'flex-start' }}><AlertCircle size={12}/> {error}</div>}
                <button type="submit" className="btn btn-primary" style={{ width:'100%',justifyContent:'center',padding:'13px 0',fontSize:14.5,borderRadius:11,marginTop:4 }}>
                  {loading ? <><div className="spin" style={{ width:15,height:15,border:'2px solid rgba(255,255,255,.4)',borderTopColor:'#fff',borderRadius:'50%' }}/> Verifying…</> : <>{mode==='login'?'Sign in':'Create account'} <ArrowRight size={15}/></>}
                </button>
              </form>

              {mode === 'login' && (
                <>
                  <div style={{ display:'flex',alignItems:'center',gap:10,margin:'20px 0' }}>
                    <div style={{ flex:1,height:1,background:'var(--border)' }}/>
                    <span style={{ fontSize:11.5,color:'var(--text3)',fontWeight:500 }}>or</span>
                    <div style={{ flex:1,height:1,background:'var(--border)' }}/>
                  </div>
                  <button onClick={()=>setAdminOpen(true)} className="btn btn-ghost" style={{ width:'100%',justifyContent:'space-between',padding:'11px 14px',borderRadius:10,fontSize:13.5 }}>
                    <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                      <span style={{ fontSize:18 }}>👑</span>
                      <div style={{ textAlign:'left' }}>
                        <div style={{ fontWeight:700,color:'var(--text)',fontSize:13.5 }}>Administrator</div>
                        <div style={{ fontSize:11,color:'var(--text3)',marginTop:1 }}>Quick admin access</div>
                      </div>
                    </div>
                    <ArrowRight size={13} color="var(--text3)"/>
                  </button>
                </>
              )}
            </div>

            <p style={{ textAlign:'center',fontSize:11,color:'var(--text3)',marginTop:16 }}>
              Protected by Fernet encryption · Zero-knowledge architecture
            </p>

            {/* Dark toggle */}
            <div style={{ textAlign:'center',marginTop:10 }}>
              <button onClick={toggleDark} className="btn btn-ghost btn-icon" style={{ fontSize:11.5,padding:'6px 12px',gap:6 }}>
                {dark?<Sun size={13}/>:<Moon size={13}/>} {dark?'Light mode':'Dark mode'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────────────────────
export default function App() {
  const [dark,       setDark]       = useState(false);
  const [user,       setUser]       = useState(null);
  const [tab,        setTab]        = useState('chat');
  const [sidebarOpen,setSidebarOpen]= useState(true);
  const [stats,      setStats]      = useState({ total_scans:0,pii_blocked:0,verified_safe:0,hallucinations_found:0 });
  const [logs,       setLogs]       = useState([]);
  const [backendUp,  setBackendUp]  = useState(true);
  const [sysHealth,  setSysHealth]  = useState({ gemini:false,firebase:false,encryption:false,version:'--' });
  const [notifs,     setNotifs]     = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);

  // Chat
  const WELCOME = { id:'welcome', sender:'bot', text:"Hello! I'm TrustGuard's AI engine. Ask me anything — I'll fact-check responses and scan for privacy violations in real time.\n\nYou can also **analyze** any bot message by clicking the shield icon beneath it." };
  const [msgs,    setMsgs]    = useState([WELCOME]);
  const [input,   setInput]   = useState('');
  const [analysis,setAnalysis]= useState({});
  const [selId,   setSelId]   = useState(null);
  const [typing,  setTyping]  = useState(false);
  const [histLoad,setHistLoad]= useState(false);
  const chatEnd = useRef(null);
  const textareaRef = useRef(null);

  // Sessions
  const [currentSid,  setCurrentSid]  = useState(() => `ses_${Date.now()}`);
  const [sessions,    setSessions]    = useState([]);
  const [activeSid,   setActiveSid]   = useState(null);
  const [sessionMsgs, setSessionMsgs] = useState(null);
  const [sessLoading, setSessLoading] = useState(false);
  const [sessLoaded,  setSessLoaded]  = useState(false);

  // Extension verify deep-link: ?verify=<uuid>
  const [verifyData,    setVerifyData]    = useState(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyId,      setVerifyId]      = useState(null);

  useEffect(() => {
    const s = localStorage.getItem('tg_user');
    if (s) { const u = JSON.parse(s); if (u.sessionToken) setSessionToken(u.sessionToken); setUser(u); }
    const d = localStorage.getItem('tg_dark');
    if (d === '1') setDark(true);

    // Re-attach Firebase Auth listener on page load so we can silently
    // refresh the session token if Flask was restarted (avoids 401 loops)
    if (isFirebaseConfigured()) {
      getFirebaseAuth().then(fb => {
        // onAuthStateChanged fires immediately with the current user if already signed in
        fb.auth.onAuthStateChanged?.(fbUser => {
          if (fbUser) {
            setFirebaseUser(fbUser);
            console.log('🔥 Firebase Auth restored for:', fbUser.email);
          }
        });
      }).catch(() => {});
    }

    // Deep-link from Chrome extension: ?verify=<uuid>
    const params = new URLSearchParams(window.location.search);
    const vid    = params.get('verify');
    if (vid) {
      setVerifyId(vid);
      setVerifyLoading(true);
      setTab('verify');
      fetch(`http://127.0.0.1:5000/verify/${vid}`)
        .then(r => r.json())
        .then(data => { setVerifyData(data); setVerifyLoading(false); })
        .catch(e  => { console.error('Verify load error:', e); setVerifyLoading(false); });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const toggleDark = () => setDark(p => { localStorage.setItem('tg_dark', p?'0':'1'); return !p; });

  // Auto-resize textarea
  const resizeTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  };

  const loadHistory = async () => {
    if (!getSessionToken()) return;
    setHistLoad(true);
    try {
      const res = await apiFetch('http://127.0.0.1:5000/api/chat/history?limit=60');
      const data = await res.json();
      if (data.messages?.length > 0) {
        setMsgs([WELCOME, ...data.messages.map(m => ({ id:m.id||Math.random(), sender:m.role==='user'?'user':'bot', text:m.text||'', source:m.source||'Internal Chat', _fromHistory:true }))]);
      }
    } catch(_) {}
    setHistLoad(false);
  };

  const loadSessions = async () => {
    if (!getSessionToken()) return;
    try {
      const res = await apiFetch('http://127.0.0.1:5000/api/chat/sessions');
      const data = await res.json();
      if (data.sessions) setSessions(data.sessions);
    } catch(_) {}
    setSessLoaded(true);
  };

  const loadSession = async (sid) => {
    if (sid === null) { setActiveSid(null); setSessionMsgs(null); return; }
    setActiveSid(sid); setSessLoading(true); setSessionMsgs(null);
    try {
      const res = await apiFetch(`http://127.0.0.1:5000/api/chat/session/${sid}`);
      if (!res.ok) { setSessionMsgs([]); setSessLoading(false); return; }
      const data = await res.json();
      setSessionMsgs((data.messages||[]).map(m => ({ id:m.id||Math.random(), sender:m.role==='user'?'user':'bot', text:m.text||'', source:m.source||'Internal Chat', _fromHistory:true })));
    } catch(_) { setSessionMsgs([]); }
    setSessLoading(false);
  };

  const newChat = () => {
    setCurrentSid(`ses_${Date.now()}`);
    setActiveSid(null);
    setSessionMsgs(null);
    setMsgs([WELCOME]);
    setAnalysis({});
    setSelId(null);
    setTab('chat');
  };

  useEffect(() => {
    if (!user) return;
    const poll = async () => {
      try {
        const [sR, hR] = await Promise.all([
          apiFetch(`http://127.0.0.1:5000/stats?t=${Date.now()}`),
          apiFetch(`http://127.0.0.1:5000/health?t=${Date.now()}`),
        ]);
        const sd = await sR.json(); const hd = await hR.json();
        setStats(sd.stats); setLogs(sd.logs);
        setSysHealth({ gemini:hd.gemini, firebase:hd.firebase, encryption:hd.encryption, version:hd.version||'--' });
        setBackendUp(true);
      } catch { setBackendUp(false); }
    };
    poll(); loadHistory(); loadSessions();
    const iv = setInterval(poll, 4000);
    return () => clearInterval(iv);
  }, [user]);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior:'smooth' }); }, [msgs, typing]);

  const addNotif = (msg, type='info') => setNotifs(p => [{ id:Date.now(),msg,type,t:new Date().toLocaleTimeString() },...p].slice(0,8));

  const logout = async () => {
    try { if (isFirebaseConfigured()) { const fb = await getFirebaseAuth(); await fb.signOut(fb.auth); } } catch(_) {}
    try { await apiFetch('http://127.0.0.1:5000/api/auth/logout', { method:'POST' }); } catch(_) {}
    setSessionToken(null); localStorage.removeItem('tg_user');
    setUser(null); setMsgs([WELCOME]); setStats({ total_scans:0,pii_blocked:0,verified_safe:0,hallucinations_found:0 });
    setLogs([]); setAnalysis({}); setSelId(null); setNotifs([]);
    setSessions([]); setActiveSid(null); setSessionMsgs(null); setCurrentSid(`ses_${Date.now()}`);
  };

  const sendMsg = async () => {
    const txt = input.trim();
    if (!txt || activeSid) return;
    const um = { id:Date.now(), sender:'user', text:txt };
    setMsgs(p => [...p, um]); setInput('');
    if (textareaRef.current) { textareaRef.current.style.height = 'auto'; }
    setTyping(true);
    try {
      const res  = await apiFetch('http://127.0.0.1:5000/api/chat', { method:'POST', body:JSON.stringify({ message:txt, source:'Internal Chat', session_id:currentSid }) });
      const data = await res.json();
      setTyping(false);
      setMsgs(p => [...p, { id:Date.now()+1, sender:'bot', text:data.response, user_query:txt, session_id:currentSid }]);
      loadSessions();
    } catch {
      setTyping(false);
      setMsgs(p => [...p, { id:Date.now()+1, sender:'bot', text:'⚠ Could not reach backend. Ensure Flask is running on port 5000.' }]);
    }
  };

  /**
   * doAnalyze — always calls the backend fresh.
   *
   * We always re-run the analysis (never early-return with cached data)
   * so "Re-analyze" actually fetches live results each time.
   *
   * text      = the ORIGINAL bot response text (before any corrections/redactions)
   * userQuery = the user's question that triggered this bot response
   *             (needed so the RAG verifier can look up the right facts)
   */
  const doAnalyze = async (msgId, text, userQuery) => {
    // never early-return — always re-run analysis fresh for live results
    if (analysis[msgId]?.loading) return;

    // Always open the panel and start a fresh analysis run
    setSelId(msgId);
    setAnalysis(p => ({ ...p, [msgId]:{ loading:true } }));

    try {
      const res  = await apiFetch('http://127.0.0.1:5000/analyze', {
        method:'POST',
        body: JSON.stringify({ text, user_query: userQuery || text }),  // fallback ensures RAG query even without user_query
      });
      const data = await res.json();
      setAnalysis(p => ({ ...p, [msgId]:{ loading:false, data } }));

      const correction = data.hallucination_info?.correction;
      const hasCorrection = data.hallucination_info?.detected
        && correction
        && !['N/A','None','n/a','none',''].includes(correction.trim());
      const hasRedaction = data.pii_info?.detected
        && data.pii_info?.refined_text
        && data.pii_info.refined_text !== text;

      if (hasCorrection) {
        // Replace the bot bubble text with the live-verified correction
        setMsgs(prev => prev.map(m =>
          m.id === msgId
            ? { ...m, text: correction.trim(), _corrected:true,
                // Preserve _originalText so clicking Re-analyze again still uses the raw original
                _originalText: m._originalText || m.text }
            : m
        ));
        addNotif('✓ Response corrected — hallucination replaced with live data', 'warn');
      } else if (hasRedaction) {
        setMsgs(prev => prev.map(m =>
          m.id === msgId
            ? { ...m, text: data.pii_info.refined_text, _redacted:true,
                _originalText: m._originalText || m.text }
            : m
        ));
        addNotif('PII detected and redacted from response', 'danger');
      } else if (data.hallucination_info?.detected) {
        addNotif('Potential hallucination flagged — see analysis panel', 'warn');
      } else {
        addNotif('✓ Content verified — no issues found', 'info');
      }
    } catch {
      setAnalysis(p => ({ ...p, [msgId]:{ loading:false, error:true } }));
      addNotif('Analysis failed — check backend connection', 'danger');
    }
  };

  if (!user) return <AuthScreen onAuth={setUser} dark={dark} toggleDark={toggleDark}/>;

  const THREAT = (stats.pii_blocked>10||(stats.hallucinations_found||0)>5)?'HIGH':(stats.pii_blocked>4||(stats.hallucinations_found||0)>2)?'MEDIUM':'LOW';

  const displayMsgs = activeSid ? (sessionMsgs||[]) : msgs;
  const isReadOnly  = !!activeSid;

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--bg)' }}>
      <GlobalStyles dark={dark}/>

      {/* ─── SIDEBAR ─────────────────────────────────────── */}
      <aside style={{
        width: sidebarOpen ? 'var(--sidebar)' : 0,
        flexShrink:0, overflow:'hidden',
        background:'var(--surface)', borderRight:'1px solid var(--border)',
        display:'flex', flexDirection:'column',
        transition:'width .25s cubic-bezier(.22,1,.36,1)',
      }}>
        <div style={{ width:'var(--sidebar)', display:'flex', flexDirection:'column', height:'100%' }}>

          {/* Logo */}
          <div style={{ padding:'18px 14px 14px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:32,height:32,background:'linear-gradient(135deg,var(--accent),var(--accent2))',borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,boxShadow:'0 4px 12px rgba(92,71,224,.28)' }}>
                <Shield size={16} color="#fff" fill="#fff"/>
              </div>
              <div>
                <div className="serif" style={{ fontSize:15.5,color:'var(--text)',letterSpacing:'-0.2px',lineHeight:1.2 }}>TrustGuard</div>
                <div style={{ fontSize:10.5,color:'var(--text3)',fontWeight:600 }}>ENT v2.7</div>
              </div>
            </div>
          </div>

          {/* New Chat */}
          <div style={{ padding:'12px 10px 8px', flexShrink:0 }}>
            <button onClick={newChat} className="btn btn-primary" style={{ width:'100%',justifyContent:'center',padding:'9px 14px',borderRadius:10,fontSize:13,gap:7 }}>
              <PenSquare size={14}/> New Chat
            </button>
          </div>

          {/* Nav */}
          <div style={{ padding:'4px 8px', flexShrink:0 }}>
            {[
              { id:'chat',      icon:MessageSquare, label:'Internal Chat' },
              { id:'dashboard', icon:Activity,      label:'Dashboard' },
              { id:'analytics', icon:BarChart2,     label:'Analytics' },
              { id:'settings',  icon:Settings,      label:'Settings'  },
              ...(verifyData||verifyLoading ? [{ id:'verify', icon:ShieldCheck, label:'Verify Result', badge:true }] : []),
            ].map(({ id, icon:Icon, label, badge }) => (
              <div key={id} className={`nav-item ${tab===id&&!activeSid?'active':''}`}
                onClick={() => { setActiveSid(null); setSessionMsgs(null); setTab(id); }} style={{ marginBottom:2 }}>
                <Icon size={15} className="nav-icon"/>
                <span style={{ flex:1 }}>{label}</span>
                {badge && <span style={{ width:7,height:7,borderRadius:'50%',background:'var(--accent)',flexShrink:0,animation:'pulse 2s ease infinite' }}/>}
              </div>
            ))}
          </div>

          {/* Sessions */}
          <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column', paddingTop:6 }}>
            <div style={{ padding:'8px 12px 6px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
              <span className="sidebar-section" style={{ padding:0 }}>Chat History</span>
              {!sessLoaded && <div className="spin" style={{ width:11,height:11,border:'1.5px solid var(--border2)',borderTopColor:'var(--accent)',borderRadius:'50%' }}/>}
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:'0 8px 8px' }}>
              {sessLoaded && sessions.length === 0 && (
                <div style={{ padding:'20px 8px', textAlign:'center', color:'var(--text3)', fontSize:12.5 }}>
                  <MessageCircle size={22} style={{ margin:'0 auto 7px',display:'block',opacity:.3 }}/>
                  No chats yet
                </div>
              )}
              {sessions.map(sess => {
                const isActive = activeSid === sess.session_id;
                const hasRisk  = sess.risk_count > 0 || sess.pii_count > 0;
                return (
                  <div key={sess.session_id}
                    className={`session-item ${isActive?'active':''}`}
                    onClick={() => { setActiveSid(null); setSessionMsgs(null); loadSession(sess.session_id); setTab('chat'); }}>
                    <div style={{ width:6,height:6,borderRadius:'50%',background:hasRisk?'var(--danger)':'var(--ok)',flexShrink:0,marginTop:1 }}/>
                    <div className="title">{sess.title || 'Untitled chat'}</div>
                    <div style={{ fontSize:10,color:'var(--text3)',flexShrink:0 }}>{timeAgo(sess.updated_at)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* User profile */}
          <div style={{ padding:'10px 12px 14px', borderTop:'1px solid var(--border)', flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:9 }}>
              <div style={{ width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,var(--accent),var(--accent2))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#fff',flexShrink:0 }}>{user.avatar}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13,fontWeight:600,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{user.name}</div>
                <div style={{ fontSize:10.5,color:'var(--text3)' }}>{user.clearance}</div>
              </div>
              <button onClick={logout} className="btn btn-ghost btn-icon" title="Sign out"><LogOut size={13}/></button>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── MAIN AREA ───────────────────────────────────── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>

        {/* Top bar */}
        <header style={{ height:50,background:'var(--surface)',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 18px',flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button onClick={()=>setSidebarOpen(p=>!p)} className="btn btn-ghost btn-icon">
              {sidebarOpen ? <SidebarClose size={15}/> : <SidebarOpen size={15}/>}
            </button>
            <div style={{ width:1,height:16,background:'var(--border)' }}/>
            <div style={{ display:'flex',alignItems:'center',gap:6 }}>
              <span className={`status-dot ${backendUp?'live':''}`} style={{ background:backendUp?'var(--ok)':'var(--danger)' }}/>
              <span style={{ fontSize:12,color:backendUp?'var(--ok)':'var(--danger)',fontWeight:600 }}>{backendUp?'Connected':'Offline'}</span>
            </div>
            {activeSid && (
              <>
                <div style={{ width:1,height:16,background:'var(--border)' }}/>
                <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                  <Clock size={12} color="var(--warn)"/>
                  <span style={{ fontSize:12,color:'var(--warn)',fontWeight:600 }}>Viewing past chat</span>
                  <button onClick={()=>{setActiveSid(null);setSessionMsgs(null);setTab('chat');}} style={{ fontSize:11.5,color:'var(--accent)',background:'none',border:'none',cursor:'pointer',fontWeight:600,padding:'2px 6px',borderRadius:5,fontFamily:'Geist,sans-serif' }}>
                    ← Back to live
                  </button>
                </div>
              </>
            )}
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {/* System status pills */}
            <div style={{ display:'flex',gap:6 }}>
              {[
                { label:'Gemini',   ok:sysHealth.gemini,    icon:'🤖' },
                { label:'Firebase', ok:sysHealth.firebase,  icon:'🔥' },
                { label:'Encrypt',  ok:sysHealth.encryption,icon:'🔒' },
              ].map((s,i) => (
                <div key={i} style={{ display:'flex',alignItems:'center',gap:4,padding:'3px 8px',borderRadius:6,background:s.ok?'var(--ok-bg)':'var(--danger-bg)',border:`1px solid ${s.ok?'rgba(30,169,124,.2)':'rgba(224,75,58,.2)'}` }}>
                  <span style={{ fontSize:11 }}>{s.icon}</span>
                  <span style={{ fontSize:10.5,fontWeight:600,color:s.ok?'var(--ok)':'var(--danger)' }}>{s.label}</span>
                </div>
              ))}
            </div>

            {/* Notifications */}
            <div style={{ position:'relative' }}>
              <button onClick={()=>setShowNotifs(p=>!p)} className="btn btn-ghost btn-icon" style={{ position:'relative' }}>
                <Bell size={15}/>
                {notifs.length>0 && <span style={{ position:'absolute',top:5,right:5,width:6,height:6,background:'var(--danger)',borderRadius:'50%',border:'1.5px solid var(--surface)' }}/>}
              </button>
              {showNotifs && (
                <div className="card fade-in" style={{ position:'absolute',top:'calc(100% + 8px)',right:0,width:280,zIndex:60,boxShadow:'var(--sh-lg)',overflow:'hidden' }}>
                  <div style={{ padding:'10px 14px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                    <span style={{ fontWeight:700,fontSize:13 }}>Alerts</span>
                    <button onClick={()=>setNotifs([])} style={{ background:'none',border:'none',fontSize:11,color:'var(--text3)',cursor:'pointer',fontFamily:'Geist,sans-serif' }}>Clear</button>
                  </div>
                  <div style={{ maxHeight:220,overflowY:'auto' }}>
                    {notifs.length===0
                      ? <div style={{ padding:'16px',textAlign:'center',color:'var(--text3)',fontSize:12.5 }}>No alerts</div>
                      : notifs.map(n => (
                        <div key={n.id} style={{ padding:'9px 14px',borderBottom:'1px solid var(--border)',display:'flex',gap:9,alignItems:'flex-start' }}>
                          <div style={{ width:6,height:6,borderRadius:'50%',marginTop:4,flexShrink:0,background:n.type==='danger'?'var(--danger)':n.type==='warn'?'var(--warn)':'var(--info)' }}/>
                          <div><div style={{ fontSize:12.5,color:'var(--text)' }}>{n.msg}</div><div style={{ fontSize:10.5,color:'var(--text3)',marginTop:1 }}>{n.t}</div></div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>

            <button onClick={toggleDark} className="btn btn-ghost btn-icon">
              {dark?<Sun size={15}/>:<Moon size={15}/>}
            </button>
          </div>
        </header>

        {/* Page content */}
        <div style={{ flex:1, overflowY:'auto', overflowX:'hidden' }}>
          {tab==='chat' && (
            <ChatView
              msgs={displayMsgs} input={input} setInput={setInput}
              sendMsg={sendMsg} doAnalyze={doAnalyze}
              analysis={analysis} selId={selId} setSelId={setSelId}
              chatEnd={chatEnd} histLoad={histLoad} typing={typing}
              readOnly={isReadOnly} textareaRef={textareaRef} resizeTextarea={resizeTextarea}
              activeSid={activeSid} sessions={sessions} sessLoading={sessLoading}
              onSelectSession={(sid)=>{ loadSession(sid); }}
            />
          )}
          {tab==='dashboard' && <DashboardView stats={stats} logs={logs} THREAT={THREAT} sysHealth={sysHealth} backendUp={backendUp} sessions={sessions} onSessionClick={(sid)=>{ loadSession(sid); setTab('chat'); }}/>}
          {tab==='analytics' && <AnalyticsView stats={stats} logs={logs} sessions={sessions} onSessionClick={(sid)=>{ loadSession(sid); setTab('chat'); }}/>}
          {tab==='settings'  && <SettingsView user={user} dark={dark} toggleDark={toggleDark} sessionToken={user?.sessionToken || getSessionToken()}/>}
          {tab==='verify'    && <VerifyView verifyData={verifyData} verifyLoading={verifyLoading} onClose={()=>{ setVerifyData(null); setVerifyId(null); setTab('chat'); }}/>}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// VERIFY VIEW — shown when extension sends a deep-link
// ─────────────────────────────────────────────────────────────
function VerifyView({ verifyData, verifyLoading, onClose }) {
  if (verifyLoading) return (
    <div className="fade-up" style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,padding:40 }}>
      <div className="spin" style={{ width:40,height:40,border:'3px solid var(--border2)',borderTopColor:'var(--accent)',borderRadius:'50%' }}/>
      <div style={{ textAlign:'center' }}>
        <p style={{ fontSize:16,fontWeight:600,color:'var(--text)',marginBottom:6 }}>Running verification…</p>
        <p style={{ fontSize:13,color:'var(--text3)' }}>Checking facts, scanning for PII, validating sources</p>
      </div>
    </div>
  );
  if (!verifyData) return (
    <div style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text3)' }}>No verification data</div>
  );
  if (verifyData.error) return (
    <div style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--danger)',fontSize:14 }}>
      Error: {verifyData.error}
    </div>
  );

  const analysis  = verifyData.analysis || {};
  const hallOk    = !analysis.hallucination_info?.detected;
  const piiOk     = !analysis.pii_info?.detected;
  const allClear  = hallOk && piiOk;
  const source    = verifyData.source    || 'AI Tool';
  const sourceUrl = verifyData.source_url || '';

  return (
    <div className="fade-up" style={{ padding:'28px 32px',maxWidth:820,margin:'0 auto',width:'100%' }}>
      {/* Header */}
      <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:24 }}>
        <div>
          <h2 className="serif" style={{ fontSize:26,color:'var(--text)',letterSpacing:'-0.4px',marginBottom:6 }}>
            Verification Report
          </h2>
          <div style={{ display:'flex',alignItems:'center',gap:10,flexWrap:'wrap' }}>
            <span style={{ fontSize:13,color:'var(--text3)' }}>Source:</span>
            <span className={`badge ${source==='ChatGPT'?'badge-ok':source==='Gemini'?'badge-info':'badge-neutral'}`} style={{ fontSize:12 }}>
              {source==='ChatGPT'?'🤖':source==='Gemini'?'✨':'🔌'} {source}
            </span>
            {sourceUrl && (
              <a href={sourceUrl} target="_blank" rel="noopener noreferrer"
                style={{ fontSize:12,color:'var(--info)',textDecoration:'underline',textUnderlineOffset:2 }}>
                Open original page ↗
              </a>
            )}
          </div>
        </div>
        <button onClick={onClose} className="btn-ghost" style={{ padding:'7px 14px',fontSize:13 }}>
          <X size={13}/> Close
        </button>
      </div>

      {/* Overall verdict banner */}
      <div style={{ padding:'18px 22px',borderRadius:14,marginBottom:18,
        background:allClear?'var(--ok-bg)':'var(--danger-bg)',
        border:`1.5px solid ${allClear?'rgba(30,169,124,.25)':'rgba(224,75,58,.25)'}`,
        display:'flex',alignItems:'center',gap:14 }}>
        <div style={{ width:44,height:44,borderRadius:12,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',
          background:allClear?'rgba(30,169,124,.15)':'rgba(224,75,58,.15)' }}>
          {allClear ? <CheckCircle size={24} color="var(--ok)"/> : <AlertTriangle size={24} color="var(--danger)"/>}
        </div>
        <div>
          <div style={{ fontSize:16,fontWeight:700,color:'var(--text)',marginBottom:3 }}>
            {allClear ? '✓ Content verified — no issues found' : 'Issues detected in this response'}
          </div>
          <div style={{ fontSize:13,color:'var(--text2)',lineHeight:1.5 }}>
            {[
              !hallOk && 'Hallucination detected',
              !piiOk  && 'Private information (PII) found',
            ].filter(Boolean).join(' · ') || 'Content verified against live sources. Factually accurate and privacy-safe.'}
          </div>
        </div>
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14 }}>

        {/* Original text */}
        <div className="card" style={{ padding:20 }}>
          <div style={{ fontSize:13,fontWeight:700,color:'var(--text)',marginBottom:12,display:'flex',alignItems:'center',gap:7 }}>
            <FileText size={14} color="var(--text3)"/> Original Response
          </div>
          <div style={{ fontSize:13.5,color:'var(--text2)',lineHeight:1.7,maxHeight:180,overflowY:'auto',
            padding:'10px 14px',borderRadius:9,background:'var(--bg2)',border:'1px solid var(--border)' }}>
            {verifyData.original_text}
          </div>
        </div>

        {/* Refined / corrected text */}
        <div className="card" style={{ padding:20 }}>
          <div style={{ fontSize:13,fontWeight:700,color:'var(--text)',marginBottom:12,display:'flex',alignItems:'center',gap:7 }}>
            <ShieldCheck size={14} color={allClear?'var(--ok)':'var(--accent)'}/> 
            {allClear ? 'Verified Text (unchanged)' : 'Refined / Corrected Text'}
          </div>
          <div style={{ fontSize:13.5,color:'var(--text)',lineHeight:1.7,maxHeight:180,overflowY:'auto',
            padding:'10px 14px',borderRadius:9,
            background:allClear?'var(--ok-bg)':'var(--accent-bg)',
            border:`1px solid ${allClear?'rgba(30,169,124,.2)':'rgba(92,71,224,.2)'}` }}>
            {analysis.hallucination_info?.correction &&
             !['N/A','None','n/a'].includes(analysis.hallucination_info.correction)
              ? analysis.hallucination_info.correction
              : analysis.pii_info?.refined_text || verifyData.original_text}
          </div>
        </div>
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14 }}>

        {/* Factual accuracy card */}
        <div className="card" style={{ padding:20,
          background:hallOk?'var(--ok-bg)':undefined,
          border:hallOk?'1px solid rgba(30,169,124,.2)':undefined }}>
          <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:12 }}>
            {hallOk?<CheckCircle size={15} color="var(--ok)"/>:<AlertTriangle size={15} color="var(--danger)"/>}
            <span style={{ fontSize:13,fontWeight:700,color:'var(--text)' }}>Factual Accuracy</span>
            <span className={`badge ${hallOk?'badge-ok':'badge-danger'}`} style={{ marginLeft:'auto',fontSize:11 }}>
              {hallOk?'Verified ✓':'Issue Found'}
            </span>
          </div>
          <p style={{ fontSize:13,color:'var(--text2)',lineHeight:1.65,margin:0 }}>
            {analysis.hallucination_info?.reason && analysis.hallucination_info.reason !== 'N/A'
              ? analysis.hallucination_info.reason
              : 'Content cross-referenced with Wikipedia, Google Search, and ArXiv. No factual discrepancies found.'}
          </p>
          {analysis.hallucination_info?.correction &&
           !['N/A','None','n/a',''].includes(analysis.hallucination_info.correction) && (
            <div style={{ marginTop:12,padding:'10px 13px',borderRadius:9,background:'var(--surface2)',border:'1px solid var(--border)' }}>
              <div style={{ fontSize:10,fontWeight:700,color:'var(--warn)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:4 }}>
                Suggested correction
              </div>
              <p style={{ fontSize:13,color:'var(--text)',margin:0,lineHeight:1.6 }}>
                {analysis.hallucination_info.correction}
              </p>
            </div>
          )}
        </div>

        {/* PII card */}
        <div className="card" style={{ padding:20,
          background:piiOk?'var(--ok-bg)':undefined,
          border:piiOk?'1px solid rgba(30,169,124,.2)':undefined }}>
          <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:12 }}>
            <Lock size={15} color={piiOk?'var(--ok)':'var(--danger)'}/>
            <span style={{ fontSize:13,fontWeight:700,color:'var(--text)' }}>Privacy Scan</span>
            <span className={`badge ${piiOk?'badge-ok':'badge-danger'}`} style={{ marginLeft:'auto',fontSize:11 }}>
              {piiOk?'Clean ✓':'PII Detected'}
            </span>
          </div>
          {piiOk ? (
            <p style={{ fontSize:13,color:'var(--text2)',margin:0 }}>No personally identifiable information found in this response.</p>
          ) : (
            <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
              {(analysis.pii_info?.details||[]).slice(0,4).map((item,i) => {
                const isPublic = item.signals?.public_figure || item.is_public;
                const EXEMPT   = ['LOCATION','ADDRESS','DATE_TIME','NRP','URL','IP_ADDRESS'];
                const isExempt = EXEMPT.includes(item.type);
                const willRedact = item.verdict==='HIGH' && !isPublic && !isExempt;
                return (
                  <div key={i} style={{ padding:'9px 12px',borderRadius:9,background:'var(--bg2)',border:'1px solid var(--border)' }}>
                    <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4 }}>
                      <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                        <span style={{ fontSize:12,fontWeight:700,color:'var(--text)' }}>{item.type}</span>
                        {(isPublic||isExempt)&&<span style={{ fontSize:10,padding:'1px 5px',borderRadius:4,background:'var(--info-bg)',color:'var(--info)',fontWeight:600 }}>{isPublic?'Public':'Exempt'}</span>}
                      </div>
                      <span style={{ fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:5,background:riskBg(item.verdict),color:riskColor(item.verdict) }}>{item.verdict}</span>
                    </div>
                    <div style={{ fontSize:12,color:'var(--text2)' }}>
                      Entity: <strong style={{ color:'var(--text)' }}>{item.entity}</strong>
                      <span style={{ marginLeft:10,color:willRedact?'var(--danger)':'var(--ok)',fontWeight:600,fontSize:11 }}>{willRedact?'⊘ Redacted':'✓ Safe'}</span>
                    </div>
                  </div>
                );
              })}
              {(analysis.pii_info?.details||[]).length > 4 && (
                <p style={{ fontSize:12,color:'var(--text3)',margin:0 }}>+{analysis.pii_info.details.length-4} more entities detected</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* URL validation */}
      {analysis.url_check && analysis.url_check.length > 0 && (
        <div className="card" style={{ padding:18,marginBottom:14 }}>
          <div style={{ display:'flex',alignItems:'center',gap:7,marginBottom:10 }}>
            <Globe size={14} color="var(--info)"/>
            <span style={{ fontSize:13,fontWeight:700,color:'var(--text)' }}>URL Validation</span>
          </div>
          <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
            {analysis.url_check.map((u,i)=>(
              <div key={i} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 11px',borderRadius:8,background:'var(--bg2)',border:'1px solid var(--border)' }}>
                <span style={{ fontSize:12,color:'var(--text2)',overflow:'hidden',textOverflow:'ellipsis',maxWidth:'75%',whiteSpace:'nowrap' }}>{u.url}</span>
                <span style={{ fontSize:11,fontWeight:600,color:u.status==='VALID'?'var(--ok)':'var(--danger)',flexShrink:0 }}>{u.status==='VALID'?'✓ Valid':'✗ Invalid'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CHAT VIEW
// ─────────────────────────────────────────────────────────────
function ChatView({ msgs, input, setInput, sendMsg, doAnalyze, analysis, selId, setSelId, chatEnd, histLoad, typing, readOnly, textareaRef, resizeTextarea, activeSid, sessions, sessLoading, onSelectSession }) {
  return (
    <div style={{ display:'flex', height:'calc(100vh - 50px)', overflow:'hidden' }}>

      {/* Messages pane */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>

        {/* Chat header */}
        <div style={{ padding:'14px 24px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, background:'var(--surface)' }}>
          <div>
            {activeSid ? (
              <>
                <div style={{ fontSize:14,fontWeight:700,color:'var(--text)' }}>{sessions.find(s=>s.session_id===activeSid)?.title || 'Past conversation'}</div>
                <div style={{ fontSize:11.5,color:'var(--text3)',marginTop:2 }}>Read-only · {sessions.find(s=>s.session_id===activeSid)?.msg_count||0} messages</div>
              </>
            ) : (
              <>
                <div style={{ fontSize:14,fontWeight:700,color:'var(--text)' }}>Internal Chat</div>
                <div style={{ fontSize:11.5,color:'var(--text3)',marginTop:2 }}>Gemini 2.5-Flash · Presidio NLP · RAG</div>
              </>
            )}
          </div>
          {!activeSid && <div className="badge badge-accent" style={{ gap:5 }}><Zap size={10}/> Live</div>}
        </div>

        {/* Messages */}
        <div style={{ flex:1, padding:'24px', overflowY:'auto', display:'flex', flexDirection:'column', gap:20 }}>
          {histLoad && (
            <div className="fade-in" style={{ display:'flex',alignItems:'center',gap:8,padding:'8px 14px',borderRadius:10,background:'var(--info-bg)',border:'1px solid rgba(58,127,224,.2)',maxWidth:340 }}>
              <div className="spin" style={{ width:11,height:11,border:'1.5px solid rgba(58,127,224,.3)',borderTopColor:'var(--info)',borderRadius:'50%' }}/>
              <span style={{ fontSize:12,color:'var(--info)',fontWeight:500 }}>Loading history…</span>
            </div>
          )}

          {sessLoading && (
            <div style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:10,color:'var(--text3)' }}>
              <div className="spin" style={{ width:26,height:26,border:'2px solid var(--border2)',borderTopColor:'var(--accent)',borderRadius:'50%' }}/>
              <span style={{ fontSize:13 }}>Loading conversation…</span>
            </div>
          )}

          {!sessLoading && msgs.map((msg, i) => {
            const wasRedacted  = msg._redacted  === true;
            const wasCorrected = msg._corrected === true;
            const isUser = msg.sender === 'user';
            return (
              <div key={msg.id||i} className="fade-in" style={{ display:'flex', flexDirection:'column', alignItems:isUser?'flex-end':'flex-start', animationDelay:`${i < 3 ? i * 0.05 : 0}s` }}>
                {/* Avatar label */}
                <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:6 }}>
                  {!isUser && (
                    <div style={{ width:22,height:22,borderRadius:6,background:'linear-gradient(135deg,var(--accent),var(--accent2))',display:'flex',alignItems:'center',justifyContent:'center' }}>
                      <Shield size={11} color="#fff" fill="#fff"/>
                    </div>
                  )}
                  <span style={{ fontSize:11,fontWeight:600,color:'var(--text3)' }}>{isUser ? 'You' : 'TrustGuard AI'}</span>
                  {msg._fromHistory && <span style={{ fontSize:10,color:'var(--text3)',display:'flex',alignItems:'center',gap:3 }}><Clock size={9}/> history</span>}
                </div>

                <div style={{ maxWidth:'76%' }} className={isUser ? 'bubble-user' : (wasRedacted?'bubble-bot redacted':wasCorrected?'bubble-bot corrected':'bubble-bot')}>
                  {wasRedacted && !isUser && (
                    <div style={{ display:'flex',alignItems:'center',gap:5,marginBottom:8,paddingBottom:8,borderBottom:'1px solid rgba(224,75,58,.2)' }}>
                      <Lock size={10} color="var(--danger)"/>
                      <span style={{ fontSize:10,fontWeight:700,color:'var(--danger)',textTransform:'uppercase',letterSpacing:'.4px' }}>PII Redacted</span>
                    </div>
                  )}
                  {wasCorrected && !isUser && (
                    <div style={{ display:'flex',alignItems:'center',gap:5,marginBottom:8,paddingBottom:8,borderBottom:'1px solid rgba(208,138,42,.25)' }}>
                      <AlertTriangle size={10} color="var(--warn)"/>
                      <span style={{ fontSize:10,fontWeight:700,color:'var(--warn)',textTransform:'uppercase',letterSpacing:'.4px' }}>Hallucination Corrected</span>
                    </div>
                  )}
                  <div dangerouslySetInnerHTML={{ __html:fmt(msg.text) }} style={{ wordBreak:'break-word' }}/>
                </div>

                {!isUser && !readOnly && (
                  <button onClick={() => doAnalyze(msg.id, msg._originalText || msg.text, msg.user_query || (msgs[i-1]?.sender==='user' ? msgs[i-1]?.text : ''))}
                    style={{ marginTop:6,display:'flex',alignItems:'center',gap:5,fontSize:11.5,color:selId===msg.id?'var(--accent)':'var(--text3)',background:selId===msg.id?'var(--accent-bg)':'transparent',border:'none',cursor:'pointer',padding:'4px 9px',borderRadius:7,transition:'all .15s',fontFamily:'Geist,sans-serif',fontWeight:selId===msg.id?600:400 }}>
                    {analysis[msg.id]?.loading
                      ? <><div className="spin" style={{ width:9,height:9,border:'1.5px solid var(--text3)',borderTopColor:'var(--accent)',borderRadius:'50%' }}/> Analyzing…</>
                      : <><ShieldCheck size={11}/> {analysis[msg.id]?.data ? 'Re-analyze' : 'Analyze response'}</>
                    }
                  </button>
                )}
              </div>
            );
          })}

          {typing && (
            <div className="fade-in" style={{ display:'flex', flexDirection:'column', alignItems:'flex-start' }}>
              <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:6 }}>
                <div style={{ width:22,height:22,borderRadius:6,background:'linear-gradient(135deg,var(--accent),var(--accent2))',display:'flex',alignItems:'center',justifyContent:'center' }}>
                  <Shield size={11} color="#fff" fill="#fff"/>
                </div>
                <span style={{ fontSize:11,fontWeight:600,color:'var(--text3)' }}>TrustGuard AI</span>
              </div>
              <div className="bubble-bot" style={{ display:'flex',alignItems:'center',gap:5,padding:'14px 18px' }}>
                <div className="typing-dot"/><div className="typing-dot"/><div className="typing-dot"/>
              </div>
            </div>
          )}

          <div ref={chatEnd}/>
        </div>

        {/* Composer */}
        <div style={{ padding:'12px 24px 20px', flexShrink:0, background:'var(--surface)' }}>
          {readOnly ? (
            <div style={{ padding:'12px 18px',background:'var(--bg2)',border:'1.5px solid var(--border2)',borderRadius:14,color:'var(--text3)',fontSize:13.5,textAlign:'center',opacity:.7 }}>
              This is a past conversation — read only
            </div>
          ) : (
            <div className="chat-composer" style={{ maxWidth:860,margin:'0 auto' }}>
              <textarea
                ref={textareaRef}
                className="chat-textarea"
                placeholder="Ask anything — I'll verify and scan in real time…"
                value={input}
                onChange={e => { setInput(e.target.value); resizeTextarea(); }}
                onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
                rows={1}
              />
              <button onClick={sendMsg} disabled={!input.trim()}
                style={{ width:36,height:36,borderRadius:9,background:input.trim()?'var(--accent)':'var(--bg3)',border:'none',cursor:input.trim()?'pointer':'default',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .18s',flexShrink:0 }}>
                <Send size={15} color={input.trim()?'#fff':'var(--text3)'}/>
              </button>
            </div>
          )}
          {!readOnly && <div style={{ textAlign:'center',marginTop:8,fontSize:11,color:'var(--text3)' }}>Press Enter to send · Shift+Enter for newline · All responses are scanned in real time</div>}
        </div>
      </div>

      {/* Analysis panel */}
      <div style={{ width:340,borderLeft:'1px solid var(--border)',display:'flex',flexDirection:'column',flexShrink:0,background:'var(--surface)',overflow:'hidden' }}>
        <div style={{ padding:'14px 16px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <div style={{ display:'flex',alignItems:'center',gap:7 }}>
            <ShieldCheck size={14} color="var(--accent)"/>
            <span style={{ fontWeight:700,fontSize:13.5,color:'var(--text)' }}>Analysis</span>
          </div>
          {selId && <button onClick={()=>setSelId(null)} className="btn btn-ghost btn-icon" style={{ padding:5 }}><X size={13}/></button>}
        </div>
        <div style={{ flex:1, padding:14, overflowY:'auto' }}>
          {!selId ? (
            <div style={{ height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12,color:'var(--text3)',padding:20,textAlign:'center' }}>
              <div style={{ width:56,height:56,borderRadius:16,background:'var(--bg2)',display:'flex',alignItems:'center',justifyContent:'center' }}>
                <ShieldCheck size={24} color="var(--text3)" style={{ opacity:.4 }}/>
              </div>
              <div>
                <p style={{ fontWeight:600,fontSize:13.5,color:'var(--text2)',marginBottom:5 }}>No analysis selected</p>
                <p style={{ fontSize:12,lineHeight:1.65 }}>Click "Analyze" beneath any AI response to inspect it for hallucinations and PII.</p>
              </div>
            </div>
          ) : analysis[selId]?.loading ? (
            <div style={{ height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:14 }}>
              <div style={{ position:'relative' }}>
                <div className="spin" style={{ width:40,height:40,border:'2.5px solid var(--border2)',borderTopColor:'var(--accent)',borderRadius:'50%' }}/>
                <Shield size={14} color="var(--accent)" style={{ position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)' }}/>
              </div>
              <p style={{ fontSize:12.5,color:'var(--text2)',fontWeight:500 }}>Running safety checks…</p>
            </div>
          ) : analysis[selId]?.data ? (() => {
            const d = analysis[selId].data;
            return (
              <div className="fade-in" style={{ display:'flex',flexDirection:'column',gap:10 }}>
                {/* Factual check */}
                <div className="card-sm" style={{ padding:13,background:d.hallucination_info?.detected?'var(--danger-bg)':'var(--ok-bg)',border:`1px solid ${d.hallucination_info?.detected?'rgba(224,75,58,.2)':'rgba(30,169,124,.2)'}` }}>
                  <div style={{ display:'flex',alignItems:'center',gap:7,marginBottom:8 }}>
                    {d.hallucination_info?.detected ? <AlertTriangle size={13} color="var(--danger)"/> : <CheckCircle size={13} color="var(--ok)"/>}
                    <span style={{ fontWeight:700,fontSize:12.5,color:'var(--text)',flex:1 }}>Factual Accuracy</span>
                    <span style={{ fontSize:11,fontWeight:700,color:d.hallucination_info?.detected?'var(--danger)':'var(--ok)' }}>
                      {d.hallucination_info?.detected ? 'Flagged' : 'Verified ✓'}
                    </span>
                  </div>
                  <p style={{ fontSize:11.5,color:'var(--text2)',lineHeight:1.6,margin:0 }}>
                    {d.hallucination_info?.reason && d.hallucination_info.reason !== 'N/A'
                      ? d.hallucination_info.reason
                      : 'Content verified against live sources.'}
                  </p>
                  {d.hallucination_info?.correction && d.hallucination_info.correction !== 'N/A' && (
                    <div style={{ marginTop:9,padding:9,borderRadius:8,background:'var(--surface)',border:'1px solid var(--border)' }}>
                      <div style={{ fontSize:10,fontWeight:700,color:'var(--warn)',letterSpacing:'.4px',textTransform:'uppercase',marginBottom:4 }}>Correction</div>
                      <p style={{ fontSize:11.5,color:'var(--text)',margin:0,lineHeight:1.55 }}>{d.hallucination_info.correction}</p>
                    </div>
                  )}
                </div>

                {/* PII */}
                <div className="card-sm" style={{ padding:13,background:d.pii_info?.detected?'var(--danger-bg)':'var(--ok-bg)',border:`1px solid ${d.pii_info?.detected?'rgba(224,75,58,.2)':'rgba(30,169,124,.2)'}` }}>
                  <div style={{ display:'flex',alignItems:'center',gap:7,marginBottom:8 }}>
                    <Lock size={13} color={d.pii_info?.detected?'var(--danger)':'var(--ok)'}/>
                    <span style={{ fontWeight:700,fontSize:12.5,color:'var(--text)',flex:1 }}>Privacy (PII)</span>
                    <span style={{ fontSize:11,fontWeight:700,color:d.pii_info?.detected?'var(--danger)':'var(--ok)' }}>
                      {d.pii_info?.detected ? 'Detected' : 'Clean ✓'}
                    </span>
                  </div>
                  {!d.pii_info?.detected && <p style={{ fontSize:11.5,color:'var(--text2)',margin:0 }}>No personally identifiable information found.</p>}
                  {d.pii_info?.detected && (
                    <div style={{ display:'flex',flexDirection:'column',gap:7 }}>
                      {d.pii_info.details.map((item,i) => {
                        const isPublic  = item.signals?.public_figure || item.is_public;
                        const isExempt  = ['LOCATION','ADDRESS','DATE_TIME','NRP','URL','IP_ADDRESS'].includes(item.type);
                        const willRedact = item.verdict==='HIGH' && !isPublic && !isExempt;
                        return (
                          <div key={i} style={{ padding:'9px 11px',borderRadius:8,background:'var(--surface)',border:`1px solid ${riskColor(item.verdict)}22` }}>
                            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5 }}>
                              <div style={{ display:'flex',alignItems:'center',gap:5 }}>
                                <span style={{ fontSize:11.5,fontWeight:700,color:'var(--text)' }}>{item.type}</span>
                                {(isPublic||isExempt) && <span style={{ fontSize:9.5,padding:'1px 5px',borderRadius:4,background:'var(--info-bg)',color:'var(--info)',fontWeight:600 }}>{isPublic?'Public':'Exempt'}</span>}
                              </div>
                              <span style={{ fontSize:10,fontWeight:700,padding:'2px 6px',borderRadius:5,background:riskBg(item.verdict),color:riskColor(item.verdict) }}>{item.verdict}</span>
                            </div>
                            <div style={{ fontSize:11.5,color:'var(--text2)',marginBottom:5 }}>Entity: <strong style={{ color:'var(--text)' }}>{item.entity}</strong></div>
                            <div className="prog"><div className="prog-fill" style={{ width:`${parseFloat(item.risk_score)*100}%`,background:riskColor(item.verdict) }}/></div>
                            <div style={{ display:'flex',justifyContent:'space-between',fontSize:10.5,color:'var(--text3)',marginTop:4 }}>
                              <span>Score: {item.risk_score}</span>
                              <span style={{ color:willRedact?'var(--danger)':'var(--ok)',fontWeight:600 }}>{willRedact?'⊘ Redacted':'✓ Safe'}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* URL */}
                {d.url_check?.length > 0 && (
                  <div className="card-sm" style={{ padding:13 }}>
                    <div style={{ display:'flex',alignItems:'center',gap:7,marginBottom:9 }}>
                      <Globe size={13} color="var(--info)"/>
                      <span style={{ fontWeight:700,fontSize:12.5,color:'var(--text)' }}>URL Check</span>
                    </div>
                    {d.url_check.map((u,i) => (
                      <div key={i} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'5px 0',borderBottom:i<d.url_check.length-1?'1px solid var(--border)':'none' }}>
                        <span style={{ fontSize:11.5,color:'var(--text2)',overflow:'hidden',textOverflow:'ellipsis',maxWidth:180,whiteSpace:'nowrap' }}>{u.url}</span>
                        <span style={{ fontSize:11,fontWeight:600,color:u.status==='VALID'?'var(--ok)':'var(--danger)',flexShrink:0 }}>{u.status==='VALID'?'✓ Valid':'✗ Invalid'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })() : (
            <div style={{ padding:16,textAlign:'center',color:'var(--danger)',fontSize:12.5 }}>Analysis failed. Check backend.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────
function DashboardView({ stats, logs, THREAT, sysHealth, backendUp, sessions, onSessionClick }) {
  const tot = stats.total_scans || 1;
  const riskScore = Math.min(100, Math.round((stats.pii_blocked*4) + ((stats.hallucinations_found||0)*6)));
  const gaugeColor = riskScore>60?'var(--danger)':riskScore>30?'var(--warn)':'var(--ok)';
  const riskLogs = logs.filter(l => l.status==='Risk').slice(0,5);

  const sparkData = (() => {
    const b = {};
    logs.forEach(l => { const k=(l.timestamp||'00:00').slice(0,5); if(!b[k]) b[k]={safe:0,risk:0}; l.status==='Risk'?b[k].risk++:b[k].safe++; });
    return Object.entries(b).sort().slice(-12).map(([k,v]) => ({ k,...v,total:v.safe+v.risk }));
  })();
  const maxSpark = Math.max(...sparkData.map(d=>d.total),1);

  return (
    <div className="fade-up" style={{ padding:'28px 32px',maxWidth:1100,margin:'0 auto' }}>
      <div style={{ marginBottom:24 }}>
        <h2 className="serif" style={{ fontSize:26,color:'var(--text)',letterSpacing:'-0.4px' }}>Dashboard</h2>
        <p style={{ color:'var(--text3)',fontSize:13,marginTop:4 }}>Real-time safety monitoring · v{sysHealth.version}</p>
      </div>

      {/* Stat cards */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:18 }}>
        {[
          { label:'Total Scans',    value:stats.total_scans,             color:'var(--info)',   icon:Activity },
          { label:'PII Prevented',  value:stats.pii_blocked,             color:'var(--danger)', icon:Lock },
          { label:'Verified Safe',  value:stats.verified_safe,           color:'var(--ok)',     icon:CheckCircle },
          { label:'Hallucinations', value:stats.hallucinations_found||0, color:'var(--warn)',   icon:AlertTriangle },
        ].map((c,i) => (
          <div key={i} className="card" style={{ padding:20 }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14 }}>
              <div>
                <div style={{ fontSize:11,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:6 }}>{c.label}</div>
                <div style={{ fontSize:30,fontWeight:700,color:'var(--text)',letterSpacing:'-1.5px',lineHeight:1 }}>{c.value}</div>
              </div>
              <div style={{ width:38,height:38,borderRadius:10,background:`${c.color}22`,display:'flex',alignItems:'center',justifyContent:'center' }}>
                <c.icon size={17} color={c.color}/>
              </div>
            </div>
            <div className="prog prog-md"><div className="prog-fill" style={{ width:`${Math.round(c.value/tot*100)}%`,background:c.color }}/></div>
            <div style={{ fontSize:11,color:'var(--text3)',marginTop:6 }}>{Math.round(c.value/tot*100)}% of total</div>
          </div>
        ))}
      </div>

      {/* Middle row */}
      <div style={{ display:'grid',gridTemplateColumns:'150px 1fr 1fr',gap:14,marginBottom:18 }}>
        {/* Gauge */}
        <div className="card" style={{ padding:18,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8 }}>
          <div style={{ fontSize:10.5,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.5px' }}>Risk Score</div>
          <div style={{ position:'relative',width:90,height:90 }}>
            <svg viewBox="0 0 90 90" width="90" height="90">
              <path d="M 15 75 A 35 35 0 0 1 75 75" fill="none" stroke="var(--border2)" strokeWidth="9" strokeLinecap="round"/>
              <path d="M 15 75 A 35 35 0 0 1 75 75" fill="none" stroke={gaugeColor} strokeWidth="9" strokeLinecap="round"
                strokeDasharray={`${(riskScore/100)*110} 110`} style={{ transition:'stroke-dasharray .8s ease' }}/>
              <circle cx="45" cy="75" r="4" fill={gaugeColor}/>
            </svg>
            <div style={{ position:'absolute',top:'40%',left:0,right:0,textAlign:'center' }}>
              <div style={{ fontSize:22,fontWeight:800,color:'var(--text)',letterSpacing:'-1px' }}>{riskScore}</div>
            </div>
          </div>
          <div style={{ fontSize:11.5,fontWeight:700,color:gaugeColor }}>{riskScore>60?'HIGH':riskScore>30?'MEDIUM':'SAFE'}</div>
        </div>

        {/* Sparkline */}
        <div className="card" style={{ padding:18 }}>
          <div style={{ fontSize:12.5,fontWeight:700,color:'var(--text)',marginBottom:14 }}>Scan Activity</div>
          {sparkData.length === 0 ? (
            <div style={{ height:72,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text3)',fontSize:12 }}>No data yet</div>
          ) : (
            <div style={{ display:'flex',alignItems:'flex-end',gap:3,height:72 }}>
              {sparkData.map((d,i) => (
                <div key={i} style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',height:'100%',justifyContent:'flex-end' }}>
                  {d.risk>0 && <div style={{ width:'100%',height:`${(d.risk/maxSpark)*62}px`,background:'var(--danger)',opacity:.8,borderRadius:'2px 2px 0 0',minHeight:2 }}/>}
                  {d.safe>0 && <div style={{ width:'100%',height:`${(d.safe/maxSpark)*62}px`,background:'var(--ok)',opacity:.8,borderRadius:d.risk>0?'0':'2px 2px 0 0',minHeight:2 }}/>}
                </div>
              ))}
            </div>
          )}
          <div style={{ display:'flex',gap:12,marginTop:10 }}>
            <div style={{ display:'flex',alignItems:'center',gap:4 }}><div style={{ width:8,height:8,borderRadius:2,background:'var(--ok)' }}/><span style={{ fontSize:10.5,color:'var(--text3)' }}>Safe</span></div>
            <div style={{ display:'flex',alignItems:'center',gap:4 }}><div style={{ width:8,height:8,borderRadius:2,background:'var(--danger)' }}/><span style={{ fontSize:10.5,color:'var(--text3)' }}>Risk</span></div>
          </div>
        </div>

        {/* Recent threats */}
        <div className="card" style={{ padding:18,overflow:'hidden' }}>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12 }}>
            <div style={{ fontSize:12.5,fontWeight:700,color:'var(--text)' }}>Recent Threats</div>
            <span className="badge badge-danger" style={{ fontSize:10 }}>{riskLogs.length}</span>
          </div>
          {riskLogs.length === 0 ? (
            <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:80,color:'var(--text3)',fontSize:12,gap:7 }}>
              <CheckCircle size={22} color="var(--ok)"/>
              <span>No threats detected</span>
            </div>
          ) : riskLogs.map((log,i) => (
            <div key={i} style={{ display:'flex',alignItems:'center',gap:8,padding:'7px 9px',borderRadius:8,background:'var(--danger-bg)',border:'1px solid rgba(224,75,58,.12)',marginBottom:6 }}>
              <AlertTriangle size={11} color="var(--danger)" style={{ flexShrink:0 }}/>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontSize:11,fontWeight:600,color:'var(--danger)' }}>{log.risk}</div>
                <div style={{ fontSize:11,color:'var(--text3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{log.snippet||'—'}</div>
              </div>
              <span style={{ fontSize:10,color:'var(--text3)',flexShrink:0 }}>{log.timestamp}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent sessions */}
      {sessions?.length > 0 && (
        <div className="card" style={{ marginBottom:18,overflow:'hidden' }}>
          <div style={{ padding:'14px 18px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
            <span style={{ fontWeight:700,fontSize:13.5,color:'var(--text)' }}>Recent Conversations</span>
            <span style={{ fontSize:12,color:'var(--text3)' }}>{sessions.length} total</span>
          </div>
          {sessions.slice(0,5).map((sess,i) => {
            const isRisk = sess.risk_count>0||sess.pii_count>0;
            return (
              <div key={i} onClick={()=>onSessionClick(sess.session_id)}
                style={{ display:'flex',alignItems:'center',gap:12,padding:'11px 18px',cursor:'pointer',borderBottom:i<Math.min(sessions.length,5)-1?'1px solid var(--border)':'none',transition:'background .15s' }}
                onMouseEnter={e=>e.currentTarget.style.background='var(--bg2)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <div style={{ width:30,height:30,borderRadius:8,background:isRisk?'var(--danger-bg)':'var(--ok-bg)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                  {isRisk?<AlertTriangle size={13} color="var(--danger)"/>:<CheckCircle size={13} color="var(--ok)"/>}
                </div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontSize:13,fontWeight:500,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{sess.title}</div>
                  <div style={{ fontSize:11,color:'var(--text3)',marginTop:2 }}>{sess.source} · {sess.msg_count} messages · {timeAgo(sess.updated_at)}</div>
                </div>
                <div style={{ display:'flex',gap:5,flexShrink:0 }}>
                  {sess.pii_count>0 && <span className="badge badge-warn" style={{ fontSize:10 }}><Lock size={9}/> {sess.pii_count}</span>}
                  {sess.risk_count>0 && <span className="badge badge-danger" style={{ fontSize:10 }}><AlertTriangle size={9}/> {sess.risk_count}</span>}
                  {!isRisk && <span className="badge badge-ok" style={{ fontSize:10 }}>✓ Clean</span>}
                </div>
                <ChevronRight size={13} color="var(--text3)"/>
              </div>
            );
          })}
        </div>
      )}

      {/* Activity table */}
      <div className="card" style={{ overflow:'hidden' }}>
        <div style={{ padding:'14px 18px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
          <div>
            <span style={{ fontWeight:700,fontSize:13.5,color:'var(--text)' }}>Live Activity</span>
            <span style={{ fontSize:12,color:'var(--text3)',marginLeft:10 }}>{logs.length} entries</span>
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:8 }}>
            <span style={{ fontSize:11,color:'var(--text3)' }}>
              <span style={{ color:'var(--ok)',fontWeight:700 }}>{logs.filter(l=>l.status==='Safe'||l.status==='Verified Fact').length}</span> safe ·{' '}
              <span style={{ color:'var(--danger)',fontWeight:700 }}>{logs.filter(l=>l.status==='Risk').length}</span> risk
            </span>
            <div style={{ display:'flex',alignItems:'center',gap:5 }}>
              <span className="status-dot live"/>
              <span style={{ fontSize:11,fontWeight:600,color:'var(--ok)' }}>Live</span>
            </div>
          </div>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table className="data-table">
            <thead><tr>{['Time','Source','Snippet','Status','Risk','Enc'].map(h=><th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {logs.length===0
                ? <tr><td colSpan={6} style={{ textAlign:'center',padding:'32px',color:'var(--text3)',fontSize:13 }}>No activity yet.</td></tr>
                : logs.map((log,i) => (
                  <tr key={log.id||i}>
                    <td style={{ color:'var(--text3)',fontVariantNumeric:'tabular-nums',fontSize:12 }}>{log.timestamp}</td>
                    <td><span className={`badge ${log.source==='Internal Chat'?'badge-accent':log.source==='ChatGPT'?'badge-ok':'badge-info'}`} style={{ fontSize:10.5 }}>{log.source}</span></td>
                    <td style={{ maxWidth:220,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:'var(--text)' }}>{log.snippet}</td>
                    <td><span className={`badge ${(log.status==='Safe'||log.status==='Verified Fact')?'badge-ok':'badge-danger'}`} style={{ fontSize:10.5 }}>
                      {(log.status==='Safe'||log.status==='Verified Fact')?<CheckCircle size={9}/>:<AlertCircle size={9}/>} {log.status}
                    </span></td>
                    <td style={{ color:'var(--text2)',fontSize:12 }}>{log.risk}</td>
                    <td><span style={{ fontSize:11,fontWeight:600,color:log.enc?'var(--ok)':'var(--text3)' }}>{log.enc?'🔒':'—'}</span></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────────────────────────────
function AnalyticsView({ stats, logs, sessions, onSessionClick }) {
  const tot = stats.total_scans || 1;
  const piiColors = ['var(--danger)','var(--warn)','var(--info)','var(--ok)','var(--accent)'];
  const piiTypes = stats.top_pii_types || {};
  const piiTotal = Object.values(piiTypes).reduce((a,b)=>a+b,0) || 1;
  const srcCount = logs.reduce((a,l) => { a[l.source]=(a[l.source]||0)+1; return a; }, {});
  const srcTotal = logs.length || 1;
  const hourlyData = (() => {
    const b = {};
    logs.forEach(l => { const h=(l.timestamp||'').split(':')[0]||'??'; if(!b[h]) b[h]={safe:0,risk:0}; (l.status==='Safe'||l.status==='Verified Fact')?b[h].safe++:b[h].risk++; });
    return Object.keys(b).sort().slice(-8).map(k => ({ label:`${k}h`,safe:b[k].safe,risk:b[k].risk,total:b[k].safe+b[k].risk }));
  })();
  const maxBar = Math.max(...hourlyData.map(d=>d.total),1);

  return (
    <div className="fade-up" style={{ padding:'28px 32px',maxWidth:1100,margin:'0 auto' }}>
      <div style={{ marginBottom:24 }}>
        <h2 className="serif" style={{ fontSize:26,color:'var(--text)',letterSpacing:'-0.4px' }}>Analytics</h2>
        <p style={{ color:'var(--text3)',fontSize:13,marginTop:4 }}>Detection metrics, scan trends and conversation analysis</p>
      </div>

      {/* Rate cards */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:18 }}>
        {[
          { label:'PII Rate',        value:Math.round(stats.pii_blocked/tot*100),               color:'var(--danger)', icon:Lock },
          { label:'Safe Rate',       value:Math.round(stats.verified_safe/tot*100),              color:'var(--ok)',     icon:CheckCircle },
          { label:'Hallucination %', value:Math.round((stats.hallucinations_found||0)/tot*100),  color:'var(--warn)',   icon:AlertTriangle },
          { label:'Efficiency',      value:Math.max(0,100-Math.round(stats.pii_blocked/tot*100)),color:'var(--info)',   icon:TrendingUp },
        ].map((m,i) => (
          <div key={i} className="card" style={{ padding:18,display:'flex',alignItems:'center',gap:14 }}>
            <div style={{ position:'relative',width:52,height:52,flexShrink:0 }}>
              <svg viewBox="0 0 52 52" width="52" height="52" style={{ transform:'rotate(-90deg)' }}>
                <circle cx="26" cy="26" r="21" fill="none" stroke="var(--border2)" strokeWidth="5"/>
                <circle cx="26" cy="26" r="21" fill="none" stroke={m.color} strokeWidth="5"
                  strokeDasharray={`${m.value*1.319} 131.9`} strokeLinecap="round"/>
              </svg>
              <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center' }}>
                <m.icon size={12} color={m.color}/>
              </div>
            </div>
            <div>
              <div style={{ fontSize:10.5,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.4px',marginBottom:3 }}>{m.label}</div>
              <div style={{ fontSize:22,fontWeight:800,color:'var(--text)',letterSpacing:'-1px',lineHeight:1 }}>{m.value}<span style={{ fontSize:12,color:'var(--text3)' }}>%</span></div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display:'grid',gridTemplateColumns:'1fr 2fr',gap:14,marginBottom:18 }}>
        {/* Traffic by source */}
        <div className="card" style={{ padding:20 }}>
          <h3 style={{ fontSize:13.5,fontWeight:700,color:'var(--text)',marginBottom:16 }}>Traffic by Source</h3>
          {Object.keys(srcCount).length===0 ? <p style={{ color:'var(--text3)',fontSize:12.5 }}>No data yet.</p> : (
            <div style={{ display:'flex',flexDirection:'column',gap:11 }}>
              {Object.entries(srcCount).sort((a,b)=>b[1]-a[1]).map(([src,cnt]) => (
                <div key={src}>
                  <div style={{ display:'flex',justifyContent:'space-between',marginBottom:5 }}>
                    <span style={{ fontSize:13,fontWeight:500,color:'var(--text)' }}>{src}</span>
                    <span style={{ fontSize:12,color:'var(--text3)' }}>{cnt} ({Math.round(cnt/srcTotal*100)}%)</span>
                  </div>
                  <div className="prog prog-md"><div className="prog-fill" style={{ width:`${cnt/srcTotal*100}%`,background:'var(--accent)' }}/></div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hourly chart */}
        <div className="card" style={{ padding:20 }}>
          <h3 style={{ fontSize:13.5,fontWeight:700,color:'var(--text)',marginBottom:16 }}>Hourly Activity</h3>
          {hourlyData.length===0 ? <div style={{ height:130,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text3)',fontSize:13 }}>Start chatting to see activity</div> : (
            <div style={{ display:'flex',alignItems:'flex-end',gap:6,height:130,position:'relative',paddingBottom:22 }}>
              {[25,50,75,100].map(p=><div key={p} style={{ position:'absolute',left:0,right:0,bottom:`${22+(p/100)*(130-22)}px`,borderTop:'1px dashed var(--border)',opacity:.4 }}/>)}
              {hourlyData.map((d,i) => (
                <div key={i} style={{ flex:1,minWidth:24,display:'flex',flexDirection:'column',alignItems:'center',position:'relative',zIndex:1 }}>
                  <div style={{ width:'100%',display:'flex',flexDirection:'column',justifyContent:'flex-end',height:108 }}>
                    {d.risk>0&&<div style={{ width:'100%',height:`${(d.risk/maxBar)*100}%`,background:'var(--danger)',opacity:.85,borderRadius:d.safe>0?'0':'3px 3px 0 0',minHeight:2 }}/>}
                    {d.safe>0&&<div style={{ width:'100%',height:`${(d.safe/maxBar)*100}%`,background:'var(--ok)',opacity:.85,borderRadius:d.risk>0?'0':'3px 3px 0 0',minHeight:2 }}/>}
                  </div>
                  <div style={{ fontSize:9,color:'var(--text3)',marginTop:4,whiteSpace:'nowrap' }}>{d.label}</div>
                </div>
              ))}
            </div>
          )}
          <div style={{ display:'flex',gap:14,marginTop:4 }}>
            <div style={{ display:'flex',alignItems:'center',gap:4 }}><div style={{ width:9,height:9,borderRadius:2,background:'var(--ok)' }}/><span style={{ fontSize:11,color:'var(--text3)' }}>Safe</span></div>
            <div style={{ display:'flex',alignItems:'center',gap:4 }}><div style={{ width:9,height:9,borderRadius:2,background:'var(--danger)' }}/><span style={{ fontSize:11,color:'var(--text3)' }}>Risk</span></div>
          </div>
        </div>
      </div>

      {/* Session analysis */}
      {sessions?.length > 0 && (
        <div className="card" style={{ marginBottom:18,overflow:'hidden' }}>
          <div style={{ padding:'14px 18px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
            <span style={{ fontWeight:700,fontSize:13.5,color:'var(--text)' }}>Conversation Analysis</span>
            <span style={{ fontSize:12,color:'var(--text3)' }}>{sessions.length} sessions</span>
          </div>
          {sessions.slice(0,8).map((sess,i) => {
            const isRisk = sess.risk_count>0||sess.pii_count>0;
            return (
              <div key={i} onClick={()=>onSessionClick(sess.session_id)}
                style={{ display:'flex',alignItems:'center',gap:12,padding:'10px 18px',cursor:'pointer',borderBottom:i<Math.min(sessions.length,8)-1?'1px solid var(--border)':'none',transition:'background .15s' }}
                onMouseEnter={e=>e.currentTarget.style.background='var(--bg2)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <div style={{ width:28,height:28,borderRadius:7,background:isRisk?'var(--danger-bg)':'var(--ok-bg)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                  {isRisk?<AlertTriangle size={12} color="var(--danger)"/>:<CheckCircle size={12} color="var(--ok)"/>}
                </div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontSize:13,fontWeight:500,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{sess.title}</div>
                  <div style={{ fontSize:11,color:'var(--text3)',marginTop:1 }}>{sess.source} · {sess.msg_count} msgs · {timeAgo(sess.updated_at)}</div>
                </div>
                <div style={{ display:'flex',gap:5 }}>
                  {sess.pii_count>0&&<span className="badge badge-warn" style={{ fontSize:10 }}>{sess.pii_count} PII</span>}
                  {sess.risk_count>0&&<span className="badge badge-danger" style={{ fontSize:10 }}>{sess.risk_count} risk</span>}
                  {!isRisk&&<span className="badge badge-ok" style={{ fontSize:10 }}>✓ Clean</span>}
                </div>
                <ChevronRight size={13} color="var(--text3)"/>
              </div>
            );
          })}
        </div>
      )}

      {/* PII distribution */}
      <div className="card" style={{ padding:20 }}>
        <h3 style={{ fontSize:13.5,fontWeight:700,color:'var(--text)',marginBottom:16 }}>PII Type Distribution</h3>
        {Object.keys(piiTypes).length===0 ? (
          <div style={{ color:'var(--text3)',fontSize:12.5 }}>No PII detected yet. Your conversations are clean.</div>
        ) : (
          <div style={{ display:'flex',flexDirection:'column',gap:11 }}>
            {Object.entries(piiTypes).sort((a,b)=>b[1]-a[1]).map(([type,count],i) => (
              <div key={type}>
                <div style={{ display:'flex',justifyContent:'space-between',marginBottom:5 }}>
                  <div style={{ display:'flex',alignItems:'center',gap:7 }}>
                    <div style={{ width:9,height:9,borderRadius:2,background:piiColors[i%5] }}/>
                    <span style={{ fontSize:12.5,color:'var(--text2)' }}>{type}</span>
                  </div>
                  <span style={{ fontSize:12,color:'var(--text3)' }}>{count} ({Math.round(count/piiTotal*100)}%)</span>
                </div>
                <div className="prog prog-md"><div className="prog-fill" style={{ width:`${count/piiTotal*100}%`,background:piiColors[i%5] }}/></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// ACTIVE PERSONALIZATION PREVIEW CARD
// ─────────────────────────────────────────────────────────────
function ActivePreviewCard({ prefs, prefStatus }) {
  const [debugData, setDebugData] = useState(null);
  const [loading, setLoading]    = useState(false);
  const [open, setOpen]          = useState(false);

  const testPersonalization = async () => {
    setLoading(true); setOpen(true);
    try {
      const res  = await apiFetch('http://127.0.0.1:5000/api/personalization/debug');
      const data = await res.json();
      setDebugData(data);
      console.log('Personalization debug:', data);
    } catch(e) {
      setDebugData({ error: e.message });
    }
    setLoading(false);
  };

  const active = [];
  if (prefs.nickname)                active.push(`Called "${prefs.nickname}"`);
  if (prefs.occupation)              active.push(`${prefs.occupation} context`);
  if (prefs.style !== 'balanced')    active.push(`${prefs.style} responses`);
  if (prefs.tone  !== 'neutral')     active.push(`${prefs.tone} tone`);
  if (prefs.warm)                    active.push('warm');
  if (prefs.enthusiastic)            active.push('enthusiastic');
  if (prefs.headersLists)            active.push('headers & lists');
  if (prefs.emoji)                   active.push('emoji');
  if (prefs.customInstructions)      active.push('custom instructions');

  return (
    <div className="fade-in" style={{ marginBottom:14 }}>
      <div style={{ padding:'14px 18px', borderRadius:11, background:'var(--accent-bg)', border:'1px solid rgba(92,71,224,.2)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
          <div style={{ fontSize:12.5, fontWeight:700, color:'var(--accent)', display:'flex', alignItems:'center', gap:6 }}>
            <Sparkles size={12}/> Personalization active
            {prefStatus === 'saved'  && <span style={{ fontSize:11, color:'var(--ok)',    fontWeight:500 }}>· just saved ✓</span>}
            {prefStatus === 'saving' && <span style={{ fontSize:11, color:'var(--text3)', fontWeight:500 }}>· saving…</span>}
            {prefStatus === 'error'  && <span style={{ fontSize:11, color:'var(--danger)',fontWeight:500 }}>· save failed ✗</span>}
          </div>
          <button onClick={testPersonalization} disabled={loading}
            style={{ padding:'5px 12px', borderRadius:7, border:'1px solid rgba(92,71,224,.3)', background:'transparent', color:'var(--accent)', fontSize:11.5, fontWeight:600, cursor:'pointer', fontFamily:'Geist,sans-serif', display:'flex', alignItems:'center', gap:5 }}>
            {loading ? <><div className="spin" style={{ width:10,height:10,border:'1.5px solid rgba(92,71,224,.3)',borderTopColor:'var(--accent)',borderRadius:'50%' }}/> Verifying…</> : '🔍 Verify active'}
          </button>
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
          {active.map((tag,i) => (
            <span key={i} style={{ fontSize:11.5, padding:'3px 9px', borderRadius:12, background:'var(--surface2)', border:'1px solid rgba(92,71,224,.15)', color:'var(--text2)', fontWeight:500 }}>
              {tag}
            </span>
          ))}
        </div>
        {open && debugData && (
          <div className="fade-in" style={{ marginTop:12, padding:'12px 14px', borderRadius:9, background:'var(--surface2)', border:'1px solid var(--border)' }}>
            {debugData.error ? (
              <p style={{ fontSize:12, color:'var(--danger)' }}>Error: {debugData.error}</p>
            ) : (
              <>
                <div style={{ display:'flex', gap:12, marginBottom:8, flexWrap:'wrap' }}>
                  <span style={{ fontSize:11.5, color: debugData.has_prefs?'var(--ok)':'var(--danger)', fontWeight:600 }}>
                    {debugData.has_prefs ? '✓ Prefs loaded by backend' : '✗ No prefs found on backend'}
                  </span>
                  <span style={{ fontSize:11.5, color: debugData.cache_hit?'var(--ok)':'var(--text3)', fontWeight:600 }}>
                    {debugData.cache_hit ? '✓ In-memory cache hit' : '○ Not in cache'}
                  </span>
                  <span style={{ fontSize:11.5, color:'var(--text3)' }}>UID: {(debugData.uid||'').slice(0,14)}…</span>
                </div>
                <details style={{ cursor:'pointer' }}>
                  <summary style={{ fontSize:11.5, color:'var(--text3)', fontWeight:600, userSelect:'none' }}>
                    View system prompt ({debugData.prompt_len} chars)
                  </summary>
                  <pre style={{ marginTop:8, fontSize:11, color:'var(--text2)', lineHeight:1.6, whiteSpace:'pre-wrap', wordBreak:'break-word', background:'var(--bg2)', padding:'10px 12px', borderRadius:7, border:'1px solid var(--border)' }}>
                    {debugData.system_prompt}
                  </pre>
                </details>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MEMORY VIEW — Memory tab inside Settings
// ─────────────────────────────────────────────────────────────
function MemoryView({ sessionToken }) {
  const [memories,   setMemories]   = useState([]);
  const [count,      setCount]      = useState(0);
  const [limit,      setLimit]      = useState(50);
  const [pctUsed,    setPctUsed]    = useState(0);
  const [full,       setFull]       = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [adding,     setAdding]     = useState(false);
  const [clearing,   setClearing]   = useState(false);
  const [newText,    setNewText]    = useState('');
  const [error,      setError]      = useState('');
  const [deleting,   setDeleting]   = useState(new Set());
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const localFetch = useCallback((url, opts={}) => {
    const tok = sessionToken || getSessionToken();
    return fetch(url, {
      ...opts,
      headers: { 'Content-Type':'application/json', ...(opts.headers||{}),
                 ...(tok ? {'Authorization':`Bearer ${tok}`} : {}) }
    });
  }, [sessionToken]);

  const load = useCallback(async () => {
    try {
      const res  = await localFetch('http://127.0.0.1:5000/api/memory');
      const data = await res.json();
      if (res.ok) {
        setMemories(data.memories || []);
        setCount(data.count || 0);
        setLimit(data.limit || 50);
        setPctUsed(data.pct_used || 0);
        setFull(data.full || false);
      }
    } catch(e) { console.error('Memory load error:', e); }
    setLoading(false);
  }, [localFetch]);

  useEffect(() => { load(); }, [load]);

  const addMemory = async () => {
    const text = newText.trim();
    if (!text) return;
    setAdding(true); setError('');
    try {
      const res  = await localFetch('http://127.0.0.1:5000/api/memory', {
        method:'POST', body:JSON.stringify({ text })
      });
      const data = await res.json();
      if (res.ok) {
        setNewText('');
        await load();
      } else {
        setError(data.error || 'Could not save memory');
      }
    } catch(e) { setError('Connection error'); }
    setAdding(false);
  };

  const deleteMemory = async (id) => {
    setDeleting(p => new Set([...p, id]));
    try {
      await localFetch(`http://127.0.0.1:5000/api/memory/${id}`, { method:'DELETE' });
      setMemories(p => p.filter(m => m.id !== id));
      setCount(p => p - 1);
      setPctUsed(p => Math.max(0, p - Math.round(100 / limit)));
      setFull(false);
    } catch(e) { console.error('Delete error:', e); }
    setDeleting(p => { const n = new Set(p); n.delete(id); return n; });
  };

  const clearAll = async () => {
    setClearing(true);
    try {
      await localFetch('http://127.0.0.1:5000/api/memory/clear', { method:'POST' });
      setMemories([]); setCount(0); setPctUsed(0); setFull(false);
    } catch(e) { console.error('Clear error:', e); }
    setClearing(false); setShowClearConfirm(false);
  };

  const barColor = pctUsed >= 90 ? 'var(--danger)' : pctUsed >= 70 ? 'var(--warn)' : 'var(--accent)';

  return (
    <div>
      {/* Header + capacity bar */}
      <div className="card" style={{ padding:20, marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16, gap:12 }}>
          <div>
            <h3 style={{ fontSize:15,fontWeight:700,color:'var(--text)',display:'flex',alignItems:'center',gap:9,marginBottom:5 }}>
              <div style={{ width:28,height:28,borderRadius:8,background:'var(--accent-bg)',display:'flex',alignItems:'center',justifyContent:'center' }}>
                <Brain size={14} color="var(--accent)"/>
              </div>
              Manage Memory
            </h3>
            <p style={{ fontSize:12.5,color:'var(--text3)',lineHeight:1.6,maxWidth:420 }}>
              TrustGuard AI automatically saves key facts from your conversations and uses them to give
              more relevant, personalised responses. You can edit or clear these at any time.
            </p>
          </div>
          {count > 0 && (
            <button onClick={()=>setShowClearConfirm(true)}
              className="btn btn-ghost" style={{ fontSize:12,padding:'6px 12px',flexShrink:0,color:'var(--danger)',borderColor:'rgba(224,75,58,.25)' }}>
              <Trash size={12}/> Clear all
            </button>
          )}
        </div>

        {/* Capacity bar */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
          <span style={{ fontSize:12,fontWeight:600,color:pctUsed>=90?'var(--danger)':pctUsed>=70?'var(--warn)':'var(--text2)' }}>
            {pctUsed >= 100 ? '🔴 Memory full' : `${pctUsed}% used`}
          </span>
          <span style={{ fontSize:11.5,color:'var(--text3)' }}>{count} / {limit} memories</span>
        </div>
        <div className="memory-bar">
          <div className="memory-bar-fill" style={{ width:`${pctUsed}%`, background:barColor }}/>
        </div>
        {full && (
          <p className="fade-in" style={{ fontSize:12,color:'var(--danger)',marginTop:8,display:'flex',alignItems:'center',gap:5 }}>
            <AlertCircle size={12}/> Memory full — delete some to allow new memories to be saved.
          </p>
        )}
      </div>

      {/* Confirm clear dialog */}
      {showClearConfirm && (
        <div className="fade-in" style={{ padding:'16px 18px',borderRadius:12,background:'var(--danger-bg)',border:'1.5px solid rgba(224,75,58,.25)',marginBottom:14 }}>
          <p style={{ fontSize:13.5,fontWeight:600,color:'var(--text)',marginBottom:12 }}>
            Delete all {count} memories? This cannot be undone.
          </p>
          <div style={{ display:'flex',gap:8 }}>
            <button onClick={clearAll} disabled={clearing}
              className="btn btn-danger" style={{ fontSize:12.5 }}>
              {clearing ? <><div className="spin" style={{ width:11,height:11,border:'1.5px solid rgba(224,75,58,.3)',borderTopColor:'var(--danger)',borderRadius:'50%' }}/> Clearing…</> : 'Yes, delete all'}
            </button>
            <button onClick={()=>setShowClearConfirm(false)} className="btn btn-ghost" style={{ fontSize:12.5 }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Add memory manually */}
      <div className="card" style={{ padding:18, marginBottom:14 }}>
        <label style={{ fontSize:12,fontWeight:700,color:'var(--text2)',textTransform:'uppercase',letterSpacing:'.4px',display:'block',marginBottom:10 }}>
          Add a memory manually
        </label>
        <div className="mem-add-row">
          <input className="mem-add-input" value={newText} placeholder='e.g. "The user prefers Python over JavaScript"'
            onChange={e=>{setNewText(e.target.value);setError('');}}
            onKeyDown={e=>{ if(e.key==='Enter' && !e.shiftKey) { e.preventDefault(); addMemory(); }}}
            disabled={full}/>
          <button onClick={addMemory} disabled={!newText.trim()||adding||full}
            className="btn btn-primary" style={{ fontSize:13,padding:'9px 16px',flexShrink:0 }}>
            {adding ? <div className="spin" style={{ width:13,height:13,border:'2px solid rgba(255,255,255,.35)',borderTopColor:'#fff',borderRadius:'50%' }}/> : <><Brain size={12}/> Save</>}
          </button>
        </div>
        {error && <p className="fade-in" style={{ fontSize:12,color:'var(--danger)',marginTop:5,display:'flex',alignItems:'center',gap:5 }}><AlertCircle size={11}/> {error}</p>}
        <p style={{ fontSize:11.5,color:'var(--text3)',marginTop:6 }}>
          The AI also saves memories automatically during chat. You can edit the text below by deleting and re-adding.
        </p>
      </div>

      {/* Memory list */}
      <div className="card" style={{ padding:18 }}>
        <div style={{ fontSize:13,fontWeight:700,color:'var(--text)',marginBottom:14,display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <span style={{ display:'flex',alignItems:'center',gap:6 }}>
            <Brain size={13} color="var(--accent)"/> Saved memories
          </span>
          {!loading && <span style={{ fontSize:11.5,color:'var(--text3)',fontWeight:400 }}>{count} total</span>}
        </div>

        {loading ? (
          <div style={{ display:'flex',alignItems:'center',gap:9,padding:'12px 0',color:'var(--text3)' }}>
            <div className="spin" style={{ width:13,height:13,border:'2px solid var(--border2)',borderTopColor:'var(--accent)',borderRadius:'50%' }}/>
            <span style={{ fontSize:13 }}>Loading memories…</span>
          </div>
        ) : memories.length === 0 ? (
          <div style={{ textAlign:'center',padding:'28px 0',color:'var(--text3)' }}>
            <Brain size={28} style={{ margin:'0 auto 10px',display:'block',opacity:.2 }}/>
            <p style={{ fontSize:13.5,fontWeight:500,color:'var(--text2)',marginBottom:5 }}>No memories yet</p>
            <p style={{ fontSize:12.5 }}>
              Start chatting and TrustGuard AI will automatically remember things about you across conversations.
            </p>
          </div>
        ) : (
          <div style={{ display:'flex',flexDirection:'column',gap:7 }}>
            {[...memories].reverse().map((mem, i) => (
              <div key={mem.id} className="memory-card fade-in" style={{ animationDelay:`${i*0.04}s` }}>
                <Brain size={13} color="var(--accent)" style={{ flexShrink:0,marginTop:2 }}/>
                <div style={{ flex:1,minWidth:0 }}>
                  <p style={{ fontSize:13.5,color:'var(--text)',lineHeight:1.6,margin:0 }}>{mem.text}</p>
                  {mem.ts_unix > 0 && (
                    <p style={{ fontSize:11,color:'var(--text3)',marginTop:4 }}>
                      {new Date(mem.ts_unix * 1000).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                    </p>
                  )}
                </div>
                <button className="mem-del"
                  onClick={()=>deleteMemory(mem.id)}
                  disabled={deleting.has(mem.id)}
                  title="Delete this memory">
                  {deleting.has(mem.id)
                    ? <div className="spin" style={{ width:11,height:11,border:'1.5px solid rgba(224,75,58,.3)',borderTopColor:'var(--danger)',borderRadius:'50%' }}/>
                    : <X size={13}/>
                  }
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsView({ user, dark, toggleDark, sessionToken }) {
  const [activeTab, setActiveTab] = useState('personalization');

  // ── Local apiFetch that always uses the freshest token ────────────────────
  // SettingsView mounts as a separate component, so we guarantee the token is
  // set by using the prop directly — avoids a race where _sessionToken is still
  // null when the first useEffect fires.
  const localFetch = useCallback((url, opts = {}) => {
    const tok = sessionToken || getSessionToken();
    return fetch(url, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        ...(opts.headers || {}),
        ...(tok ? { 'Authorization': `Bearer ${tok}` } : {}),
      },
    });
  }, [sessionToken]);

  // ── Detection engine settings ──────────────────────────────
  const [cfg,    setCfg]    = useState({ rag:true,urlCheck:true,encryption:true,autoRedact:true,publicFigure:true,piiThreshold:0.4 });
  const [cfgStatus, setCfgStatus] = useState('idle');
  const [cfgLoaded, setCfgLoaded] = useState(false);
  const cfgTimer = useRef(null);

  // ── Personalization prefs ──────────────────────────────────
  const DEFAULT_PREFS = { nickname:'',occupation:'',about:'',style:'balanced',tone:'neutral',warm:false,enthusiastic:false,headersLists:false,emoji:false,customInstructions:'' };
  const [prefs,    setPrefs]    = useState(DEFAULT_PREFS);
  const [prefStatus, setPrefStatus] = useState('idle');
  const [prefLoaded, setPrefLoaded] = useState(false);
  const prefTimer = useRef(null);

  // Load detection settings — runs once, no token needed
  useEffect(() => {
    localFetch('http://127.0.0.1:5000/api/settings')
      .then(r=>r.json()).then(d=>{ if(d.settings) setCfg(d.settings); setCfgLoaded(true); })
      .catch(()=>setCfgLoaded(true));
  }, []);

  // Load personalization prefs — needs token, wait until we have one
  useEffect(() => {
    const tok = sessionToken || getSessionToken();
    if (!tok) {
      console.warn('⚠️ Personalization load skipped — no session token yet');
      setPrefLoaded(true); // still mark loaded so UI doesn't spin forever
      return;
    }
    localFetch('http://127.0.0.1:5000/api/personalization')
      .then(r => {
        if (!r.ok) {
          console.warn('Personalization load failed:', r.status);
          return { prefs: {} };
        }
        return r.json();
      })
      .then(d => {
        if (d.prefs && Object.keys(d.prefs).length > 0) {
          console.log('✅ Personalization loaded:', d.prefs);
          setPrefs(p => ({ ...DEFAULT_PREFS, ...d.prefs }));
        } else {
          console.log('ℹ️  No personalization prefs saved yet — using defaults');
        }
        setPrefLoaded(true);
      })
      .catch(e => { console.error('Personalization load error:', e); setPrefLoaded(true); });
  }, [sessionToken]); // re-runs if token changes (e.g. page reload)

  // Auto-save detection settings
  useEffect(() => {
    if (!cfgLoaded) return;
    clearTimeout(cfgTimer.current);
    cfgTimer.current = setTimeout(() => {
      setCfgStatus('saving');
      localFetch('http://127.0.0.1:5000/api/settings', { method:'POST', body:JSON.stringify(cfg) })
        .then(r=>r.json()).then(()=>{ setCfgStatus('saved'); setTimeout(()=>setCfgStatus('idle'),2500); })
        .catch(()=>{ setCfgStatus('error'); setTimeout(()=>setCfgStatus('idle'),3000); });
    }, 600);
    return () => clearTimeout(cfgTimer.current);
  }, [cfg, cfgLoaded]);

  // Auto-save personalization — guarded: only fires when token exists
  useEffect(() => {
    if (!prefLoaded) return;
    const tok = sessionToken || getSessionToken();
    if (!tok) {
      console.warn('⚠️ Personalization save skipped — no session token');
      return;
    }
    clearTimeout(prefTimer.current);
    prefTimer.current = setTimeout(async () => {
      setPrefStatus('saving');
      try {
        const res = await localFetch('http://127.0.0.1:5000/api/personalization', {
          method: 'POST',
          body: JSON.stringify(prefs),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.error('Personalization save failed:', res.status, err);
          setPrefStatus('error');
          setTimeout(() => setPrefStatus('idle'), 3500);
          return;
        }
        const data = await res.json();
        console.log('✅ Personalization saved:', data.prefs);
        setPrefStatus('saved');
        setTimeout(() => setPrefStatus('idle'), 2500);
      } catch (e) {
        console.error('Personalization save error:', e);
        setPrefStatus('error');
        setTimeout(() => setPrefStatus('idle'), 3000);
      }
    }, 800);
    return () => clearTimeout(prefTimer.current);
  }, [prefs, prefLoaded, sessionToken]);

  // ── Sub-components ─────────────────────────────────────────
  const Toggle = ({ id, label, desc, state, setState }) => {
    const on = state[id];
    return (
      <div className="char-toggle">
        <div style={{ flex:1,paddingRight:20 }}>
          <div style={{ fontSize:14,fontWeight:500,color:'var(--text)' }}>{label}</div>
          {desc && <div style={{ fontSize:12,color:'var(--text3)',marginTop:3 }}>{desc}</div>}
        </div>
        <div className="toggle" onClick={()=>setState(p=>({...p,[id]:!p[id]}))} style={{ background:on?'var(--ok)':'var(--border2)',flexShrink:0 }}>
          <div className="toggle-knob" style={{ left:on?'21px':'3px' }}/>
        </div>
      </div>
    );
  };

  const PillSelect = ({ value, onChange, options }) => (
    <div className="pill-select">
      {options.map(opt => (
        <button key={opt.value} className={`pill-option ${value===opt.value?'selected':''}`}
          onClick={()=>onChange(opt.value)}>
          {opt.label}
        </button>
      ))}
    </div>
  );

  const SaveIndicator = ({ status }) => {
    const map = { saving:['var(--text3)','var(--bg3)','Saving…'], saved:['var(--ok)','var(--ok-bg)','✓ Saved'], error:['var(--danger)','var(--danger-bg)','✗ Error'], idle:['var(--text3)','transparent','Auto-saves'] };
    const [color, bg, label] = map[status] || map.idle;
    return <span className="save-indicator" style={{ color, background:bg }}>{label}</span>;
  };

  const TABS = [
    { id:'personalization', label:'Personalization', icon:User },
    { id:'memory',          label:'Memory',          icon:Brain },
    { id:'appearance',      label:'Appearance',      icon:Moon },
    { id:'engine',          label:'Detection Engine',icon:Settings },
  ];

  return (
    <div className="fade-up" style={{ padding:'28px 32px', maxWidth:780, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <h2 className="serif" style={{ fontSize:26,color:'var(--text)',letterSpacing:'-0.4px' }}>Settings</h2>
        <p style={{ color:'var(--text3)',fontSize:13,marginTop:4 }}>Customize TrustGuard to match how you work</p>
      </div>

      {/* Profile card */}
      <div className="card" style={{ padding:20,marginBottom:18,display:'flex',alignItems:'center',gap:16 }}>
        <div style={{ width:52,height:52,borderRadius:'50%',background:'linear-gradient(135deg,var(--accent),var(--accent2))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:19,fontWeight:700,color:'#fff',flexShrink:0 }}>
          {prefs.nickname ? prefs.nickname.slice(0,2).toUpperCase() : user.avatar}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:16,fontWeight:700,color:'var(--text)' }}>
            {prefs.nickname || user.name}
            {prefs.nickname && <span style={{ fontSize:12,color:'var(--text3)',fontWeight:400,marginLeft:8 }}>({user.name})</span>}
          </div>
          <div style={{ fontSize:12,color:'var(--text3)',marginTop:2 }}>
            {prefs.occupation ? prefs.occupation : user.email||'No email'}
          </div>
          <div style={{ display:'flex',gap:7,marginTop:8 }}>
            <span className="badge badge-accent" style={{ fontSize:11 }}>{user.role}</span>
            <span className="badge badge-info"   style={{ fontSize:11 }}>{user.clearance}</span>
            {prefs.style && prefs.style !== 'balanced' && <span className="badge badge-neutral" style={{ fontSize:11,textTransform:'capitalize' }}>{prefs.style}</span>}
            {prefs.tone  && prefs.tone  !== 'neutral'  && <span className="badge badge-neutral" style={{ fontSize:11,textTransform:'capitalize' }}>{prefs.tone}</span>}
          </div>
        </div>
      </div>

      {/* Tab nav */}
      <div style={{ display:'flex',gap:2,background:'var(--bg2)',borderRadius:11,padding:3,marginBottom:18 }}>
        {TABS.map(({id,label,icon:Icon})=>(
          <button key={id} onClick={()=>setActiveTab(id)}
            style={{ flex:1,padding:'9px 0',borderRadius:9,border:'none',fontSize:13,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6,fontFamily:'Geist,sans-serif',transition:'all .15s',
              background:activeTab===id?'var(--surface)':'transparent',
              color:activeTab===id?'var(--text)':'var(--text3)',
              boxShadow:activeTab===id?'var(--sh)':'none' }}>
            <Icon size={13}/>{label}
          </button>
        ))}
      </div>

      {/* ─── TAB: PERSONALIZATION ─────────────────────────────── */}
      {activeTab==='personalization' && (
        <div className="fade-in">
          {/* About you */}
          <div className="card" style={{ padding:22,marginBottom:14 }}>
            <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:22,gap:16 }}>
              <div style={{ flex:1 }}>
                <h3 style={{ fontSize:15,fontWeight:700,color:'var(--text)',display:'flex',alignItems:'center',gap:9,marginBottom:6 }}>
                  <div style={{ width:28,height:28,borderRadius:8,background:'var(--accent-bg)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                    <User size={14} color="var(--accent)"/>
                  </div>
                  About you
                </h3>
                <p style={{ fontSize:12.5,color:'var(--text3)',lineHeight:1.6,maxWidth:380 }}>
                  Help TrustGuard AI understand who you are. The more context you share, the more tailored every response becomes.
                </p>
              </div>
              <SaveIndicator status={prefStatus}/>
            </div>

            {!prefLoaded ? (
              <div style={{ display:'flex',alignItems:'center',gap:9,color:'var(--text3)',padding:'12px 0' }}>
                <div className="spin" style={{ width:13,height:13,border:'2px solid var(--border2)',borderTopColor:'var(--accent)',borderRadius:'50%' }}/>
                <span style={{ fontSize:13 }}>Loading preferences…</span>
              </div>
            ) : (
              <>
                <div className="pref-section">
                  <label className="pref-label">
                    <span style={{width:6,height:6,borderRadius:'50%',background:'var(--accent)',display:'inline-block'}}/>
                    What should TrustGuard AI call you?
                  </label>
                  <input className="pref-field" placeholder="e.g. Alex, Dr. Kumar, just your first name…" value={prefs.nickname}
                    onChange={e=>setPrefs(p=>({...p,nickname:e.target.value}))}/>
                  <p className="field-hint">The AI will address you by this name to make conversations feel personal</p>
                </div>

                <div className="pref-section">
                  <label className="pref-label">
                    <span style={{width:6,height:6,borderRadius:'50%',background:'var(--accent)',display:'inline-block'}}/>
                    What do you do?
                  </label>
                  <input className="pref-field" placeholder="e.g. Security analyst, Backend developer, Data scientist, Student…" value={prefs.occupation}
                    onChange={e=>setPrefs(p=>({...p,occupation:e.target.value}))}/>
                  <p className="field-hint">Responses will use examples and terminology relevant to your field</p>
                </div>

                <div className="pref-section">
                  <label className="pref-label">
                    <span style={{width:6,height:6,borderRadius:'50%',background:'var(--accent)',display:'inline-block'}}/>
                    Anything else the AI should know about you?
                  </label>
                  <textarea className="pref-field" placeholder="E.g. I'm a beginner with AI — explain things simply. I prefer metric units. I'm based in India. I care a lot about privacy." value={prefs.about}
                    onChange={e=>setPrefs(p=>({...p,about:e.target.value}))}/>
                  <p className="field-hint">Interests, working style, preferences — whatever helps the AI give better answers</p>
                </div>
              </>
            )}
          </div>

          {/* Response style & tone */}
          <div className="card" style={{ padding:22,marginBottom:14 }}>
            <h3 style={{ fontSize:14,fontWeight:700,color:'var(--text)',marginBottom:4,display:'flex',alignItems:'center',gap:7 }}>
              <FileText size={15} color="var(--accent)"/> Base style and tone
            </h3>
            <p style={{ fontSize:12,color:'var(--text3)',marginBottom:18 }}>Set how TrustGuard AI communicates. Doesn't change its knowledge or accuracy.</p>

            <div className="pref-section">
              <label className="pref-label">Response length</label>
              <PillSelect value={prefs.style} onChange={v=>setPrefs(p=>({...p,style:v}))} options={[
                { value:'concise', label:'Concise' },
                { value:'balanced', label:'Balanced' },
                { value:'detailed', label:'Detailed' },
              ]}/>
              <p className="pref-desc">
                {prefs.style==='concise'  ? '⚡ Short and direct — the AI skips preamble and gets straight to the answer.' :
                 prefs.style==='detailed' ? '📖 Thorough and comprehensive — full context, reasoning, and examples included.' :
                                            '⚖️ A balanced mix — complete enough to be useful, concise enough to be readable.'}
              </p>
            </div>

            <div className="pref-section" style={{ marginBottom:0 }}>
              <label className="pref-label">Tone</label>
              <PillSelect value={prefs.tone} onChange={v=>setPrefs(p=>({...p,tone:v}))} options={[
                { value:'formal', label:'Formal' },
                { value:'neutral', label:'Neutral' },
                { value:'casual', label:'Casual' },
              ]}/>
              <p className="pref-desc">
                {prefs.tone==='formal'  ? '🎩 Professional and precise — structured language, no slang, no contractions.' :
                 prefs.tone==='casual'  ? '☕ Relaxed and conversational — like asking a knowledgeable friend.' :
                                          '🤝 Friendly but professional — warm without being too informal.'}
              </p>
            </div>
          </div>

          {/* Characteristics */}
          <div className="card" style={{ padding:22,marginBottom:14 }}>
            <h3 style={{ fontSize:14,fontWeight:700,color:'var(--text)',marginBottom:4,display:'flex',alignItems:'center',gap:7 }}>
              <Sparkles size={15} color="var(--accent)"/> Characteristics
            </h3>
            <p style={{ fontSize:12,color:'var(--text3)',marginBottom:16 }}>Additional traits on top of your base style and tone</p>

            {[
              { id:'warm',         emoji:'🤍', label:'Warm',            desc:'Empathetic and encouraging — the AI acknowledges your feelings and responds with care' },
              { id:'enthusiastic', emoji:'⚡', label:'Enthusiastic',    desc:'Energetic and upbeat — the AI shows genuine excitement and positive energy' },
              { id:'headersLists', emoji:'📋', label:'Headers & Lists', desc:'Well-structured answers — uses section headers and bullet lists to organise longer responses' },
              { id:'emoji',        emoji:'😊', label:'Emoji',           desc:'Light use of relevant emoji to add warmth and personality without being distracting' },
            ].map(({id,emoji,label,desc}) => (
              <div key={id} className="char-toggle">
                <div style={{ display:'flex',alignItems:'center',gap:13,flex:1 }}>
                  <div style={{ width:38,height:38,borderRadius:10,background:prefs[id]?'var(--accent-bg)':'var(--bg3)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all .2s',fontSize:17,border:prefs[id]?'1.5px solid rgba(92,71,224,.25)':'1.5px solid transparent' }}>
                    {emoji}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14,fontWeight:600,color:'var(--text)',marginBottom:2 }}>{label}</div>
                    <div style={{ fontSize:12,color:'var(--text3)',lineHeight:1.5 }}>{desc}</div>
                  </div>
                </div>
                <div className="toggle" onClick={()=>setPrefs(p=>({...p,[id]:!p[id]}))} style={{ background:prefs[id]?'var(--ok)':'var(--border2)',flexShrink:0,marginLeft:12 }}>
                  <div className="toggle-knob" style={{ left:prefs[id]?'21px':'3px' }}/>
                </div>
              </div>
            ))}
          </div>

          {/* Custom instructions */}
          <div className="card" style={{ padding:22,marginBottom:14 }}>
            <h3 style={{ fontSize:14,fontWeight:700,color:'var(--text)',marginBottom:4,display:'flex',alignItems:'center',gap:7 }}>
              <FileText size={15} color="var(--accent)"/> Custom instructions
            </h3>
            <p style={{ fontSize:12,color:'var(--text3)',marginBottom:14,lineHeight:1.6 }}>
              Write anything you want the AI to always follow — language preferences, formatting rules, how to handle uncertainty, anything. The more specific, the better. Applied to every response.
            </p>
            <textarea className="pref-field" style={{ minHeight:130 }}
              placeholder="e.g. Always start with a 1-line summary · Reply in the same language I write in · Use real-world examples · Never make assumptions — ask first · Format code with comments"
              value={prefs.customInstructions} onChange={e=>setPrefs(p=>({...p,customInstructions:e.target.value}))}/>
            <div style={{ display:'flex',justifyContent:'space-between',marginTop:8 }}>
              <div className="pref-desc">Takes effect immediately on the next message you send</div>
              <span style={{ fontSize:11,color:'var(--text3)' }}>{(prefs.customInstructions||'').length} chars</span>
            </div>
          </div>

          {/* Live preview + verify button */}
          {(prefs.nickname||prefs.occupation||prefs.style!=='balanced'||prefs.tone!=='neutral'||prefs.warm||prefs.enthusiastic||prefs.customInstructions) && (
            <ActivePreviewCard prefs={prefs} prefStatus={prefStatus}/>
          )}
        </div>
      )}

      {/* ─── TAB: MEMORY ──────────────────────────────────────── */}
      {activeTab==='memory' && (
        <div className="fade-in">
          <MemoryView sessionToken={sessionToken}/>
        </div>
      )}

      {/* ─── TAB: APPEARANCE ──────────────────────────────────── */}
      {activeTab==='appearance' && (
        <div className="fade-in card" style={{ padding:22 }}>
          <h3 style={{ fontSize:14,fontWeight:700,color:'var(--text)',marginBottom:16 }}>Appearance</h3>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:14,fontWeight:500,color:'var(--text)' }}>Dark mode</div>
              <div style={{ fontSize:12,color:'var(--text3)',marginTop:3 }}>Switch between light and dark interface</div>
            </div>
            <div className="toggle" onClick={toggleDark} style={{ background:dark?'var(--ok)':'var(--border2)',marginLeft:20 }}>
              <div className="toggle-knob" style={{ left:dark?'21px':'3px' }}/>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB: DETECTION ENGINE ────────────────────────────── */}
      {activeTab==='engine' && (
        <div className="fade-in card" style={{ padding:22 }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4 }}>
            <h3 style={{ fontSize:14,fontWeight:700,color:'var(--text)' }}>Detection Engine</h3>
            <SaveIndicator status={cfgStatus}/>
          </div>
          <p style={{ fontSize:12,color:'var(--text3)',marginBottom:16 }}>Changes apply immediately to the running backend</p>
          {!cfgLoaded ? (
            <div style={{ padding:'16px 0',display:'flex',alignItems:'center',gap:9,color:'var(--text3)' }}>
              <div className="spin" style={{ width:14,height:14,border:'2px solid var(--border2)',borderTopColor:'var(--accent)',borderRadius:'50%' }}/>
              <span style={{ fontSize:13 }}>Loading settings…</span>
            </div>
          ) : (
            <>
              {[
                {id:'rag',label:'RAG Fact-Checking',desc:'Cross-reference responses against Wikipedia, ArXiv & Google'},
                {id:'urlCheck',label:'URL Validation',desc:'Validate links via HTTP HEAD requests'},
                {id:'encryption',label:'Encryption at Rest',desc:'Fernet symmetric encryption for Firestore data'},
                {id:'autoRedact',label:'Auto-Redaction',desc:'Automatically redact HIGH-risk private PII'},
                {id:'publicFigure',label:'Public Figure Exception',desc:'Skip redaction for known public figures'},
              ].map(t=><Toggle key={t.id} id={t.id} label={t.label} desc={t.desc} state={cfg} setState={setCfg}/>)}

              <div style={{ paddingTop:16 }}>
                <div style={{ display:'flex',justifyContent:'space-between',marginBottom:4 }}>
                  <div style={{ fontSize:14,fontWeight:500,color:'var(--text)' }}>PII Detection Threshold</div>
                  <span style={{ fontSize:12.5,fontWeight:700,color:'var(--accent)' }}>{cfg.piiThreshold} — {cfg.piiThreshold<=0.3?'Permissive':cfg.piiThreshold<=0.55?'Balanced':'Strict'}</span>
                </div>
                <input type="range" min={0.1} max={0.9} step={0.05} value={cfg.piiThreshold}
                  onChange={e=>setCfg(p=>({...p,piiThreshold:parseFloat(e.target.value)}))}
                  style={{ width:'100%',accentColor:'var(--accent)' }}/>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}