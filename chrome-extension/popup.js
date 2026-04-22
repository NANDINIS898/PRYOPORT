// LOGIN → triggers backend OAuth
document.getElementById("login").addEventListener("click", () => {
  chrome.tabs.create({
    url: "http://127.0.0.1:8000/auth/google"
  });
});

// FETCH EMAILS → call backend API
document.getElementById("fetch").addEventListener("click", async () => {
  try {
    const res = await fetch("http://127.0.0.1:8000/emails");
    const data = await res.json();

    console.log("📩 Emails:", data);

    alert("Check console for emails!");
  } catch (err) {
    console.error("Error:", err);
  }
});