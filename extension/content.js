/**
 * TrustGuard AI Verifier — Content Script v2.2
 *
 * What's fixed vs v2.0/v2.1:
 * - PII detection uses REAL regex (not just @ + dot)
 * - Token is read from chrome.storage.local (set by popup), NOT localStorage
 * - Token is sent correctly on every fetch
 * - Selector fallback chain for ChatGPT / Gemini / Claude
 */

console.log("🛡️ TrustGuard v2.4 loaded on:", window.location.hostname);

// ─── CONFIG ──────────────────────────────────────────────────
// ✅ Correct URLs matching the actual deployed services
const API_BASE       = "https://trustguard-phase2.onrender.com";
const TRUSTGUARD_URL = "https://trust-guard-phase2.vercel.app";
const VERIFY_URL     = `${API_BASE}/verify`;
const SCAN_URL       = `${API_BASE}/scan`;

// ─── TOKEN — read from chrome.storage (set by popup) ─────────
// We keep it in a module-level variable so every fetch can use it
let SESSION_TOKEN = null;

// Load token immediately when content script starts
chrome.storage.local.get(["tg_token"], (result) => {
  if (result.tg_token) {
    SESSION_TOKEN = result.tg_token;
    console.log("🛡️ Token loaded from storage:", SESSION_TOKEN.slice(0, 8) + "…");
  } else {
    console.log("🛡️ No token in storage — scans will run as anonymous");
  }
});

// Listen for token updates sent from the popup
chrome.storage.onChanged.addListener((changes) => {
  if (changes.tg_token) {
    SESSION_TOKEN = changes.tg_token.newValue || null;
    console.log("🛡️ Token updated:", SESSION_TOKEN ? SESSION_TOKEN.slice(0, 8) + "…" : "cleared");
    setBadge("safe", "Token updated ✓");
  }
});

function authHeaders() {
  const h = { "Content-Type": "application/json" };
  if (SESSION_TOKEN) h["Authorization"] = `Bearer ${SESSION_TOKEN}`;
  return h;
}

// ─── SITE DETECTION ──────────────────────────────────────────
const HOST = window.location.hostname;
const SITE =
  HOST.includes("chatgpt.com") || HOST.includes("chat.openai.com") ? "chatgpt" :
  HOST.includes("gemini.google.com")                                ? "gemini"  :
  HOST.includes("claude.ai")                                        ? "claude"  : "unknown";

console.log("🛡️ Site:", SITE);

// ─── SELECTORS ────────────────────────────────────────────────
// Multiple fallbacks per site so one breaking doesn't kill everything
const BOT_SELECTORS = {
  chatgpt: [
    '[data-message-author-role="assistant"]',
    '.agent-turn',
    '[class*="ConversationItem"][class*="assistant"]',
  ],
  gemini: [
    "model-response",
    ".model-response-text",
    "message-content[data-role='model']",
    '[class*="ModelResponse"]',
  ],
  claude: [
    '[data-testid="message-content"]',
    '.font-claude-message',
    '[class*="AssistantMessage"]',
  ],
  unknown: [
    '[class*="assistant-message"]',
    '[class*="bot-message"]',
    '[class*="ai-message"]',
    '[data-role="assistant"]',
  ],
};

const TEXT_SELECTORS = {
  chatgpt: [".markdown", ".prose", "[class*='prose']", "[class*='markdown']"],
  gemini:  [".markdown", ".response-text", "p"],
  claude:  [".prose", "[class*='prose']", "p"],
  unknown: [".markdown", ".prose", "p"],
};

const USER_SELECTORS = {
  chatgpt: ['[data-message-author-role="user"]'],
  gemini:  [".user-query", ".user-message", '[data-role="user"]'],
  claude:  ['[data-testid="human-turn-text"]', '[class*="HumanMessage"]'],
  unknown: ['[class*="user-message"]', '[data-role="user"]'],
};

function findBotContainers() {
  const selectors = BOT_SELECTORS[SITE] || BOT_SELECTORS.unknown;
  for (const sel of selectors) {
    try {
      const found = Array.from(document.querySelectorAll(sel));
      if (found.length > 0) return found;
    } catch (_) {}
  }
  return [];
}

function extractText(container) {
  const selectors = TEXT_SELECTORS[SITE] || TEXT_SELECTORS.unknown;
  for (const sel of selectors) {
    try {
      const el = container.querySelector(sel);
      if (el && el.innerText.trim().length > 10) return el.innerText.trim();
    } catch (_) {}
  }
  return container.innerText.trim();
}

