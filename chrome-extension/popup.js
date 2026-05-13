const API       = "https://pryoport-backend.onrender.com";
const DASHBOARD = "https://pryoport-frontend.vercel.app"; // ← your actual Vercel URL

// ── ELEMENTS ───────────────────────────────────────────
const statusBox       = document.getElementById("status");
const loginBtn        = document.getElementById("login");
const syncBtn         = document.getElementById("syncBtn");
const syncLabel       = document.getElementById("syncLabel");
const savePriorityBtn = document.getElementById("savePriority");
const emailInput      = document.getElementById("emailInput");
const prioritySelect  = document.getElementById("prioritySelect");
const urgentBadge     = document.getElementById("urgentBadge");
const urgentCount     = document.getElementById("urgentCount");
const clearBtn        = document.getElementById("clearBtn");

const listHigh      = document.getElementById("list-high");
const listMedium    = document.getElementById("list-medium");
const sectionHigh   = document.getElementById("section-high");
const sectionMedium = document.getElementById("section-medium");
const emptyState    = document.getElementById("emptyState");

// ── ON LOAD ────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  checkLoginStatus();
  loadNotifications();
});

// ── LOGIN STATUS ───────────────────────────────────────
async function checkLoginStatus() {
  try {
    const res  = await fetch(`${API}/auth-status`, { credentials: "include" });
    const data = await res.json();

    if (data.logged_in) {
      statusBox.innerText = "🟢 Gmail Connected";
      loginBtn.innerText  = "Connected";
      loginBtn.disabled   = true;
    } else {
      statusBox.innerText = "🔴 Not Connected";
      loginBtn.disabled   = false;
    }
  } catch {
    statusBox.innerText = "❌ Backend Offline";
  }
}

// ── LOGIN — opens OAuth tab then polls until logged in ─
loginBtn.addEventListener("click", () => {
  // Open Google OAuth in a new tab
  chrome.tabs.create({ url: `${API}/auth/google` });

  statusBox.innerText = "⏳ Waiting for Google login...";
  loginBtn.disabled   = true;

  // Poll /auth-status every 2s until logged in
  const poll = setInterval(async () => {
    try {
      const res  = await fetch(`${API}/auth-status`, { credentials: "include" });
      const data = await res.json();

      if (data.logged_in) {
        clearInterval(poll);
        statusBox.innerText = `🟢 Gmail Connected`;
        loginBtn.innerText  = "Connected";
        loginBtn.disabled   = true;
        await loadNotifications();
      }
    } catch {
      // backend still waking up — keep polling silently
    }
  }, 2000);

  // Stop polling after 3 minutes regardless
  setTimeout(() => {
    clearInterval(poll);
    if (loginBtn.disabled && statusBox.innerText.includes("Waiting")) {
      statusBox.innerText = "⚠️ Login timed out. Try again.";
      loginBtn.disabled   = false;
      loginBtn.innerText  = "Login with Google";
    }
  }, 180000);
});

// ── SYNC ───────────────────────────────────────────────
syncBtn.addEventListener("click", async () => {
  try {
    syncBtn.disabled    = true;
    syncLabel.innerText = "⏳ Syncing...";
    statusBox.innerText = "⏳ Fetching emails...";

    const res  = await fetch(`${API}/sync`, {
      method: "POST",
      credentials: "include"
    });
    const data = await res.json();

    if (!data.success) {
      statusBox.innerText = `⚠️ ${data.message}`;
      return;
    }

    const count = data.emails?.length || 0;
    statusBox.innerText = `✅ Synced ${count} email${count !== 1 ? "s" : ""}`;

    await loadNotifications();

  } catch {
    statusBox.innerText = "❌ Sync Failed. Is backend running?";
  } finally {
    syncBtn.disabled    = false;
    syncLabel.innerText = "🔄 Sync Inbox";
  }
});

// ── SAVE MANUAL PRIORITY ───────────────────────────────
savePriorityBtn.addEventListener("click", async () => {
  const email    = emailInput.value.trim();
  const priority = prioritySelect.value;

  if (!email) { statusBox.innerText = "⚠️ Enter an email address"; return; }

  try {
    await fetch(`${API}/set-priority`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, priority })
    });
    statusBox.innerText = `✅ ${email} → ${priority.toUpperCase()}`;
    emailInput.value = "";
  } catch {
    statusBox.innerText = "❌ Save Failed";
  }
});

// ── CLEAR ALL ──────────────────────────────────────────
clearBtn.addEventListener("click", async () => {
  await chrome.storage.local.remove("shownIds");
  listHigh.innerHTML   = "";
  listMedium.innerHTML = "";
  sectionHigh.classList.add("hidden");
  sectionMedium.classList.add("hidden");
  emptyState.classList.remove("hidden");
  urgentBadge.classList.add("hidden");
  statusBox.innerText = "🗑️ Cleared";
});

// ── LOAD & RENDER NOTIFICATIONS ────────────────────────
async function loadNotifications() {
  try {
    const res  = await fetch(`${API}/notifications`, { credentials: "include" });
    const data = await res.json();
    const list = data.notifications || [];

    const high   = list.filter(n => n.priority === "high");
    const medium = list.filter(n => n.priority === "medium");

    listHigh.innerHTML   = "";
    listMedium.innerHTML = "";

    const hasAny = high.length > 0 || medium.length > 0;

    emptyState.classList.toggle("hidden",    hasAny);
    sectionHigh.classList.toggle("hidden",   high.length === 0);
    sectionMedium.classList.toggle("hidden", medium.length === 0);

    high.forEach(n   => listHigh.appendChild(makeCard(n, "high")));
    medium.forEach(n => listMedium.appendChild(makeCard(n, "medium")));

    if (high.length > 0) {
      urgentBadge.classList.remove("hidden");
      urgentCount.innerText = high.length;
    } else {
      urgentBadge.classList.add("hidden");
    }

    chrome.action.setBadgeText({ text: high.length > 0 ? String(high.length) : "" });
    chrome.action.setBadgeBackgroundColor({ color: "#ef4444" });

  } catch {
    emptyState.classList.remove("hidden");
  }
}

// ── MAKE CARD ──────────────────────────────────────────
function makeCard(item, priority) {
  const div = document.createElement("div");
  div.className = `notif-item ${priority}`;

  const score   = item.urgency_score ?? item.score ?? 0;
  const subject = item.subject || "No Subject";
  const summary = item.summary || "";

  div.innerHTML = `
    <div class="notif-top">
      <span class="notif-subject" title="${subject}">${subject}</span>
      <span class="score-chip ${priority}">${score}</span>
    </div>
    ${summary ? `<div class="notif-summary">${summary}</div>` : ""}
    <div class="score-bar-wrap">
      <div class="score-bar ${priority}" style="width:${score}%"></div>
    </div>
  `;

  div.style.cursor = "pointer";

  // ✅ FIXED: opens production dashboard, not localhost
  div.addEventListener("click", () => {
    chrome.tabs.create({
      url: `${DASHBOARD}/?id=${encodeURIComponent(item.gmail_id)}`
    });
  });

  return div;
}