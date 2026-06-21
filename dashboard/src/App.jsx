import { useState, useEffect, useRef } from "react";
import { api } from "./api";
import EmailCard from "./Emailcard";
import RulesPanel from "./Rulespanel";
import Onboarding from "./Onboarding";
import { Link } from "react-router-dom";

// ────────────────────────────────────────────────────────────────
// Design tokens — keep colors centralized so the whole shell stays
// coherent. Palette unchanged from before.
// ────────────────────────────────────────────────────────────────
const T = {
  bg:        "#050b17",
  bgRaised:  "#0a1424",
  bgCard:    "#0b1626",
  border:    "rgba(148,163,184,0.10)",
  borderHi:  "rgba(148,163,184,0.18)",
  text:      "#e2e8f0",
  textDim:   "#94a3b8",
  textMute:  "#64748b",
  textFaint: "#475569",
  accent:    "#38bdf8",   // cyan  — brand/primary
  purple:    "#a78bfa",
  green:     "#22c55e",
  greenLite: "#4ade80",
  amber:     "#f59e0b",
  rose:      "#f43f5e",
  mono: "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace",
  sans: "'Inter','Syne','Segoe UI',system-ui,sans-serif",
};

function getFocusId() {
  return new URLSearchParams(window.location.search).get("id");
}

function fmtRel(d) {
  if (!d) return "—";
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 5)    return "just now";
  if (s < 60)   return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

// ── ICONS (inline SVG, no deps) ─────────────────────────────────
const Icon = {
  refresh: (props) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 3v6h-6" />
    </svg>
  ),
  bolt: (props) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />
    </svg>
  ),
  slash: (props) => (
    <svg width="14" height="22" viewBox="0 0 14 22" fill="none" stroke="currentColor" strokeWidth="1.2" {...props}>
      <path d="M11 3 3 19" />
    </svg>
  ),
  empty: (props) => (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  ),
};

// ── SKELETON CARD (loading placeholder) ─────────────────────────
function SkeletonCard() {
  return (
    <div style={{
      background: T.bgCard,
      border: `1px solid ${T.border}`,
      borderRadius: 12,
      padding: 18,
      minHeight: 140,
      position: "relative",
      overflow: "hidden",
    }}>
      <div className="shimmer" style={{ height: 10, width: "30%",  borderRadius: 4, background: "#0f1d33", marginBottom: 12 }} />
      <div className="shimmer" style={{ height: 14, width: "85%",  borderRadius: 4, background: "#0f1d33", marginBottom: 8 }} />
      <div className="shimmer" style={{ height: 10, width: "60%",  borderRadius: 4, background: "#0f1d33", marginBottom: 20 }} />
      <div className="shimmer" style={{ height: 8,  width: "100%", borderRadius: 4, background: "#0f1d33" }} />
    </div>
  );
}

// ── STAT CHIP — used in the summary strip ───────────────────────
function Stat({ label, count, color, dim }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "6px 14px 6px 12px",
      borderRadius: 8,
      background: dim ? "transparent" : `${color}10`,
      border: `1px solid ${dim ? T.border : `${color}33`}`,
      transition: "all 200ms ease",
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%",
        background: color,
        boxShadow: dim ? "none" : `0 0 8px ${color}`,
      }} />
      <span style={{
        fontFamily: T.mono, fontSize: 13, fontWeight: 700,
        color: dim ? T.textMute : T.text,
        fontVariantNumeric: "tabular-nums",
      }}>
        {count}
      </span>
      <span style={{
        fontFamily: T.mono, fontSize: 10, fontWeight: 600,
        color: T.textMute, textTransform: "uppercase", letterSpacing: 1,
      }}>
        {label}
      </span>
    </div>
  );
}

// ── INLINE LOADER (small spinner) ───────────────────────────────
function MiniSpin({ color = T.textMute }) {
  return (
    <span style={{
      display: "inline-block",
      width: 12, height: 12,
      border: `1.5px solid ${color}33`,
      borderTopColor: color,
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite",
    }} />
  );
}