function getPreviousUserMessage(botContainer) {
  const userSels = USER_SELECTORS[SITE] || USER_SELECTORS.unknown;
  // Walk backwards through siblings
  let el = botContainer;
  for (let i = 0; i < 15; i++) {
    el = el.previousElementSibling;
    if (!el) break;
    for (const sel of userSels) {
      try {
        if (el.matches(sel)) return el.innerText.trim().slice(0, 500);
        const inner = el.querySelector(sel);
        if (inner) return inner.innerText.trim().slice(0, 500);
      } catch (_) {}
    }
    if (el.dataset?.messageAuthorRole === "user") return el.innerText.trim().slice(0, 500);
  }
  // Fallback: check parent's children
  try {
    const siblings = Array.from(botContainer.parentElement?.children || []);
    const idx = siblings.indexOf(botContainer);
    for (let i = idx - 1; i >= 0; i--) {
      const sib = siblings[i];
      if (sib.dataset?.messageAuthorRole === "user" ||
          sib.className?.toString().includes("user")) {
        return sib.innerText.trim().slice(0, 500);
      }
    }
  } catch (_) {}
  return "";
}

// ─── STATUS BADGE ─────────────────────────────────────────────
const badge = document.createElement("div");
badge.id = "tg-badge";
badge.innerHTML = `<span class="tg-dot"></span><span class="tg-label">TrustGuard Active</span>`;
document.body.appendChild(badge);

let badgeTimer = null;
function setBadge(state, text) {
  clearTimeout(badgeTimer);
  badge.className = state;
  badge.querySelector(".tg-label").textContent = text;
  if (state !== "") {
    badgeTimer = setTimeout(() => {
      badge.className = "";
      badge.querySelector(".tg-label").textContent = SESSION_TOKEN
        ? "TrustGuard Active ✓"
        : "TrustGuard Active";
    }, 5000);
  }
}

badge.addEventListener("click", () => window.open(TRUSTGUARD_URL, "_blank", "noopener"));

// ─── VERIFY BUTTON ────────────────────────────────────────────
function createVerifyButton(container) {
  const btn = document.createElement("button");
  btn.className = "tg-verify-btn";
  btn.setAttribute("data-tg", "verify");
  btn.innerHTML = `🛡️ <span>Verify</span>`;

  let deepLink = null;

  btn.addEventListener("click", async (e) => {
    e.stopPropagation();
    e.preventDefault();

    // Re-open result if already verified
    if (deepLink && !btn.classList.contains("loading")) {
      window.open(deepLink, "_blank", "noopener");
      return;
    }
    if (btn.classList.contains("loading")) return;

    btn.classList.add("loading");
    btn.innerHTML = `<div class="tg-spin"></div><span>Verifying…</span>`;
    setBadge("scanning", "⏳ Analysing response…");

    const text     = extractText(container);
    const query    = getPreviousUserMessage(container);

    if (!text || text.length < 10) {
      btn.classList.remove("loading");
      btn.innerHTML = `🛡️ <span>Verify</span>`;
      setBadge("risk", "⚠️ Could not read response text");
      return;
    }

    console.log("🛡️ Verifying:", text.slice(0, 80));
    console.log("🛡️ User query:", query.slice(0, 80));

    try {
      const res = await fetch(VERIFY_URL, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          text,
          user_query: query,
          source_url: window.location.href,
          source: SITE === "chatgpt" ? "ChatGPT"
                : SITE === "gemini"  ? "Gemini"
                : SITE === "claude"  ? "Claude" : "AI Tool",
        }),
      });

      if (!res.ok) throw new Error(`Backend ${res.status}`);
      const data = await res.json();

      const halluc = data.analysis?.hallucination_info?.detected;
      const pii    = data.analysis?.pii_info?.detected;
      deepLink     = `${TRUSTGUARD_URL}/?verify=${data.verify_id}`;

      btn.classList.remove("loading");
      if (halluc) {
        btn.className = "tg-verify-btn tg-warn";
        btn.innerHTML = `⚠️ <span>Hallucination — View report</span>`;
        setBadge("risk", "⚠️ Hallucination detected");
      } else if (pii) {
        btn.className = "tg-verify-btn tg-pii";
        btn.innerHTML = `🔒 <span>PII found — View report</span>`;
        setBadge("pii", "🔒 Private info found");
      } else {
        btn.className = "tg-verify-btn tg-safe";
        btn.innerHTML = `✅ <span>Verified safe — View report</span>`;
        setBadge("safe", "✅ Response verified");
      }

      window.open(deepLink, "_blank", "noopener");

    } catch (err) {
      console.error("🛡️ Verify error:", err);
      btn.classList.remove("loading");
      btn.className = "tg-verify-btn tg-error";
      btn.innerHTML = `❌ <span>Error — retry</span>`;
      setBadge("risk", `❌ ${err.message}`);
      setTimeout(() => {
        btn.className = "tg-verify-btn";
        btn.innerHTML = `🛡️ <span>Verify</span>`;
      }, 5000);
    }
  });

  return btn;
}

