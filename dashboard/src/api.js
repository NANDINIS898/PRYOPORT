
const BASE = import.meta.env.VITE_API_URL || "https://pryoport-backend.onrender.com";

const req = (url, opts = {}) =>
  fetch(`${BASE}${url}`, { credentials: "include", ...opts }).then(r => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });

export const api = {
  getDashboard:   ()        => req("/api/dashboard").catch(() => ({ emails: [], rules: [] })),
  markRead:       (id)      => req(`/api/emails/${encodeURIComponent(id)}/read`,     { method: "PATCH" }),
  updatePriority: (id, p)   => req(`/api/emails/${encodeURIComponent(id)}/priority`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priority: p }),
  }),
  deleteEmail:    (id)      => req(`/api/emails/${encodeURIComponent(id)}`,          { method: "DELETE" }),
  saveRule:       (email, p) => req("/set-priority", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, priority: p }),
  }),
  deleteRule:     (sender)  => req(`/api/rules/${encodeURIComponent(sender)}`,       { method: "DELETE" }),
  getAuthStatus:  ()        => req("/auth-status").catch(() => ({ logged_in: false })),
};

// Build a direct Gmail link from a gmail_id
export const gmailLink = (gmailId) =>
  `https://mail.google.com/mail/u/0/#inbox/${gmailId}`;