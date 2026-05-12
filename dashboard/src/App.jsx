import { useState, useEffect, useRef } from "react";
import { api } from "./api";
import EmailCard from "./Emailcard";
import RulesPanel from "./Rulespanel";

// Read ?id= from URL so a notification click can highlight a specific email
function getFocusId() {
  return new URLSearchParams(window.location.search).get("id");
}

export default function App() {
  const [emails, setEmails]   = useState([]);
  const [rules, setRules]     = useState([]);
  const [tab, setTab]         = useState("all");   // "all" | "high" | "medium" | "read" | "rules"
  const [loading, setLoading] = useState(true);
  const [auth, setAuth]       = useState(null);
  const focusId               = getFocusId();
  const highlightRef          = useRef(null);

  // Load everything
  async function load() {
    setLoading(true);
    const [dash, authData] = await Promise.all([api.getDashboard(), api.getAuthStatus()]);
    setEmails(dash.emails || []);
    setRules(dash.rules   || []);
    console.log("DASHBOARD DATA:", dash);
    setEmails(dash.emails || []);
    setRules(dash.rules || []);
    setAuth(authData);
    setLoading(false);

  }

  useEffect(() => { load(); }, []);

  // Scroll to highlighted card after render
  useEffect(() => {
    if (focusId && highlightRef.current) {
      setTimeout(() => highlightRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 300);
    }
  }, [emails]);

  function onUpdate(id, changes) {
    setEmails(prev => prev.map(e => e.gmail_id === id ? { ...e, ...changes } : e));
  }

  function onDelete(id) {
    setEmails(prev => prev.filter(e => e.gmail_id !== id));
  }

  // Filtered view
  const filtered = emails.filter(e => {
    if (tab === "all")    return e.is_read !== 1;
    if (tab === "high")   return e.priority === "high"   && e.is_read !== 1;
    if (tab === "medium") return e.priority === "medium" && e.is_read !== 1;
    if (tab === "read")   return e.is_read === 1;
    return true;
  });

  const highCount   = emails.filter(e => e.priority === "high"   && e.is_read !== 1).length;
  const medCount    = emails.filter(e => e.priority === "medium" && e.is_read !== 1).length;
  const readCount   = emails.filter(e => e.is_read === 1).length;

  const mono = { fontFamily: "monospace" };
  const surface = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" };

  return (
    <div style={{ minHeight: "100vh", background: "#050b17", color: "#dce8f5",
      fontFamily: "'Syne', 'Segoe UI', sans-serif" }}>

      {/* Grid texture */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: "linear-gradient(rgba(56,189,248,0.012) 1px,transparent 1px),linear-gradient(90deg,rgba(56,189,248,0.012) 1px,transparent 1px)",
        backgroundSize: "40px 40px" }} />

      {/* ── TOPBAR ── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100,
        background: "rgba(5,11,23,0.92)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "0 32px", height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22, filter: "drop-shadow(0 0 12px rgba(56,189,248,0.8))" }}>⚡</span>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.5px" }}>PrYoPort</div>
            <div style={{ ...mono, fontSize: 10, color: "#38bdf8", textTransform: "uppercase", letterSpacing: 1 }}>
              Command Center
            </div>
          </div>
        </div>

        {/* Stats */}
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
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: color,
                display: "inline-block", animation: "blink 1.4s ease-in-out infinite" }} />
              {count} {label}
            </div>
          ))}
        </div>

        {auth && (
  <div style={{ ...mono, fontSize: 11, 
    color: auth.logged_in ? "#22c55e" : "#f43f5e" }}>
    {auth.logged_in
      ? `🟢 ${auth.email || "Connected"}`   // shows "Extension Connected" or real email
      : "🔴 Not Connected — Open extension to sync"}
  </div>
)}
      </nav>

      {/* ── MAIN ── */}
      <main style={{ position: "relative", zIndex: 1, maxWidth: 1200,
        margin: "0 auto", padding: "28px 32px 60px" }}>

        {/* Tab bar */}
        <div style={{ display: "flex", gap: 6, marginBottom: 22, flexWrap: "wrap" }}>
          {[
            { key: "all",    label: `All Unread (${highCount + medCount})` },
            { key: "high",   label: `🔥 High (${highCount})` },
            { key: "medium", label: `⚡ Medium (${medCount})` },
            { key: "read",   label: `✓ Read (${readCount})` },
            { key: "rules",  label: `🎯 Rules (${rules.length})` },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
              style={{ ...mono, fontSize: 11, padding: "6px 14px", borderRadius: 7, cursor: "pointer",
                border: "1px solid", transition: "all 0.15s",
                borderColor: tab === key ? "rgba(56,189,248,0.4)" : "rgba(255,255,255,0.07)",
                background:  tab === key ? "rgba(56,189,248,0.1)" : "transparent",
                color:       tab === key ? "#38bdf8" : "#4a6080" }}>
              {label}
            </button>
          ))}
          <button onClick={load} style={{ ...mono, fontSize: 11, padding: "6px 14px",
            borderRadius: 7, cursor: "pointer", marginLeft: "auto",
            border: "1px solid rgba(255,255,255,0.07)", background: "transparent", color: "#4a6080" }}>
            ↻ Refresh
          </button>
        </div>

        {/* Rules tab */}
        {tab === "rules" ? (
          <div>
            <div style={{ ...mono, fontSize: 11, fontWeight: 600, textTransform: "uppercase",
              letterSpacing: 1, color: "#4a6080", marginBottom: 12 }}>
              — Priority Rules
            </div>
            <RulesPanel rules={rules} onUpdate={load} />
          </div>
        ) : loading ? (
          <div style={{ textAlign: "center", padding: 80, color: "#4a6080" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
            Loading emails...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 80, color: "#4a6080" }}>
            <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>📭</div>
            <div>No {tab === "read" ? "read" : "priority"} emails</div>
            <div style={{ fontSize: 12, color: "#1e2d42", marginTop: 6 }}>
              Sync from the extension to load emails
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 14 }}>
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
        * { box-sizing: border-box; }
        button:hover { opacity: 0.85; }
        select option { background: #0a1628; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #1a2a3a; border-radius: 3px; }
      `}</style>
    </div>
  );
}