// ─── INJECT BUTTONS ───────────────────────────────────────────
const injected = new WeakSet();

function injectButtons() {
  const containers = findBotContainers();
  if (containers.length === 0) {
    console.log("🛡️ No bot containers found yet (will retry on DOM changes)");
    return;
  }
  console.log("🛡️ Found", containers.length, "bot container(s)");

  containers.forEach((container) => {
    if (injected.has(container)) return;
    const text = extractText(container);
    if (!text || text.length < 15) return; // skip loading/empty states

    injected.add(container);

    const row = document.createElement("div");
    row.className = "tg-btn-row";
    row.setAttribute("data-tg-injected", "1");
    row.appendChild(createVerifyButton(container));
    container.appendChild(row);

    console.log("🛡️ Button injected for:", text.slice(0, 60) + "…");
  });
}

// Watch for new messages (streaming responses finish, new turns appear)
let debounce = null;
const observer = new MutationObserver(() => {
  clearTimeout(debounce);
  debounce = setTimeout(injectButtons, 1500); // wait for streaming to finish
});
observer.observe(document.body, { childList: true, subtree: true });

// Initial scan attempts
injectButtons();
setTimeout(injectButtons, 2000);
setTimeout(injectButtons, 5000);

// ─── INPUT PII SCANNER ────────────────────────────────────────
// Proper regexes — not just @ + dot
const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/;
const PHONE_RE = /(\+91[\s\-]?)?[6-9]\d{9}|(\+\d{1,3}[\s\-]?)?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4}/;
const CARD_RE  = /\b(?:\d[ \-]?){13,16}\b/;
const SSN_RE   = /\b\d{3}[- ]\d{2}[- ]\d{4}\b/;

function hasPII(text) {
  return EMAIL_RE.test(text) || PHONE_RE.test(text) ||
         CARD_RE.test(text)  || SSN_RE.test(text);
}

function getActiveInputText() {
  // Try known input selectors first
  const selectors = [
    "#prompt-textarea",                 // ChatGPT
    "rich-textarea [contenteditable]",  // Gemini
    ".ProseMirror",                     // Claude / many
    "[data-testid='prompt-textarea']",
    "[contenteditable='true']",
    "textarea",
  ];
  for (const sel of selectors) {
    try {
      const el = document.querySelector(sel);
      if (el && document.activeElement === el) return el.value || el.innerText || "";
    } catch (_) {}
  }
  const active = document.activeElement;
  if (active && (active.isContentEditable || active.tagName === "TEXTAREA")) {
    return active.value || active.innerText || "";
  }
  return "";
}

let scanTimer = null;
let lastPiiState = false;

document.addEventListener("input", () => {
  const text   = getActiveInputText();
  const active = document.activeElement;
  const isPii  = hasPII(text);

  if (isPii !== lastPiiState) {
    lastPiiState = isPii;
    if (isPii) {
      try { if (active) active.style.outline = "2px solid #e04b3a"; } catch (_) {}
      setBadge("pii", "🔒 Sensitive data detected in input");
    } else {
      try { if (active) active.style.outline = ""; } catch (_) {}
      setBadge("safe", "✅ Input cleared");
    }
  }

  clearTimeout(scanTimer);
  scanTimer = setTimeout(async () => {
    if (!text.trim() || text.trim().length < 4) return;
    try {
      const res  = await fetch(SCAN_URL, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          text,
          source_url: window.location.href,
          local_pii_detected: isPii,
        }),
      });
      const data = await res.json();
      if (data.pii_detected && !isPii) {
        // Backend found PII that local regex missed
        setBadge("pii", "🔒 Backend: sensitive data detected");
        try { if (active) active.style.outline = "2px solid #e04b3a"; } catch (_) {}
      }
    } catch (_) {} // silent — input scanning is best-effort
  }, 1200);
}, true);

console.log("🛡️ TrustGuard ready. Site:", SITE, "| Token:", SESSION_TOKEN ? "loaded" : "none");