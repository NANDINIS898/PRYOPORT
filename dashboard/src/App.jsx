import { useState, useEffect, useRef } from "react";
import { api } from "./api";
import EmailCard from "./Emailcard";
import RulesPanel from "./Rulespanel";
import Onboarding from "./Onboarding";

function getFocusId() {
  return new URLSearchParams(window.location.search).get("id");
}

// ── SPINNER ─────────────────────────────────────────────────────
function Spinner({ message }) {
  return (
    <div style={{ textAlign: "center", padding: 80, color: "#4a6080" }}>
      <div
        style={{
          fontSize: 32,
          marginBottom: 14,
          display: "inline-block",
          animation: "spin 1.2s linear infinite",
        }}
      >
        ⚡
      </div>

      <div
        style={{
          fontSize: 13,
          fontFamily: "monospace",
          color: "#4a6080",
        }}
      >
        {message}
      </div>
    </div>
  );
}

// ── APP ─────────────────────────────────────────────────────────
export default function App() {
  const [emails, setEmails] = useState([]);
  const [rules, setRules] = useState([]);
  const [tab, setTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [waking, setWaking] = useState(false);
  const [auth, setAuth] = useState(null);

  const focusId = getFocusId();
  const highlightRef = useRef(null);

  async function load() {
    setLoading(true);
    setError(false);

    const wakeTimer = setTimeout(() => {
      setWaking(true);
    }, 4000);

    try {
      const [dash, authData] = await Promise.all([
        api.getDashboard(),
        api.getAuthStatus(),
      ]);

      console.log("AUTH DATA:", authData);
      console.log("DASH DATA:", dash);

      clearTimeout(wakeTimer);
      setWaking(false);

      setEmails(dash.emails || []);
      setRules(dash.rules || []);
      setAuth(authData);

    } catch (err) {
      console.log(err);

      clearTimeout(wakeTimer);
      setWaking(false);

      setError(true);

    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // ── SCROLL TO NOTIFICATION EMAIL ─────────────────────────────
  useEffect(() => {

    if (focusId && highlightRef.current) {

      setTimeout(() => {

        highlightRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

      }, 500);
    }

  }, [emails, focusId]);

  function onUpdate(id, changes) {

    setEmails((prev) =>
      prev.map((e) =>
        e.gmail_id === id
          ? { ...e, ...changes }
          : e
      )
    );
  }

  function onDelete(id) {

    setEmails((prev) =>
      prev.filter((e) => e.gmail_id !== id)
    );
  }

  const filtered = emails.filter((e) => {

    if (tab === "all")
      return e.is_read !== 1;

    if (tab === "high")
      return e.priority === "high" && e.is_read !== 1;

    if (tab === "medium")
      return e.priority === "medium" && e.is_read !== 1;

    if (tab === "read")
      return e.is_read === 1;

    return true;
  });

  const highCount = emails.filter(
    (e) =>
      e.priority === "high" &&
      e.is_read !== 1
  ).length;

  const medCount = emails.filter(
    (e) =>
      e.priority === "medium" &&
      e.is_read !== 1
  ).length;

  const readCount = emails.filter(
    (e) =>
      e.is_read === 1
  ).length;

  const hasEmails = emails.length > 0;

  const mono = {
    fontFamily: "monospace",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050b17",
        color: "#dce8f5",
        fontFamily: "'Syne','Segoe UI',sans-serif",
      }}
    >

      {/* GRID */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          backgroundImage:
            "linear-gradient(rgba(56,189,248,0.012) 1px,transparent 1px),linear-gradient(90deg,rgba(56,189,248,0.012) 1px,transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* TOPBAR */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(5,11,23,0.92)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "0 32px",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 22 }}>
            ⚡
          </span>

          <div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 800,
              }}
            >
              PrYoPort
            </div>

            <div
              style={{
                ...mono,
                fontSize: 10,
                color: "#38bdf8",
              }}
            >
              COMMAND CENTER
            </div>
          </div>
        </div>

        {auth && (
          <div
            style={{
              ...mono,
              fontSize: 11,
              color: auth.logged_in
                ? "#22c55e"
                : "#f43f5e",
            }}
          >
            {auth.logged_in
              ? `🟢 ${auth.email || "Connected"}`
              : "🔴 Not Connected"}
          </div>
        )}
      </nav>

      {/* MAIN */}
      <main
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1200,
          margin: "0 auto",
          padding: "28px 32px 60px",
        }}
      >

        {/* LOADING */}
        {loading ? (

          <Spinner
            message={
              waking
                ? "Server waking up..."
                : "Connecting..."
            }
          />

        ) : error ? (

          <div
            style={{
              textAlign: "center",
              padding: 80,
            }}
          >
            <div
              style={{
                fontSize: 36,
                marginBottom: 12,
              }}
            >
              ⚠️
            </div>

            <div
              style={{
                ...mono,
                color: "#f43f5e",
                marginBottom: 20,
              }}
            >
              Could not reach backend
            </div>

            <button
              onClick={load}
            >
              Retry
            </button>
          </div>

        ) : !auth?.logged_in ? (

          <Onboarding />

        ) : !hasEmails ? (

          <div
            style={{
              textAlign: "center",
              padding: 80,
              color: "#4a6080",
            }}
          >
            <div
              style={{
                fontSize: 42,
                marginBottom: 16,
              }}
            >
              📭
            </div>

            <div
              style={{
                ...mono,
                marginBottom: 12,
              }}
            >
              Inbox connected successfully
            </div>

            <div
              style={{
                ...mono,
                fontSize: 12,
              }}
            >
              Waiting for priority emails...
            </div>

            <button
              onClick={load}
              style={{
                marginTop: 20,
              }}
            >
              Refresh Inbox
            </button>
          </div>

        ) : tab === "rules" ? (

          <RulesPanel
            rules={rules}
            onUpdate={load}
          />

        ) : filtered.length === 0 ? (

          <div
            style={{
              textAlign: "center",
              padding: 80,
            }}
          >
            <div
              style={{
                fontSize: 36,
                marginBottom: 12,
              }}
            >
              📭
            </div>

            <div style={mono}>
              No emails
            </div>
          </div>

        ) : (

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill,minmax(360px,1fr))",
              gap: 14,
            }}
          >
            {filtered.map((email) => (

              <div
                key={email.gmail_id}
                ref={
                  email.gmail_id === focusId
                    ? highlightRef
                    : null
                }
              >

                <EmailCard
                  email={email}
                  highlighted={
                    email.gmail_id === focusId
                  }
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                />

              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}