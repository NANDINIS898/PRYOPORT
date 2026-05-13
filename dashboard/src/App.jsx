
import { useState, useEffect, useRef } from "react";
import { api } from "./api";
import EmailCard from "./components/EmailCard";
import RulesPanel from "./components/RulesPanel";
import Onboarding from "./Onboarding";
 
// Read ?id= from URL so a notification click can highlight a specific email
function getFocusId() {
  return new URLSearchParams(window.location.search).get("id");
}
 
// ── SPINNER ─────────────────────────────────────────────────────
function Spinner({ message }) {
  return (
    <div style={{ textAlign: "center", padding: 80, color: "#4a6080" }}>
      <div style={{ fontSize: 32, marginBottom: 14,
        display: "inline-block",
        animation: "spin 1.2s linear infinite" }}>⚡</div>
      <div style={{ fontSize: 13, fontFamily: "monospace",
        color: "#4a6080" }}>{message}</div>
    </div>
  );
}
 
// ── APP ─────────────────────────────────────────────────────────
export default function App() {
  const [emails, setEmails]   = useState([]);
  const [rules, setRules]     = useState([]);
  const [tab, setTab]         = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  const [waking, setWaking]   = useState(false);
  const [auth, setAuth]       = useState(null);
  const focusId               = getFocusId();
  const highlightRef          = useRef(null);
 
  async function load() {
    setLoading(true);
    setError(false);
 
    // after 4s show "waking up" message for Render cold start
    const wakeTimer = setTimeout(() => setWaking(true), 4000);
 
    try {
      const [dash, authData] = await Promise.all([
        api.getDashboard(),
        api.getAuthStatus(),
      ]);
      clearTimeout(wakeTimer);
      setWaking(false);
      setEmails(dash.emails || []);
      setRules(dash.rules   || []);
      setAuth(authData);
    } catch {
      clearTimeout(wakeTimer);
      setWaking(false);
      setError(true);
    } finally {
      setLoading(false);
    }
  }
 
  useEffect(() => { load(); }, []);
 
  useEffect(() => {
    if (focusId && highlightRef.current) {
      setTimeout(() => highlightRef.current?.scrollIntoView(
        { behavior: "smooth", block: "center" }), 300);
    }
  }, [emails]);
 
  function onUpdate(id, changes) {
    setEmails(prev => prev.map(e =>
      e.gmail_id === id ? { ...e, ...changes } : e));
  }
  function onDelete(id) {
    setEmails(prev => prev.filter(e => e.gmail_id !== id));
  }
 
  const filtered = emails.filter(e => {
    if (tab === "all")    return e.is_read !== 1;
    if (tab === "high")   return e.priority === "high"   && e.is_read !== 1;
    if (tab === "medium") return e.priority === "medium" && e.is_read !== 1;
    if (tab === "read")   return e.is_read === 1;
    return true;
  });
 
  const highCount = emails.filter(e => e.priority === "high"   && e.is_read !== 1).length;
  const medCount  = emails.filter(e => e.priority === "medium" && e.is_read !== 1).length;
  const readCount = emails.filter(e => e.is_read === 1).length;
  const hasEmails = emails.length > 0;
  const mono      = { fontFamily: "monospace" };
 
  return (
    <div style={{ minHeight: "100vh", background: "#050b17",
      color: "#dce8f5", fontFamily: "'Syne','Segoe UI',sans-serif" }}>
 
      {/* Grid texture */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: "linear-gradient(rgba(56,189,248,0.012) 1px,transparent 1px),linear-gradient(90deg,rgba(56,189,248,0.012) 1px,transparent 1px)",
        backgroundSize: "40px 40px" }} />
 
      {/* ── TOPBAR ── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100,
        background: "rgba(5,11,23,0.92)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "0 32px", height: 60,
        display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: 20 }}>
 
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22,
            filter: "drop-shadow(0 0 12px rgba(56,189,248,0.8))" }}>⚡</span>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800,
              letterSpacing: "-0.5px" }}>PrYoPort</div>
            <div style={{ ...mono, fontSize: 10, color: "#38bdf8",
              textTransform: "uppercase", letterSpacing: 1 }}>
              Command Center
            </div>
          </div>
        </div>
 
        {hasEmails && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {[
              { label: "URGENT", count: highCount, color: "#f43f5e", bg: "rgba(244,63,94,0.12)" },
              { label: "MEDIUM", count: medCount,  color: "#f59e0b", bg: "rgba(245,158,11,0.10)" },
              { label: "RULES",  count: rules.length, color: "#38bdf8", bg: "rgba(56,189,248,0.10)" },
            ].map(({ label, count, color, bg }) => (
              <div key={label} style={{ ...mono, fontSize: 11, fontWeight: 700,
                padding: "4px 12px", borderRadius: 20,
                background: bg, color, border: `1px solid ${color}40`,
                display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%",
                  background: color, display: "inline-block",
                  animation: "blink 1.4s ease-in-out infinite" }} />
                {count} {label}
              </div>
            ))}
          </div>
        )}
 
        {auth && (
          <div style={{ ...mono, fontSize: 11,
            color: auth.logged_in ? "#22c55e" : "#f43f5e" }}>
            {auth.logged_in
              ? `🟢 ${auth.email || "Connected"}`
              : "🔴 Extension not connected"}
          </div>
        )}
      </nav>
 
      {/* ── MAIN ── */}
      <main style={{ position: "relative", zIndex: 1, maxWidth: 1200,
        margin: "0 auto", padding: "28px 32px 60px" }}>
 
        {/* Tab bar — only when emails exist */}
        {hasEmails && !loading && (
          <div style={{ display: "flex", gap: 6, marginBottom: 22, flexWrap: "wrap" }}>
            {[
              { key: "all",    label: `All Unread (${highCount + medCount})` },
              { key: "high",   label: `🔥 High (${highCount})` },
              { key: "medium", label: `⚡ Medium (${medCount})` },
              { key: "read",   label: `✓ Read (${readCount})` },
              { key: "rules",  label: `🎯 Rules (${rules.length})` },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setTab(key)}
                style={{ ...mono, fontSize: 11, padding: "6px 14px",
                  borderRadius: 7, cursor: "pointer", border: "1px solid",
                  transition: "all 0.15s",
                  borderColor: tab === key ? "rgba(56,189,248,0.4)" : "rgba(255,255,255,0.07)",
                  background:  tab === key ? "rgba(56,189,248,0.1)"  : "transparent",
                  color:       tab === key ? "#38bdf8" : "#4a6080" }}>
                {label}
              </button>
            ))}
            <button onClick={load}
              style={{ ...mono, fontSize: 11, padding: "6px 14px",
                borderRadius: 7, cursor: "pointer", marginLeft: "auto",
                border: "1px solid rgba(255,255,255,0.07)",
                background: "transparent", color: "#4a6080" }}>
              ↻ Refresh
            </button>
          </div>
        )}
 
        {/* ── CONTENT ── */}
        {loading ? (
          <Spinner message={waking
            ? "Server is waking up… this takes ~30s on first visit ⏳"
            : "Connecting to PrYoPort…"} />
 
        ) : error ? (
          <div style={{ textAlign: "center", padding: 80 }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>⚠️</div>
            <div style={{ color: "#f43f5e", ...mono, fontSize: 13, marginBottom: 20 }}>
              Could not reach the server
            </div>
            <button onClick={load}
              style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer",
                background: "rgba(56,189,248,0.1)",
                border: "1px solid rgba(56,189,248,0.3)",
                color: "#38bdf8", ...mono, fontSize: 12 }}>
              ↻ Try again
            </button>
          </div>
 
        ) : !hasEmails ? (
          <Onboarding />
 
        ) : tab === "rules" ? (
          <div>
            <div style={{ ...mono, fontSize: 11, fontWeight: 600,
              textTransform: "uppercase", letterSpacing: 1,
              color: "#4a6080", marginBottom: 12 }}>— Priority Rules</div>
            <RulesPanel rules={rules} onUpdate={load} />
          </div>
 
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 80, color: "#4a6080" }}>
            <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>📭</div>
            <div style={{ ...mono, fontSize: 13 }}>
              No {tab === "read" ? "read" : tab} emails right now
            </div>
          </div>
 
        ) : (
          <div style={{ display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(360px,1fr))",
            gap: 14 }}>
            {filtered.map(email => (
              <div key={email.gmail_id}
                ref={email.gmail_id === focusId ? highlightRef : null}>
                <EmailCard
                  email={email}
                  highlighted={email.gmail_id === focusId}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                />
              </div>
            ))}
          </div>
        )}
      </main>
 
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap');
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        * { box-sizing: border-box; }
        button:hover { opacity: 0.85; }
        select option { background: #0a1628; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #1a2a3a; border-radius: 3px; }
      `}</style>
    </div>
  );
}