import { useState } from "react";
import { api, gmailLink } from "./api";

const PRIORITY_COLORS = {
  high:   { border: "#f43f5e", bg: "rgba(244,63,94,0.08)",  badge: "rgba(244,63,94,0.15)",  text: "#f43f5e" },
  medium: { border: "#f59e0b", bg: "rgba(245,158,11,0.07)", badge: "rgba(245,158,11,0.15)", text: "#f59e0b" },
  low:    { border: "#475569", bg: "rgba(71,85,105,0.05)",  badge: "rgba(71,85,105,0.15)",  text: "#64748b" },
};

export default function EmailCard({ email, onUpdate, onDelete, highlighted }) {
  const [loading, setLoading] = useState(null); // 'read' | 'delete' | 'priority'
  const [priority, setPriority] = useState(email.priority);

  const c = PRIORITY_COLORS[priority] || PRIORITY_COLORS.medium;

  async function handleMarkRead() {
    setLoading("read");
    await api.markRead(email.gmail_id);
    setLoading(null);
    onUpdate(email.gmail_id, { is_read: 1 });
  }

  async function handlePriority(newP) {
    setLoading("priority");
    await api.updatePriority(email.gmail_id, newP);
    setPriority(newP);
    setLoading(null);
    onUpdate(email.gmail_id, { priority: newP });
  }

  async function handleDelete() {
    if (!confirm(`Delete "${email.subject}" from PrYoPort?`)) return;
    setLoading("delete");
    await api.deleteEmail(email.gmail_id);
    setLoading(null);
    onDelete(email.gmail_id);
  }

  return (
    <div style={{
      background: highlighted ? "rgba(56,189,248,0.06)" : c.bg,
      border: `1px solid ${highlighted ? "rgba(56,189,248,0.4)" : c.border}`,
      borderLeft: `3px solid ${c.border}`,
      borderRadius: 12,
      overflow: "hidden",
      transition: "box-shadow 0.2s",
      opacity: email.is_read ? 0.5 : 1,
      outline: highlighted ? "2px solid rgba(56,189,248,0.3)" : "none",
    }}>
      {/* Top */}
      <div style={{ padding: "14px 16px 10px" }}>
        {/* Badges row */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8, alignItems: "center" }}>
          <span style={{ fontFamily: "monospace", fontSize: 10, fontWeight: 700,
            background: c.badge, color: c.text,
            padding: "2px 8px", borderRadius: 4, textTransform: "uppercase" }}>
            {priority}
          </span>
          <span style={{ fontFamily: "monospace", fontSize: 10,
            background: "rgba(255,255,255,0.05)", color: "#64748b",
            padding: "2px 8px", borderRadius: 4, textTransform: "uppercase",
            border: "1px solid rgba(255,255,255,0.06)" }}>
            {email.category || "general"}
          </span>
          <span style={{ marginLeft: "auto", fontFamily: "monospace", fontSize: 11, fontWeight: 700,
            background: c.badge, color: c.text, padding: "2px 8px", borderRadius: 4 }}>
            {email.urgency_score}
          </span>
          {email.is_read === 1 && (
            <span style={{ fontFamily: "monospace", fontSize: 10, color: "#22c55e",
              background: "rgba(34,197,94,0.1)", padding: "2px 8px", borderRadius: 4 }}>
              ✓ read
            </span>
          )}
        </div>

        {/* Subject */}
        <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3, marginBottom: 3,
          color: "#e8edf5", wordBreak: "break-word" }}>
          {email.subject || "No Subject"}
        </div>

        {/* Sender */}
        <div style={{ fontFamily: "monospace", fontSize: 11, color: "#4a6080", marginBottom: 8,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {email.sender}
        </div>

        {/* Summary */}
        {email.summary && (
          <div style={{ fontSize: 12, lineHeight: 1.6, color: "#7a9bb8",
            display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
            marginBottom: 10 }}>
            {email.summary}
          </div>
        )}

        {/* Snippet (muted, collapsed) */}
        {email.snippet && !email.summary && (
          <div style={{ fontSize: 11, color: "#374151", lineHeight: 1.5,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
            marginBottom: 10 }}>
            {email.snippet}
          </div>
        )}

        {/* Score bar */}
        <div style={{ height: 2, background: "rgba(255,255,255,0.05)", borderRadius: 1, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${email.urgency_score}%`,
            background: `linear-gradient(90deg, ${c.border}, ${c.text})`,
            borderRadius: 1, transition: "width 0.8s ease" }} />
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 6, padding: "8px 16px", flexWrap: "wrap",
        background: "rgba(0,0,0,0.2)", borderTop: "1px solid rgba(255,255,255,0.05)",
        alignItems: "center" }}>

        {/* Open in Gmail */}
        <a href={gmailLink(email.gmail_id)} target="_blank" rel="noreferrer"
          onClick={handleMarkRead}
          style={{ textDecoration: "none", fontFamily: "monospace", fontSize: 11,
            padding: "5px 10px", borderRadius: 6, cursor: "pointer",
            border: "1px solid rgba(56,189,248,0.3)", color: "#38bdf8",
            background: "rgba(56,189,248,0.08)", transition: "all 0.15s" }}>
          ↗ Open in Gmail
        </a>

        {/* Mark read */}
        {email.is_read !== 1 && (
          <button disabled={!!loading} onClick={handleMarkRead}
            style={{ fontFamily: "monospace", fontSize: 11, padding: "5px 10px",
              borderRadius: 6, border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e",
              background: "rgba(34,197,94,0.08)", cursor: "pointer", transition: "all 0.15s" }}>
            {loading === "read" ? "..." : "✓ Mark Read"}
          </button>
        )}

        {/* Priority select */}
        <select value={priority} disabled={!!loading}
          onChange={e => handlePriority(e.target.value)}
          style={{ fontFamily: "monospace", fontSize: 11, padding: "5px 8px",
            borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)",
            background: "#0a1628", color: "#64748b", cursor: "pointer" }}>
          <option value="high">🔥 High</option>
          <option value="medium">⚡ Medium</option>
          <option value="low">🧊 Low</option>
        </select>

        {/* Delete */}
        <button disabled={!!loading} onClick={handleDelete}
          style={{ fontFamily: "monospace", fontSize: 11, padding: "5px 10px",
            borderRadius: 6, border: "1px solid rgba(244,63,94,0.25)", color: "#f43f5e",
            background: "rgba(244,63,94,0.07)", cursor: "pointer", marginLeft: "auto",
            transition: "all 0.15s" }}>
          {loading === "delete" ? "..." : "🗑 Delete"}
        </button>
      </div>
    </div>
  );
}