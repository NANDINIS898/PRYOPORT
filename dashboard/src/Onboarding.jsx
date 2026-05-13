// Onboarding.jsx — place this in frontend/src/Onboarding.jsx

export default function Onboarding() {
  const mono = { fontFamily: "monospace" };

  const steps = [
    {
  num: "01",
  icon: "🧩",
  title: "Install the Chrome Extension",
  desc: "Download the extension zip, unzip it, then open chrome://extensions → turn on Developer mode → Load unpacked → select the unzipped folder.",
  action: "https://github.com/NANDINIS898/pryoport/releases/latest/download/pryoport-extension.zip",
  actionLabel: "Download Extension",
  color: "#38bdf8",
  bg: "rgba(56,189,248,0.08)",
  border: "rgba(56,189,248,0.2)",
},
   
    {
      num: "02",
      icon: "🔐",
      title: "Log in with Google",
      desc: "Click the PrYoPort extension icon in your Chrome toolbar and sign in with your Google account to grant Gmail access.",
      action: null,
      actionLabel: null,
      color: "#a78bfa",
      bg: "rgba(167,139,250,0.08)",
      border: "rgba(167,139,250,0.2)",
    },
    {
      num: "03",
      icon: "⚡",
      title: "Sync your inbox",
      desc: "Hit Sync in the extension. PrYoPort's AI will read your emails, prioritise them as High or Medium, and display them here.",
      action: null,
      actionLabel: null,
      color: "#4ade80",
      bg: "rgba(74,222,128,0.08)",
      border: "rgba(74,222,128,0.2)",
    },
  ];

  const features = [
    { icon: "🔥", label: "AI priority scoring" },
    { icon: "📋", label: "Smart rules engine" },
    { icon: "🔔", label: "Urgent alerts" },
    { icon: "📨", label: "Gmail deep links" },
    { icon: "🤖", label: "CrewAI agents" },
    { icon: "⚡", label: "Groq LLM speed" },
  ];

  return (
    <div style={{
      minHeight: "80vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 20px",
      textAlign: "center",
    }}>

      {/* Hero */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ fontSize: 52, marginBottom: 12,
          filter: "drop-shadow(0 0 24px rgba(56,189,248,0.5))" }}>⚡</div>
        <h1 style={{
          fontSize: "clamp(28px, 5vw, 42px)",
          fontWeight: 900,
          letterSpacing: "-1.5px",
          margin: "0 0 12px",
          background: "linear-gradient(135deg, #e2e8f0 0%, #38bdf8 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          Welcome to PrYoPort
        </h1>
        <p style={{
          color: "#64748b",
          fontSize: 16,
          maxWidth: 480,
          margin: "0 auto",
          lineHeight: 1.7,
        }}>
          Your AI-powered Gmail command centre. Get started in 3 steps — it takes less than 2 minutes.
        </p>
      </div>

      {/* Steps */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: 16,
        width: "100%",
        maxWidth: 900,
        marginBottom: 48,
      }}>
        {steps.map((s, i) => (
          <div key={i} style={{
            background: s.bg,
            border: `1px solid ${s.border}`,
            borderRadius: 14,
            padding: "28px 24px",
            textAlign: "left",
            position: "relative",
            transition: "transform 0.2s",
          }}
          onMouseEnter={e => e.currentTarget.style.transform = "translateY(-3px)"}
          onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
          >
            {/* Step number */}
            <div style={{
              ...mono,
              fontSize: 11,
              fontWeight: 700,
              color: s.color,
              letterSpacing: 2,
              marginBottom: 12,
              opacity: 0.7,
            }}>
              STEP {s.num}
            </div>

            {/* Icon + title */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 26 }}>{s.icon}</span>
              <span style={{ fontWeight: 800, fontSize: 15, color: "#e2e8f0" }}>{s.title}</span>
            </div>

            {/* Description */}
            <p style={{ color: "#64748b", fontSize: 13, lineHeight: 1.7, margin: 0 }}>
              {s.desc}
            </p>

            {/* Action button */}
            {s.actionLabel && (
              <a
                href={s.action || "#"}
                style={{
                  display: "inline-block",
                  marginTop: 16,
                  padding: "8px 18px",
                  background: s.bg,
                  border: `1px solid ${s.border}`,
                  borderRadius: 8,
                  color: s.color,
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: "monospace",
                  textDecoration: "none",
                  letterSpacing: 0.5,
                  cursor: s.action ? "pointer" : "default",
                  opacity: s.action ? 1 : 0.5,
                }}
              >
                {s.action ? s.actionLabel : "Coming soon"}
              </a>
            )}

            {/* Connector dot */}
            {i < steps.length - 1 && (
              <div style={{
                position: "absolute",
                right: -9,
                top: "50%",
                transform: "translateY(-50%)",
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: s.color,
                opacity: 0.4,
                zIndex: 1,
                display: "none", // hidden on mobile, shown on larger screens via CSS
              }} />
            )}
          </div>
        ))}
      </div>

      {/* Feature pills */}
      <div style={{ marginBottom: 40 }}>
        <p style={{ ...mono, fontSize: 10, color: "#334155", letterSpacing: 2,
          textTransform: "uppercase", marginBottom: 14 }}>
          — What you get —
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
          {features.map((f, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 20,
              padding: "6px 14px",
              fontSize: 12,
              color: "#94a3b8",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}>
              <span>{f.icon}</span>
              <span style={{ fontFamily: "monospace" }}>{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Already have extension hint */}
      <p style={{ color: "#1e3a52", fontSize: 12, fontFamily: "monospace" }}>
        Already installed the extension? Click <strong style={{ color: "#38bdf8" }}>Sync</strong> in the extension to load your emails here.
      </p>

    </div>
  );
}