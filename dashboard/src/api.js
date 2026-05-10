const BASE = "http://127.0.0.1:8000";

const req = (url, opts = {}) =>
  fetch(`${BASE}${url}`, { credentials: "include", ...opts }).then(r => r.json());

export const api = {
  getDashboard:    ()           => req("/api/dashboard"),
  markRead:        (id)         => req(`/api/emails/${encodeURIComponent(id)}/read`,     { method: "PATCH" }),
  updatePriority:  (id, p)      => req(`/api/emails/${encodeURIComponent(id)}/priority`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priority: p }),
  }),
  deleteEmail:     (id)         => req(`/api/emails/${encodeURIComponent(id)}`,          { method: "DELETE" }),
  saveRule:        (email, p)   => req("/set-priority", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, priority: p }),
  }),
  deleteRule:      (sender)     => req(`/api/rules/${encodeURIComponent(sender)}`,       { method: "DELETE" }),
  getAuthStatus:   ()           => req("/auth-status"),
};

// Build a direct Gmail link from a gmail_id
export const gmailLink = (gmailId) =>
  `https://mail.google.com/mail/u/0/#inbox/${gmailId}`;