// ── INITIAL AUTH-CHECK SPINNER ──────────────────────────────────
function BootSpinner({ message }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: T.bg,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 16, color: T.textDim, fontFamily: T.mono,
    }}>
      <MiniSpin color={T.accent} />
      <div style={{ fontSize: 12 }}>{message}</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// APP
// ════════════════════════════════════════════════════════════════
export default function App() {
  const [emails, setEmails]   = useState([]);
  const [rules, setRules]     = useState([]);
  const [tab, setTab]         = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  const [waking, setWaking]   = useState(false);
  const [auth, setAuth]       = useState(null);
  const [lastLoad, setLastLoad] = useState(null);
  const [, forceTick]         = useState(0);

  const [authChecked, setAuthChecked]       = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [retryCount, setRetryCount]         = useState(0);

  const focusId      = getFocusId();
  const highlightRef = useRef(null);

  // tick "x m ago" every 30s
  useEffect(() => {
    const id = setInterval(() => forceTick(t => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => { if (focusId) setTab("all"); }, [focusId]);

  async function load() {
    setLoading(true);
    setError(false);
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
      setLastLoad(new Date());
    } catch {
      clearTimeout(wakeTimer);
      setWaking(false);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function init() {
      try {
        const authData = await api.getAuthStatus();
        setAuth(authData);
        if (authData.logged_in) {
          setIsAuthenticated(true);
          await load();
        } else {
          setIsAuthenticated(false);
          setEmails([]); setRules([]);
        }
      } catch {
        setIsAuthenticated(false);
      } finally {
        setAuthChecked(true);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (!authChecked || isAuthenticated) return;
    const id = setInterval(async () => {
      try {
        const a = await api.getAuthStatus();
        setAuth(a);
        if (a.logged_in) { setIsAuthenticated(true); load(); }
      } catch { /* cold start */ }
    }, 5000);
    return () => clearInterval(id);
  }, [authChecked, isAuthenticated]);

  useEffect(() => {
    if (!loading && focusId && emails.length === 0 && !error && retryCount < 3 && isAuthenticated) {
      const t = setTimeout(() => { setRetryCount(c => c + 1); load(); }, 3000);
      return () => clearTimeout(t);
    }
  }, [loading, focusId, emails.length, error, retryCount]);

  useEffect(() => {
    if (focusId && highlightRef.current) {
      setTimeout(() => highlightRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 300);
    }
  }, [emails, focusId]);

  function onUpdate(id, changes) {
    setEmails(prev => prev.map(e => e.gmail_id === id ? { ...e, ...changes } : e));
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

  const isComingFromNotification = Boolean(focusId);
  const hasEmails = emails.length > 0;

  if (!authChecked)     return <BootSpinner message="checking session…" />;
  if (!isAuthenticated) return <Onboarding auth={auth} />;

  const userInitial = (auth?.email || "?").charAt(0).toUpperCase();

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh",
      background: T.bg,
      color: T.text,
      fontFamily: T.sans,
      display: "flex", flexDirection: "column",
    }}>

      {/* Soft radial glow + dot grid */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage:
          "radial-gradient(ellipse at top, rgba(56,189,248,0.05) 0%, transparent 55%)," +
          "radial-gradient(rgba(148,163,184,0.025) 1px, transparent 1px)",
        backgroundSize: "auto, 22px 22px",
      }} />

      {/* ════════════ TOPBAR ════════════ */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(5,11,23,0.78)",
        backdropFilter: "blur(20px) saturate(140%)",
        WebkitBackdropFilter: "blur(20px) saturate(140%)",
        borderBottom: `1px solid ${T.border}`,
        padding: "0 28px", height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
      }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            display: "grid", placeItems: "center",
            background: "linear-gradient(135deg, #38bdf8 0%, #a78bfa 100%)",
            color: "#020617",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 6px 20px -6px rgba(56,189,248,0.5)",
          }}>
            <Icon.bolt />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-0.3px" }}>
              PrYoPort
            </span>
            <span style={{ color: T.textFaint, opacity: 0.6 }}><Icon.slash /></span>
            <span style={{
              fontFamily: T.mono, fontSize: 12, color: T.textDim,
              padding: "2px 8px", borderRadius: 5,
              background: T.bgRaised, border: `1px solid ${T.border}`,
            }}>
              inbox
            </span>
          </div>
        </div>

        {/* Right cluster */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            fontFamily: T.mono, fontSize: 11, color: T.textMute,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            {loading && <MiniSpin color={T.accent} />}
            <span>{loading ? "syncing…" : `synced ${fmtRel(lastLoad)}`}</span>
          </div>

          <button
            onClick={load}
            disabled={loading}
            title="Refresh"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "7px 12px", borderRadius: 7,
              background: T.bgRaised,
              border: `1px solid ${T.border}`,
              color: T.textDim,
              fontFamily: T.mono, fontSize: 11, fontWeight: 600,
              cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.5 : 1,
              transition: "all 160ms ease",
            }}
            className="btnGhost"
          >
            <Icon.refresh /> Refresh
          </button>

          <div style={{ width: 1, height: 22, background: T.border }} />

          {/* User pill */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "4px 12px 4px 4px",
            borderRadius: 999,
            background: T.bgRaised,
            border: `1px solid ${T.border}`,
          }}>
            <div style={{
              position: "relative",
              width: 26, height: 26, borderRadius: "50%",
              display: "grid", placeItems: "center",
              background: "linear-gradient(135deg, #38bdf8 0%, #a78bfa 100%)",
              color: "#020617", fontSize: 12, fontWeight: 800,
            }}>
              {userInitial}
              <span style={{
                position: "absolute", right: -1, bottom: -1,
                width: 9, height: 9, borderRadius: "50%",
                background: auth?.logged_in ? T.green : T.rose,
                boxShadow: `0 0 0 2px ${T.bgRaised}`,
              }} />
            </div>
            <span style={{
              fontFamily: T.mono, fontSize: 11, color: T.textDim, fontWeight: 600,
              maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {auth?.email || "guest"}
            </span>
          </div>
        </div>
      </nav>

      {/* ════════════ SUMMARY STRIP ════════════ */}
      {hasEmails && (
        <div style={{
          position: "relative", zIndex: 1,
          borderBottom: `1px solid ${T.border}`,
          background: "rgba(10,20,36,0.5)",
          padding: "12px 28px",
          display: "flex", alignItems: "center", gap: 10,
          overflowX: "auto",
        }}>
          <Stat label="urgent" count={highCount} color={T.rose}   dim={highCount === 0} />
          <Stat label="medium" count={medCount}  color={T.amber}  dim={medCount === 0} />
          <Stat label="read"   count={readCount} color={T.greenLite} dim={readCount === 0} />
          <Stat label="rules"  count={rules.length} color={T.accent} dim={rules.length === 0} />
          <div style={{ flex: 1 }} />
          <div style={{
            fontFamily: T.mono, fontSize: 10, color: T.textFaint,
            textTransform: "uppercase", letterSpacing: 1.5,
          }}>
            ai · prioritised · real-time
          </div>
        </div>
      )}

      {/* ════════════ MAIN ════════════ */}
      <main style={{
        position: "relative", zIndex: 1,
        width: "100%", maxWidth: 1280,
        margin: "0 auto", padding: "24px 28px 80px",
        flex: 1,
      }}>

        {/* Tabs row */}
        {(hasEmails || tab === "rules") && !loading && (
          <div style={{
            display: "flex", alignItems: "center", gap: 4,
            borderBottom: `1px solid ${T.border}`,
            marginBottom: 24,
            overflowX: "auto",
          }}>
            {[
              { key: "all",    label: "All Unread", count: highCount + medCount },
              { key: "high",   label: "High",       count: highCount, color: T.rose },
              { key: "medium", label: "Medium",     count: medCount,  color: T.amber },
              { key: "read",   label: "Read",       count: readCount, color: T.greenLite },
              { key: "rules",  label: "Rules",      count: rules.length, color: T.accent },
            ].map(({ key, label, count, color }) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className="tabBtn"
                  style={{
                    position: "relative",
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "11px 14px",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: active ? T.text : T.textMute,
                    fontFamily: T.sans, fontSize: 13, fontWeight: 600,
                    transition: "color 160ms ease",
                  }}
                >
                  {label}
                  <span style={{
                    fontFamily: T.mono, fontSize: 11, fontWeight: 700,
                    padding: "1px 7px", borderRadius: 4,
                    background: active
                      ? (color ? `${color}22` : `${T.accent}22`)
                      : T.bgRaised,
                    color: active ? (color || T.accent) : T.textMute,
                    fontVariantNumeric: "tabular-nums",
                  }}>
                    {count}
                  </span>
                  {active && (
                    <span style={{
                      position: "absolute", left: 8, right: 8, bottom: -1, height: 2,
                      background: color || T.accent,
                      borderRadius: 2,
                      boxShadow: `0 0 12px ${color || T.accent}`,
                    }} />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* ════════════ CONTENT STATES ════════════ */}
        {loading ? (
          <div>
            {waking && (
              <div style={{
                marginBottom: 16, padding: "10px 14px",
                background: "rgba(245,158,11,0.08)",
                border: `1px solid rgba(245,158,11,0.25)`,
                borderRadius: 8,
                fontFamily: T.mono, fontSize: 12, color: T.amber,
              }}>
                <span style={{ marginRight: 6 }}>⏳</span>
                cold start — server is waking up (~30s on first visit)
              </div>
            )}
            {isComingFromNotification && retryCount > 0 && (
              <div style={{
                marginBottom: 16, fontFamily: T.mono, fontSize: 12, color: T.textMute,
              }}>
                fetching focused email · retry {retryCount}/3
              </div>
            )}
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))", gap: 14,
            }}>
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          </div>

        ) : error ? (
          <EmptyState
            symbol="!"
            color={T.rose}
            title="Could not reach the server"
            desc="The backend isn't responding. It may be cold-starting or briefly offline."
            cta={{ label: "Try again", onClick: load }}
          />

        ) : !hasEmails && isComingFromNotification ? (
          <EmptyState
            symbol="∅"
            color={T.amber}
            title="Email not found"
            desc="It may have been read or deleted already."
            cta={{
              label: "Back to dashboard",
              onClick: () => { window.history.replaceState({}, "", "/"); load(); },
            }}
          />

        ) : tab === "rules" ? (
          <div>
            <SectionHeader
              eyebrow="rules"
              title="Priority overrides"
              desc="Force-prioritise emails from specific senders. Useful for recruiters, exam boards, deadline reminders."
            />
            <RulesPanel rules={rules} onUpdate={load} />
          </div>

        ) : filtered.length === 0 ? (
          <EmptyState
            symbol="∅"
            color={T.textMute}
            title={`No ${tab === "read" ? "read" : tab} emails`}
            desc="Nothing here right now. New emails will appear as they're synced."
          />

        ) : (
          <div className="cardGrid" style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))",
            gap: 14,
          }}>
            {filtered.map((email, i) => (
              <div
                key={email.gmail_id}
                className="cardFadeIn"
                style={{ animationDelay: `${Math.min(i * 35, 350)}ms` }}
                ref={email.gmail_id === focusId ? highlightRef : null}
              >
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
      {/* ════════════ STATUS BAR (footer) ════════════ */}
      <footer style={{
        position: "sticky", bottom: 0, zIndex: 50,
        background: "rgba(5,11,23,0.85)",
        backdropFilter: "blur(14px)",
        borderTop: `1px solid ${T.border}`,
        padding: "8px 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        fontFamily: T.mono, fontSize: 11, color: T.textFaint,eight: 32,
      }}>
        {/* LEFT SIDE */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{
        width: 6, height: 6, borderRadius: "50%",
        background: auth?.logged_in ? T.green : T.rose,
        boxShadow: `0 0 6px ${auth?.logged_in ? T.green : T.rose}`,
      }} />
      {auth?.logged_in ? "connected" : "disconnected"}
    </span>

    <span style={{ opacity: 0.6 }}>·</span>
    <span>{emails.length} emails cached</span>
    <span style={{ opacity: 0.6 }}>·</span>
    <span>{rules.length} rules</span>

    {/* 🔥 NAV LINKS ADDED HERE */}
    <span style={{ opacity: 0.6 }}>·</span>

    <Link
      to="/"
      style={{
        color: T.textMute,
        textDecoration: "none",
        marginLeft: 4,
      }}
    >
      Inbox
    </Link>

    <span style={{ opacity: 0.4 }}>·</span>

    <Link
      to="/onboarding"
      style={{
        color: T.textMute,
        textDecoration: "none",
      }}
    >
      Setup
    </Link>

    <span style={{ opacity: 0.4 }}>·</span>

    <Link
      to="/privacy"
      style={{
        color: T.textMute,
        textDecoration: "none",
      }}
    >
      Privacy
    </Link>
    <Link
      to="/terms"
      style={{
        color: T.textMute,
        textDecoration: "none",
      }}
    >
      Terms
    </Link>

  </div>

  {/* RIGHT SIDE */}
  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
    <span>last sync · {fmtRel(lastLoad)}</span>
    <span style={{ opacity: 0.6 }}>·</span>
    <span style={{ color: T.accent, fontWeight: 700 }}>PrYoPort v1.0</span>
  </div>

</footer>

      

      {/* ════════════ STYLES ════════════ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

        * { box-sizing: border-box; }
        html, body, #root { background: ${T.bg}; }

        @keyframes spin     { to { transform: rotate(360deg); } }
        @keyframes shimmer  { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
        @keyframes fadeUp   { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }

        .shimmer {
          background: linear-gradient(90deg, #0f1d33 0%, #16263f 50%, #0f1d33 100%) !important;
          background-size: 800px 100%;
          animation: shimmer 1.4s linear infinite;
        }

        .cardFadeIn {
          opacity: 0;
          animation: fadeUp 320ms cubic-bezier(.2,.7,.2,1) forwards;
        }

        .tabBtn:hover { color: ${T.text}; }
        .btnGhost:hover:not(:disabled) {
          color: ${T.text};
          border-color: ${T.borderHi};
          background: ${T.bgCard};
        }

        select option { background: #0a1628; }

        ::-webkit-scrollbar       { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1a2a3a; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #243648; }
      `}</style>
    </div>
  );
}

// ── EMPTY STATE — used for error, "no emails", etc. ─────────────
function EmptyState({ symbol, color, title, desc, cta }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "80px 24px", textAlign: "center", gap: 14,
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 16,
        display: "grid", placeItems: "center",
        background: `${color}10`,
        border: `1px solid ${color}30`,
        color, fontFamily: T.mono, fontSize: 32, fontWeight: 700,
        boxShadow: `0 0 40px -10px ${color}40`,
      }}>
        {symbol}
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginTop: 8 }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: T.textMute, maxWidth: 360, lineHeight: 1.6 }}>
        {desc}
      </div>
      {cta && (
        <button
          onClick={cta.onClick}
          style={{
            marginTop: 10,
            padding: "9px 18px", borderRadius: 8, cursor: "pointer",
            background: `${T.accent}15`,
            border: `1px solid ${T.accent}55`,
            color: T.accent,
            fontFamily: T.mono, fontSize: 12, fontWeight: 700,
            transition: "all 160ms ease",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = `${T.accent}25`; }}
          onMouseLeave={e => { e.currentTarget.style.background = `${T.accent}15`; }}
        >
          {cta.label}
        </button>
      )}
    </div>
  );
}

// ── SECTION HEADER — used in Rules view ─────────────────────────
function SectionHeader({ eyebrow, title, desc }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontFamily: T.mono, fontSize: 10, color: T.accent,
        textTransform: "uppercase", letterSpacing: 2, fontWeight: 700,
        marginBottom: 6,
      }}>
        {eyebrow}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: T.text, marginBottom: 4 }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: T.textMute, maxWidth: 560, lineHeight: 1.6 }}>
        {desc}
      </div>
    </div>
  );
}
