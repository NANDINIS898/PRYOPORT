// popup.js

const API = "http://127.0.0.1:8000";

// =====================================================
// ELEMENTS
// =====================================================

const statusBox = document.getElementById("status");
const loginBtn = document.getElementById("login");
const syncBtn = document.getElementById("syncBtn");

const savePriorityBtn = document.getElementById("savePriority");
const emailInput = document.getElementById("emailInput");
const prioritySelect = document.getElementById("prioritySelect");

const notificationsBox = document.getElementById("notifications");


// =====================================================
// ON LOAD
// =====================================================

document.addEventListener("DOMContentLoaded", () => {
    checkLoginStatus();
    loadNotifications();
});


// =====================================================
// LOGIN STATUS
// =====================================================

async function checkLoginStatus() {
    try {
        statusBox.innerText = "⏳ Checking login...";

        const res = await fetch(`${API}/auth-status`);
        const data = await res.json();

        if (data.logged_in) {
            statusBox.innerText = `🟢 Gmail Connected`;
            loginBtn.innerText = "Connected";
            loginBtn.disabled = true;
        } else {
            statusBox.innerText = "🔴 Gmail Not Connected";
            loginBtn.innerText = "Login with Gmail";
            loginBtn.disabled = false;
        }

    } catch (err) {
        statusBox.innerText = "❌ Backend Offline";
    }
}


// =====================================================
// LOGIN
// =====================================================

loginBtn.addEventListener("click", async () => {

    try {
        statusBox.innerText = "⏳ Connecting Gmail...";

        const res = await fetch(`${API}/login`);
        const data = await res.json();

        if (data.message === "Already logged in") {
            statusBox.innerText = "✅ Gmail Already Connected";
        } else {
            statusBox.innerText = "✅ Gmail Connected Successfully";
        }

        checkLoginStatus();

    } catch (err) {
        statusBox.innerText = "❌ Login Failed";
    }

});


// =====================================================
// SYNC EMAILS
// =====================================================

syncBtn.addEventListener("click", async () => {

    try {
        statusBox.innerText = "⏳ Syncing emails...";

        const res = await fetch(`${API}/sync`, {
            method: "POST"
        });

        const data = await res.json();

        statusBox.innerText = "✅ Inbox Updated";

        loadNotifications();

    } catch (err) {
        statusBox.innerText = "❌ Sync Failed";
    }

});


// =====================================================
// SAVE MANUAL PRIORITY
// =====================================================

savePriorityBtn.addEventListener("click", async () => {

    const email = emailInput.value.trim();
    const priority = prioritySelect.value;

    if (!email) {
        statusBox.innerText = "⚠️ Enter email first";
        return;
    }

    try {
        const res = await fetch(`${API}/set-priority`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                priority: priority
            })
        });

        const data = await res.json();

        statusBox.innerText = "✅ Priority Saved";

        emailInput.value = "";

    } catch (err) {
        statusBox.innerText = "❌ Save Failed";
    }

});


// =====================================================
// LOAD NOTIFICATIONS
// =====================================================

async function loadNotifications() {

    try {
        const res = await fetch(`${API}/notifications`);
        const data = await res.json();

        notificationsBox.innerHTML = "";

        if (!data.notifications || data.notifications.length === 0) {
            notificationsBox.innerHTML = "No urgent notifications.";
            return;
        }

        data.notifications.forEach(item => {

            const div = document.createElement("div");

            div.className =
                item.priority === "high"
                ? "high"
                : "low";

            div.style.marginBottom = "10px";
            div.style.padding = "8px";

            div.innerHTML = `
                <strong>${item.subject || "Priority Email"}</strong><br>
                ${item.summary || ""}
            `;

            notificationsBox.appendChild(div);

            // Chrome Notification Popup
            if (item.priority === "high") {
                chrome.notifications.create({
                    type: "basic",
                    iconUrl: "icon.png",
                    title: "🔥 High Priority Email",
                    message: item.summary || "Urgent mail received"
                });
            }

        });

    } catch (err) {
        notificationsBox.innerHTML = "Unable to load notifications.";
    }

}