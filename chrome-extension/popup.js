document.getElementById("login").addEventListener("click", async () => {
  try {
    const token = await chrome.identity.getAuthToken({ interactive: true });
    console.log("Gmail token:", token);
    alert("Logged in! Check console for token.");
  } catch (err) {
    console.error(err);
    alert("Login failed!");
  }
});