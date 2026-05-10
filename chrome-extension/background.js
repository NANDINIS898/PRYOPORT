const API_BASE = "http://127.0.0.1:8000";
const DASHBOARD = "http://localhost:5173";

async function syncEmails() {
  try {
    await fetch(`${API_BASE}/sync`, { method: "POST", credentials: "include" });
  } catch (err) { console.log("Sync failed:", err); }
}

async function checkNotifications() {
  try {
    const res   = await fetch(`${API_BASE}/notifications`, { credentials: "include" });
    const data  = await res.json();
    const mails = data.notifications || [];

    const high   = mails.filter(m => m.priority === "high");
    const medium = mails.filter(m => m.priority === "medium");

    // Badge = high count only
    chrome.action.setBadgeText({ text: high.length > 0 ? String(high.length) : "" });
    chrome.action.setBadgeBackgroundColor({ color: "#ef4444" });

    const stored   = await chrome.storage.local.get("shownIds");
    const shownIds = new Set(stored.shownIds || []);

    const newHigh   = high.filter(m   => !shownIds.has(m.gmail_id || makeId(m)));
    const newMedium = medium.filter(m => !shownIds.has(m.gmail_id || makeId(m)));

    // Group summary if 2+ new urgent
    if (newHigh.length >= 2) {
      const preview = newHigh.slice(0, 3).map(m => `• ${trunc(m.subject, 42)}`).join("\n");
      chrome.notifications.create("urgent-group", {
        type:   "basic", iconUrl: "icon.png",
        title:  `⚡ ${newHigh.length} Urgent Emails`,
        message: preview + (newHigh.length > 3 ? `\n+${newHigh.length - 3} more` : ""),
        priority: 2, requireInteraction: true
      });
      // store group key so clicking opens dashboard root
      await chrome.storage.local.set({ lastGroupIds: newHigh.map(m => m.gmail_id) });

    } else if (newHigh.length === 1) {
      const m  = newHigh[0];
      const id = m.gmail_id || makeId(m);
      chrome.notifications.create(id, {
        type: "basic", iconUrl: "icon.png",
        title: "⚡ " + trunc(m.subject, 52),
        message: m.summary || m.subject,
        priority: 2, requireInteraction: true
      });
    }

    for (const m of newMedium) {
      const id = m.gmail_id || makeId(m);
      chrome.notifications.create(id, {
        type: "basic", iconUrl: "icon.png",
        title: "📩 " + trunc(m.subject, 55),
        message: m.summary || m.subject,
        priority: 0
      });
    }

    // persist shown IDs
    const allNew = [...newHigh, ...newMedium];
    for (const m of allNew) shownIds.add(m.gmail_id || makeId(m));
    await chrome.storage.local.set({ shownIds: [...shownIds].slice(-300) });

  } catch (err) { console.log("Notification error:", err); }
}

// ── Notification click → open dashboard ────────────
chrome.notifications.onClicked.addListener(async (notifId) => {
  chrome.notifications.clear(notifId);

  if (notifId === "urgent-group") {
    // Open dashboard, highlight first urgent
    const stored = await chrome.storage.local.get("lastGroupIds");
    const ids    = stored.lastGroupIds || [];
    const url    = ids.length > 0
      ? `${DASHBOARD}?id=${encodeURIComponent(ids[0])}`
      : DASHBOARD;
    chrome.tabs.create({ url });
  } else {
    // notifId is the gmail_id — open dashboard focused on that email
    chrome.tabs.create({ url: `${DASHBOARD}?id=${encodeURIComponent(notifId)}` });
  }
});

function makeId(m) { return `${m.subject}_${m.timestamp}`; }
function trunc(s, n) { return s && s.length > n ? s.slice(0, n) + "…" : (s || ""); }

async function runPipeline() {
  await syncEmails();
  await checkNotifications();
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("emailPipeline", { periodInMinutes: 10 });
  runPipeline();
});

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === "emailPipeline") runPipeline();
});

runPipeline();