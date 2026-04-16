// TrustGuard Extension — Popup Logic v2.3
// This file exists because Chrome MV3 blocks inline scripts (CSP).

const API = "https://trustguard-phase2.onrender.com";
const APP = "https://trust-guard-phase2.vercel.app";

// ── Toast helper ──────────────────────────────────────────────
function showToast(msg, type) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = "toast " + type;
  t.style.display = "flex";
  setTimeout(function() { t.style.display = "none"; }, 4000);
}

// ── Update the account card UI ────────────────────────────────
function setCardLoading() {
  const card   = document.getElementById("acct-card");
  const avatar = document.getElementById("acct-avatar");
  const name   = document.getElementById("acct-name");
  const sub    = document.getElementById("acct-sub");
  card.className = "account-card";
  avatar.className = "acct-avatar anon";
  avatar.textContent = "⏳";
  name.textContent = "Verifying…";
  sub.textContent = "";
}

function setCardAnon() {
  const card   = document.getElementById("acct-card");
  const avatar = document.getElementById("acct-avatar");
  const name   = document.getElementById("acct-name");
  const sub    = document.getElementById("acct-sub");
  card.className = "account-card";
  avatar.className = "acct-avatar anon";
  avatar.textContent = "👤";
  name.textContent = "Not linked";
  sub.innerHTML = '<span class="acct-sub">Scans run as anonymous</span>';
}

function setCardLinked(data) {
  const card   = document.getElementById("acct-card");
  const avatar = document.getElementById("acct-avatar");
  const name   = document.getElementById("acct-name");
  const sub    = document.getElementById("acct-sub");
  const initials = ((data.name || data.email || "?")).slice(0, 2).toUpperCase();
  card.className = "account-card linked";
  avatar.className = "acct-avatar";
  avatar.textContent = initials;
  name.textContent = data.name || data.email;
  sub.innerHTML = '<span class="acct-ok">✓ Linked</span> · ' + (data.role || "User");
}

function setCardError(msg) {
  const card   = document.getElementById("acct-card");
  const avatar = document.getElementById("acct-avatar");
  const name   = document.getElementById("acct-name");
  const sub    = document.getElementById("acct-sub");
  card.className = "account-card error";
  avatar.className = "acct-avatar anon";
  avatar.textContent = "✗";
  name.textContent = "Token invalid";
  sub.innerHTML = '<span class="acct-err">' + msg + '</span>';
}

function setCardOffline() {
  const card   = document.getElementById("acct-card");
  const avatar = document.getElementById("acct-avatar");
  const name   = document.getElementById("acct-name");
  const sub    = document.getElementById("acct-sub");
  card.className = "account-card error";
  avatar.className = "acct-avatar anon";
  avatar.textContent = "⚠️";
  name.textContent = "Backend offline";
  sub.innerHTML = '<span class="acct-err">Could not reach Render backend</span>';
}

// ── Verify token with backend ─────────────────────────────────
async function verifyAndDisplayToken(token) {
  if (!token) {
    setCardAnon();
    return false;
  }
  setCardLoading();
  try {
    const res = await fetch(API + "/api/auth/token-verify", {
      headers: { "Authorization": "Bearer " + token }
    });
    if (res.ok) {
      const data = await res.json();
      setCardLinked(data);
      return true;
    } else {
      const err = await res.json().catch(function() { return {}; });
      setCardError(err.error || "Not found — log into TrustGuard first");
      return false;
    }
  } catch (e) {
    setCardOffline();
    return false;
  }
}

// ── On popup open ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", function() {
  chrome.storage.local.get(["tg_token"], function(result) {
    var saved = result.tg_token || "";
    if (saved) {
      document.getElementById("token-input").value = saved;
      verifyAndDisplayToken(saved);
    } else {
      setCardAnon();
    }
  });
});

// ── Save / Link button ────────────────────────────────────────
document.getElementById("save-btn").addEventListener("click", function() {
  var token = document.getElementById("token-input").value.trim();
  var btn   = document.getElementById("save-btn");

  if (!token) {
    showToast("⚠ Paste a token first", "err");
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<div class="spin"></div>';

  chrome.storage.local.set({ tg_token: token }, async function() {
    var linked = await verifyAndDisplayToken(token);
    var card   = document.getElementById("acct-card");
    if (linked) {
      showToast("✓ Account linked — scans attributed to your account", "ok");
    } else {
      showToast("Token saved but could not verify — check backend", "err");
    }
    btn.disabled = false;
    btn.textContent = "Link";
  });
});

// ── Open TrustGuard ───────────────────────────────────────────
document.getElementById("open-btn").addEventListener("click", function() {
  chrome.tabs.create({ url: APP });
});