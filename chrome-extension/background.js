const API_BASE = "http://127.0.0.1:8000";
const API = `${API_BASE}/notifications`;

/* ==================================
   Prevent duplicate notifications
================================== */
let shownNotifications = new Set();

/* ==================================
   Fetch High Priority Notifications
================================== */
async function checkNotifications() {
  try {
    const res = await fetch(API);
    const data = await res.json();

    data.forEach((mail) => {

      const uniqueId =
        mail.gmail_id ||
        `${mail.subject}_${mail.created_at || Date.now()}`;

      // already shown
      if (shownNotifications.has(uniqueId)) return;

      shownNotifications.add(uniqueId);

      chrome.notifications.create(uniqueId, {
        type: "basic",
        iconUrl: "icon.png",
        title: "⚡ PrYoPort Priority Alert",
        message: mail.summary || mail.subject,
        priority: 2,
        requireInteraction: true
      });

    });

  } catch (err) {
    console.log("Notification Error:", err);
  }
}

/* ==================================
   Cost Optimized Polling
================================== */

/* check once when extension starts */
checkNotifications();

/* every 5 min */
setInterval(checkNotifications, 300000);


/* ==================================
   Optional: Notification Click Action
================================== */
chrome.notifications.onClicked.addListener((id) => {
  chrome.tabs.create({
    url: "http://localhost:3000"
  });
});