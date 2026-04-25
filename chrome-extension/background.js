const API = "http://127.0.0.1:8000/notifications";

let lastShown = new Set();

async function checkNotifications() {
  try {
    const res = await fetch(API);
    const data = await res.json();

    data.forEach((mail) => {
      const id = mail.subject + mail.timestamp;

      if (!lastShown.has(id)) {
        lastShown.add(id);

        chrome.notifications.create({
          type: "basic",
          iconUrl: "icon.png",
          title: "🔥 Urgent Email",
          message: mail.summary || mail.subject,
          priority: 2,
        });
      }
    });
  } catch (err) {
    console.log("Error fetching notifications", err);
  }
}

// Run every 10 sec
setInterval(checkNotifications, 10000);