const API_BASE = "http://127.0.0.1:8000";

// LOGIN
document.getElementById("login").addEventListener("click", () => {
  window.open(`${API_BASE}/auth/google`, "_blank");
});

// SAVE MANUAL PRIORITY
document.getElementById("savePriority").addEventListener("click", () => {
  const email = document.getElementById("emailInput").value;
  const priority = document.getElementById("prioritySelect").value;

  fetch(`${API_BASE}/set-priority`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, priority }),
  })
    .then(res => res.json())
    .then(data => {
      alert("Priority Saved!");
    });
});
async function getNotifications() {
  const res = await fetch("http://127.0.0.1:8000/notifications");
  const data = await res.json();

  data.forEach(n => {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon.png",
      title: "⚡ High Priority Email",
      message: n.summary
    });
  });
}

setInterval(getNotifications, 10000); // check every 10s locally
