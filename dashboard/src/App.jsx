import { useState, useEffect, useRef } from "react";
import { api } from "./api";
import EmailCard from "./Emailcard";
import RulesPanel from "./Rulespanel";
import Onboarding from "./Onboarding";

function getFocusId() {
  return new URLSearchParams(window.location.search).get("id");
}

// ── ONBOARDING ──────────────────────────────────────────────────
function Onboarding() {
  const mono = { fontFamily: "monospace" };
  const steps = [
    {
      num: "01", icon: "🧩",
      title: "Install the Chrome Extension",
      desc: "PrYoPort works through a Chrome extension that reads your Gmail and syncs emails to this dashboard.",
      color: "#38bdf8", bg: "rgba(56,189,248,0.07)", border: "rgba(56,189,248,0.18)",
    },
    {
      num: "02", icon: "🔐",
      title: "Sign in with Google",
      desc: "Click the PrYoPort icon in your Chrome toolbar and log in with your Google account to grant Gmail access.",
      color: "#a78bfa", bg: "rgba(167,139,250,0.07)", border: "rgba(167,139,250,0.18)",
    },
    {
      num: "03", icon: "⚡",
      title: "Sync your inbox",
      desc: "Hit Sync in the extension. The AI reads, scores and prioritises your emails — they appear here instantly.",
      color: "#4ade80", bg: "rgba(74,222,128,0.07)", border: "rgba(74,222,128,0.18)",
    },
  ];
  const pills = ["🔥 AI priority", "📋 Smart rules", "🔔 Urgent alerts", "🤖 CrewAI agents", "⚡ Groq LLM"];

  return (
    <div style={{ minHeight: "70vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "48px 16px", textAlign: "center" }}>

      <div style={{ marginBottom: 52 }}>
        <div style={{ fontSize: 56, marginBottom: 16,
          filter: "drop-shadow(0 0 28px rgba(56,189,248,0.55))" }}>⚡</div>
        <h1 style={{ fontSize: "clamp(26px,5vw,44px)", fontWeight: 900,
          letterSpacing: "-1.5px", margin: "0 0 14px",
          background: "linear-gradient(135deg,#e2e8f0 0%,#38bdf8 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Welcome to PrYoPort
        </h1>
        <p style={{ color: "#64748b", fontSize: 15, maxWidth: 460,
          margin: "0 auto", lineHeight: 1.8 }}>
          Your AI-powered Gmail command centre.
          Get started in 3 steps — takes less than 2 minutes.
        </p>
      </div>

      <div style={{ display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
        gap: 14, width: "100%", maxWidth: 860, marginBottom: 44 }}>
        {steps.map((s, i) => (
          <div key={i}
            style={{ background: s.bg, border: `1px solid ${s.border}`,
              borderRadius: 14, padding: "26px 22px", textAlign: "left",
              transition: "transform 0.2s, box-shadow 0.2s" }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = `0 12px 32px ${s.bg}`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}>
            <div style={{ ...mono, fontSize: 10, fontWeight: 700,
              color: s.color, letterSpacing: 2, marginBottom: 14, opacity: 0.8 }}>
              STEP {s.num}
            </div>
            <div style={{ display: "flex", alignItems: "center",
              gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 24 }}>{s.icon}</span>
              <span style={{ fontWeight: 800, fontSize: 14,
                color: "#e2e8f0", lineHeight: 1.3 }}>{s.title}</span>
            </div>
            <p style={{ color: "#64748b", fontSize: 13,
              lineHeight: 1.75, margin: 0 }}>{s.desc}</p>
          </div>
        ))}
      </div>

      <a href="#"
        style={{ display: "inline-flex", alignItems: "center", gap: 8,
          padding: "12px 28px", borderRadius: 10, marginBottom: 36,
          background: "rgba(56,189,248,0.1)",
          border: "1px solid rgba(56,189,248,0.35)",
          color: "#38bdf8", fontSize: 13, fontWeight: 800,
          fontFamily: "monospace", textDecoration: "none",
          letterSpacing: 0.5, transition: "all 0.15s" }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(56,189,248,0.2)"}
        onMouseLeave={e => e.currentTarget.style.background = "rgba(56,189,248,0.1)"}>
        🧩 Download Chrome Extension
      </a>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap",
        justifyContent: "center", marginBottom: 36 }}>
        {pills.map((p, i) => (
          <span key={i} style={{ background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20,
            padding: "5px 14px", fontSize: 12, color: "#475569",
            fontFamily: "monospace" }}>{p}</span>
        ))}
      </div>

      <p style={{ ...mono, fontSize: 11, color: "#1e3a52" }}>
        Already installed?&nbsp;
        <span style={{ color: "#38bdf8" }}>Click Sync in the extension</span>
        &nbsp;to load your emails here.
      </p>
    </div>
  );
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