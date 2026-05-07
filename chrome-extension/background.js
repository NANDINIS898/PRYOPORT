const API_BASE = "http://127.0.0.1:8000";

// ── SYNC EMAILS ────────────────────────────────────────
async function syncEmails() {
  try {
    const res  = await fetch(`${API_BASE}/sync`, {
      method: "POST",
      credentials: "include"
    });
    const data = await res.json();
    console.log("✅ Sync:", data.message || data);
  } catch (err) {
    console.log("❌ Sync failed:", err);
  }
}

// ── FETCH & SHOW NOTIFICATIONS ─────────────────────────
async function checkNotifications() {
  try {
    const res  = await fetch(`${API_BASE}/notifications`, { credentials: "include" });
    const data = await res.json();
    const mails = data.notifications || [];

    const high   = mails.filter(m => m.priority === "high");
    const medium = mails.filter(m => m.priority === "medium");

    // ── BADGE: show count of HIGH only ─────────────────
    chrome.action.setBadgeText({
      text: high.length > 0 ? String(high.length) : ""
    });
    chrome.action.setBadgeBackgroundColor({ color: "#ef4444" });

    // ── DEDUPLICATION via chrome.storage ───────────────
    const stored   = await chrome.storage.local.get("shownIds");
    const shownIds = new Set(stored.shownIds || []);

    // ── FIND NEW ITEMS ─────────────────────────────────
    const newHigh   = high.filter(m   => !shownIds.has(makeId(m)));
    const newMedium = medium.filter(m => !shownIds.has(makeId(m)));

    // ── DESKTOP NOTIFICATION STRATEGY ─────────────────
    // If 2+ new HIGH → fire ONE grouped summary popup
    // If exactly 1 new HIGH → fire individual popup
    // Medium → individual popup (no sound/interrupt)

    if (newHigh.length >= 2) {
      // Grouped urgent summary
      const titles = newHigh.slice(0, 3).map(m => `• ${truncate(m.subject, 45)}`).join("\n");
      const extra  = newHigh.length > 3 ? `\n+${newHigh.length - 3} more` : "";

      chrome.notifications.create("urgent-summary", {
        type:              "basic",
        iconUrl:           "icon.png",
        title:             `⚡ ${newHigh.length} Urgent Emails`,
        message:           titles + extra,
        priority:          2,
        requireInteraction: true
      });

    } else if (newHigh.length === 1) {
      const m  = newHigh[0];
      const id = makeId(m);
      chrome.notifications.create(id, {
        type:              "basic",
        iconUrl:           "icon.png",
        title:             "⚡ Urgent — " + truncate(m.subject, 50),
        message:           m.summary || m.subject,
        priority:          2,
        requireInteraction: true
      });
    }

    // Medium: individual quiet notifications
    for (const m of newMedium) {
      const id = makeId(m);
      chrome.notifications.create(id, {
        type:     "basic",
        iconUrl:  "icon.png",
        title:    "📩 " + truncate(m.subject, 55),
        message:  m.summary || m.subject,
        priority: 0
      });
    }

    // ── PERSIST SHOWN IDs ──────────────────────────────
    const allNew = [...newHigh, ...newMedium];
    for (const m of allNew) shownIds.add(makeId(m));

    const trimmed = [...shownIds].slice(-300);
    await chrome.storage.local.set({ shownIds: trimmed });

  } catch (err) {
    console.log("❌ Notification check error:", err);
  }
}

// ── HELPERS ────────────────────────────────────────────
function makeId(mail) {
  return `${mail.subject}_${mail.timestamp}`;
}

function truncate(str, max) {
  if (!str) return "";
  return str.length > max ? str.slice(0, max) + "…" : str;
}

// ── MAIN PIPELINE ──────────────────────────────────────
async function runPipeline() {
  await syncEmails();
  await checkNotifications();
}

// ── ALARMS (reliable in MV3 service workers) ───────────
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("emailPipeline", { periodInMinutes: 10 });
  runPipeline();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "emailPipeline") runPipeline();
});

// Run on service worker startup
runPipeline();

// ── NOTIFICATION CLICK → open Gmail ───────────────────
chrome.notifications.onClicked.addListener(() => {
  chrome.tabs.create({ url: "https://mail.google.com" });
});