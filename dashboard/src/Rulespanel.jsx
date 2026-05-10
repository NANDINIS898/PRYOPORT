import { useState } from "react";
import { api } from "./api";

export default function RulesPanel({ rules, onUpdate }) {
  const [newEmail, setNewEmail]       = useState("");
  const [newPriority, setNewPriority] = useState("high");
  const [saving, setSaving]           = useState(false);

  async function addRule() {
    const e = newEmail.trim();
    if (!e) return;
    setSaving(true);
    await api.saveRule(e, newPriority);
    setSaving(false);
    setNewEmail("");
    onUpdate();
  }

  async function removeRule(sender) {
    if (!confirm(`Remove rule for ${sender}?`)) return;
    await api.deleteRule(sender);
    onUpdate();
  }

  const mono = { fontFamily: "monospace" };

  return (
    <div style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 14, overflow: "hidden" }}>

      {/* Table */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "rgba(0,0,0,0.3)" }}>
            {["Sender Email", "Priority", "Action"].map(h => (
              <th key={h} style={{ ...mono, fontSize: 10, fontWeight: 600,
                textTransform: "uppercase", letterSpacing: "0.8px", color: "#4a6080",
                padding: "11px 18px", textAlign: "left",
                borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rules.length === 0 ? (
            <tr><td colSpan={3} style={{ textAlign: "center", padding: 32,
              color: "#4a6080", fontSize: 13 }}>
              No rules yet — add one below
            </td></tr>
          ) : rules.map(r => (
            <tr key={r.sender} style={{ transition: "background 0.15s" }}>
              <td style={{ ...mono, fontSize: 12, color: "#38bdf8",
                padding: "11px 18px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                {r.sender}
              </td>
              <td style={{ padding: "11px 18px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ ...mono, fontSize: 11, fontWeight: 700,
                  padding: "2px 10px", borderRadius: 4,
                  background: r.manual_priority === "high"
                    ? "rgba(244,63,94,0.12)" : "rgba(71,85,105,0.15)",
                  color: r.manual_priority === "high" ? "#f43f5e" : "#64748b" }}>
                  {r.manual_priority}
                </span>
              </td>
              <td style={{ padding: "11px 18px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <button onClick={() => removeRule(r.sender)}
                  style={{ ...mono, fontSize: 11, padding: "4px 10px", borderRadius: 6,
                    border: "1px solid rgba(244,63,94,0.25)", color: "#f43f5e",
                    background: "rgba(244,63,94,0.07)", cursor: "pointer" }}>
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Add rule row */}
      <div style={{ display: "flex", gap: 8, padding: "12px 18px",
        background: "rgba(0,0,0,0.2)", borderTop: "1px solid rgba(255,255,255,0.06)",
        alignItems: "center" }}>
        <input value={newEmail} onChange={e => setNewEmail(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addRule()}
          placeholder="sender@example.com"
          style={{ flex: 1, ...mono, fontSize: 12, padding: "7px 10px",
            borderRadius: 7, border: "1px solid rgba(255,255,255,0.08)",
            background: "#0a1628", color: "#dce8f5", outline: "none" }} />
        <select value={newPriority} onChange={e => setNewPriority(e.target.value)}
          style={{ ...mono, fontSize: 12, padding: "7px 8px", borderRadius: 7,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "#0a1628", color: "#dce8f5", cursor: "pointer" }}>
          <option value="high">🔥 High</option>
          <option value="low">🧊 Low</option>
        </select>
        <button disabled={saving} onClick={addRule}
          style={{ ...mono, fontSize: 12, padding: "7px 16px", borderRadius: 7, whiteSpace: "nowrap",
            border: "1px solid rgba(56,189,248,0.3)", color: "#38bdf8",
            background: "rgba(56,189,248,0.08)", cursor: "pointer" }}>
          {saving ? "Saving..." : "+ Add Rule"}
        </button>
      </div>
    </div>
  );
}