// Onboarding.jsx — cursor-reactive welcome screen
import { useEffect, useRef, useState } from "react";

const mono = { fontFamily: "monospace" };

// ── Floating code symbols ──────────────────────────────
// x/y are %; depth scales repulsion + parallax; drift is the ambient keyframe.
const SYMBOLS = [
  { c: "</>",       x: 6,  y: 14, size: 38, color: "#38bdf8", depth: 1.3, drift: "driftA" },
  { c: "{ }",       x: 92, y: 10, size: 30, color: "#a78bfa", depth: 1.0, drift: "driftB" },
  { c: "=>",        x: 84, y: 28, size: 26, color: "#4ade80", depth: 0.9, drift: "driftC" },
  { c: "&&",        x: 12, y: 32, size: 22, color: "#38bdf8", depth: 0.7, drift: "driftD" },
  { c: "[ ]",       x: 4,  y: 58, size: 26, color: "#a78bfa", depth: 0.8, drift: "driftA" },
  { c: "===",       x: 94, y: 52, size: 22, color: "#4ade80", depth: 0.6, drift: "driftB" },
  { c: "( )",       x: 14, y: 78, size: 24, color: "#38bdf8", depth: 0.7, drift: "driftC" },
  { c: "//",        x: 88, y: 80, size: 28, color: "#a78bfa", depth: 1.1, drift: "driftD" },
  { c: "<App />",   x: 22, y: 6,  size: 18, color: "#64748b", depth: 0.5, drift: "driftA" },
  { c: "useEffect", x: 72, y: 6,  size: 16, color: "#64748b", depth: 0.4, drift: "driftB" },
  { c: "const",     x: 78, y: 88, size: 16, color: "#475569", depth: 0.4, drift: "driftC" },
  { c: "async",     x: 20, y: 92, size: 16, color: "#475569", depth: 0.5, drift: "driftD" },
  { c: "$_",        x: 50, y: 4,  size: 22, color: "#38bdf8", depth: 0.8, drift: "driftA" },
  { c: "||",        x: 46, y: 96, size: 22, color: "#a78bfa", depth: 0.7, drift: "driftB" },
  { c: "?.",        x: 36, y: 22, size: 18, color: "#4ade80", depth: 0.5, drift: "driftC" },
  { c: "++",        x: 64, y: 22, size: 18, color: "#38bdf8", depth: 0.5, drift: "driftD" },
  { c: "/*",        x: 30, y: 50, size: 16, color: "#334155", depth: 0.3, drift: "driftA" },
  { c: "*/",        x: 70, y: 50, size: 16, color: "#334155", depth: 0.3, drift: "driftB" },
  { c: "import",    x: 8,  y: 44, size: 14, color: "#475569", depth: 0.4, drift: "driftC" },
  { c: "return",    x: 90, y: 40, size: 14, color: "#475569", depth: 0.4, drift: "driftD" },
  { c: "<div>",     x: 26, y: 68, size: 16, color: "#64748b", depth: 0.5, drift: "driftA" },
  { c: "</div>",    x: 74, y: 68, size: 16, color: "#64748b", depth: 0.5, drift: "driftB" },
];

// Repulsion: closer cursor pushes the symbol harder.
function computeForce(sx, sy, mx, my, depth) {
  if (mx < 0) return { tx: 0, ty: 0, scale: 1, glow: 0 };
  const dx = sx - mx;
  const dy = sy - my;
  const dist = Math.hypot(dx, dy);
  const RADIUS = 22;                       // % of container
  if (dist >= RADIUS) return { tx: 0, ty: 0, scale: 1, glow: 0 };
  const f = (RADIUS - dist) / RADIUS;      // 0..1
  const nx = dist > 0 ? dx / dist : 0;
  const ny = dist > 0 ? dy / dist : 0;
  return {
    tx:    nx * f * 55 * depth,
    ty:    ny * f * 55 * depth,
    scale: 1 + f * 0.55 * depth,
    glow:  f,
  };
}

function FloatingSymbol({ s, mouse }) {
  const { tx, ty, scale, glow } = computeForce(s.x, s.y, mouse.x, mouse.y, s.depth);
  return (
    <div
      style={{
        position: "absolute",
        top:  `${s.y}%`,
        left: `${s.x}%`,
        pointerEvents: "none",
        transform: "translate(-50%, -50%)",
        zIndex: 1,
      }}
    >
      <div
        className={`floatSym ${s.drift}`}
        style={{
          fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
          fontSize: s.size,
          color: s.color,
          fontWeight: 700,
          opacity: 0.22 + glow * 0.7,
          textShadow: glow > 0
            ? `0 0 ${10 + glow * 22}px ${s.color}, 0 0 ${2 + glow * 6}px ${s.color}`
            : "none",
          transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
          transition: "opacity 180ms ease-out, text-shadow 180ms ease-out",
          willChange: "transform, opacity",
        }}
      >
        {s.c}
      </div>
    </div>
  );
}

export default function Onboarding({ auth }) {
  const containerRef = useRef(null);
  const rafRef       = useRef(null);
  const pendingRef   = useRef({ x: -9999, y: -9999 });
  const [mouse, setMouse] = useState({ x: -9999, y: -9999 });

  // Connection status derived from auth (polled in App.jsx)
  const isConnected = Boolean(auth?.logged_in);
  const userEmail   = auth?.email || "";

  // rAF-throttled mouse tracking, in % of container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const flush = () => {
      setMouse(pendingRef.current);
      rafRef.current = null;
    };

    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      pendingRef.current = {
        x: ((e.clientX - rect.left) / rect.width)  * 100,
        y: ((e.clientY - rect.top)  / rect.height) * 100,
        px: e.clientX - rect.left,
        py: e.clientY - rect.top,
      };
      if (!rafRef.current) rafRef.current = requestAnimationFrame(flush);
    };

    const onLeave = () => {
      pendingRef.current = { x: -9999, y: -9999, px: -9999, py: -9999 };
      if (!rafRef.current) rafRef.current = requestAnimationFrame(flush);
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Hero parallax — tilts text slightly toward cursor.
  const heroTiltX = mouse.x > 0 ? (mouse.y - 50) * 0.08  : 0;
  const heroTiltY = mouse.x > 0 ? (mouse.x - 50) * -0.08 : 0;
  const heroShift = mouse.x > 0 ? (mouse.x - 50) * 0.15  : 0;

  const steps = [
    {
      num: "01",
      icon: "</>",
      title: "Install the Chrome Extension",
      desc: "Download the zip → chrome://extensions → Developer mode → Load unpacked → pick the unzipped folder.",
      action: "https://github.com/NANDINIS898/pryoport/releases/latest/download/pryoport-extension.zip",
      actionLabel: "Download Extension",
      color: "#38bdf8",
      bg: "rgba(56,189,248,0.08)",
      border: "rgba(56,189,248,0.25)",
    },
    {
      num: "02",
      icon: "{}",
      title: "Log in with Google",
      desc: "Click the PrYoPort icon in your Chrome toolbar and sign in with Google to grant Gmail access.",
      action: null,
      actionLabel: null,
      color: "#a78bfa",
      bg: "rgba(167,139,250,0.08)",
      border: "rgba(167,139,250,0.25)",
    },
    {
      num: "03",
      icon: "=>",
      title: "Sync your inbox",
      desc: "Hit Sync. The AI reads your emails, scores them High or Medium, and renders them here in real time.",
      action: null,
      actionLabel: null,
      color: "#4ade80",
      bg: "rgba(74,222,128,0.08)",
      border: "rgba(74,222,128,0.25)",
    },
  ];

  const features = [
    { icon: "</>",   label: "AI priority scoring" },
    { icon: "{}",    label: "Smart rules engine" },
    { icon: "!",     label: "Urgent alerts" },
    { icon: "↗",     label: "Gmail deep links" },
    { icon: "=>",    label: "Multi-agent pipeline" },
    { icon: "⚡",    label: "Groq LLM speed" },
  ];

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 20px",
        textAlign: "center",
        overflow: "hidden",
        background:
          "radial-gradient(ellipse at top, #0a1628 0%, #050b17 55%, #02060d 100%)",
        color: "#dce8f5",
        fontFamily: "'Syne','Segoe UI',sans-serif",
        backgroundImage: `
          radial-gradient(ellipse at top, #0a1628 0%, #050b17 55%, #02060d 100%),
          linear-gradient(rgba(56,189,248,0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(56,189,248,0.025) 1px, transparent 1px)
        `,
        backgroundSize: "auto, 44px 44px, 44px 44px",
      }}
    >
      {/* ── Connection status pill (top-right) ──────── */}
      <div
        style={{
          position: "absolute",
          top: 20,
          right: 24,
          zIndex: 5,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 14px",
          borderRadius: 999,
          background: isConnected
            ? "rgba(34,197,94,0.08)"
            : "rgba(244,63,94,0.06)",
          border: `1px solid ${isConnected ? "rgba(34,197,94,0.35)" : "rgba(244,63,94,0.3)"}`,
          backdropFilter: "blur(8px)",
          fontFamily: "monospace",
          fontSize: 11,
          color: isConnected ? "#4ade80" : "#fb7185",
          fontWeight: 700,
          letterSpacing: 0.5,
          boxShadow: isConnected
            ? "0 0 20px -6px rgba(34,197,94,0.5)"
            : "0 0 20px -10px rgba(244,63,94,0.4)",
          transition: "all 240ms ease",
        }}
      >
        <span
          className="statusDot"
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: isConnected ? "#22c55e" : "#f43f5e",
            boxShadow: `0 0 10px ${isConnected ? "#22c55e" : "#f43f5e"}`,
          }}
        />
        {isConnected
          ? `EXTENSION CONNECTED${userEmail ? ` · ${userEmail}` : ""}`
          : "EXTENSION NOT CONNECTED"}
      </div>

      {/* ── Cursor aura ─────────────────────────────── */}
      {mouse.x > 0 && (
        <div
          style={{
            position: "absolute",
            top:  mouse.py - 200,
            left: mouse.px - 200,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(56,189,248,0.18) 0%, rgba(167,139,250,0.08) 35%, transparent 70%)",
            pointerEvents: "none",
            zIndex: 0,
            filter: "blur(8px)",
            transition: "opacity 200ms ease-out",
          }}
        />
      )}

      {/* ── Floating code symbols ───────────────────── */}
      {SYMBOLS.map((s, i) => (
        <FloatingSymbol key={i} s={s} mouse={mouse} />
      ))}

      {/* ── Scanline overlay ────────────────────────── */}
      <div
        style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
          backgroundImage:
            "linear-gradient(rgba(56,189,248,0.025) 1px, transparent 1px)",
          backgroundSize: "100% 4px",
          mixBlendMode: "screen",
          opacity: 0.4,
        }}
      />

      {/* ── HERO ────────────────────────────────────── */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          marginBottom: 56,
          transform: `perspective(900px) rotateX(${heroTiltX}deg) rotateY(${heroTiltY}deg) translateX(${heroShift}px)`,
          transition: "transform 240ms cubic-bezier(.2,.7,.2,1)",
          willChange: "transform",
        }}
      >
        {/* terminal-style status line */}
        <div style={{
          ...mono, fontSize: 11, color: "#38bdf8", letterSpacing: 2,
          marginBottom: 16, opacity: 0.7,
        }}>
          <span style={{ color: "#4ade80" }}>$</span> npx pryoport
          <span className="caret"> █</span>
        </div>

        <h1 style={{
          fontSize: "clamp(34px, 6vw, 56px)",
          fontWeight: 900,
          letterSpacing: "-2px",
          margin: "0 0 14px",
          lineHeight: 1.05,
        }}>
          <span style={{ color: "#475569", fontFamily: "monospace" }}>{"<"}</span>
          <span style={{
            background: "linear-gradient(135deg, #e2e8f0 0%, #38bdf8 50%, #a78bfa 100%)",
            backgroundSize: "200% 200%",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: "gradShift 6s ease-in-out infinite",
          }}>
            Welcome to PrYoPort
          </span>
          <span style={{ color: "#475569", fontFamily: "monospace" }}>{" />"}</span>
        </h1>

        <p style={{
          color: "#64748b",
          fontSize: 15,
          maxWidth: 520,
          margin: "0 auto",
          lineHeight: 1.7,
          fontFamily: "monospace",
        }}>
          <span style={{ color: "#475569" }}>{"/* "}</span>
          Your AI-powered Gmail command centre. Get started in 3 steps — less than 2 minutes.
          <span style={{ color: "#475569" }}>{" */"}</span>
        </p>
      </div>

      {/* ── STEPS ───────────────────────────────────── */}
      <div style={{
        position: "relative",
        zIndex: 2,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 18,
        width: "100%",
        maxWidth: 960,
        marginBottom: 56,
      }}>
        {steps.map((s, i) => (
          <StepCard key={i} s={s} mouse={mouse} containerRef={containerRef} />
        ))}
      </div>

      {/* ── FEATURE PILLS ───────────────────────────── */}
      <div style={{ position: "relative", zIndex: 2, marginBottom: 36 }}>
        <p style={{
          ...mono, fontSize: 10, color: "#334155", letterSpacing: 2,
          textTransform: "uppercase", marginBottom: 14,
        }}>
          <span style={{ color: "#475569" }}>// </span>
          What you get
        </p>
        <div style={{
          display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center",
          maxWidth: 720,
        }}>
          {features.map((f, i) => (
            <div key={i} className="featurePill" style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 20,
              padding: "7px 14px",
              fontSize: 12,
              color: "#94a3b8",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "all 200ms ease",
              cursor: "default",
            }}>
              <span style={{ fontFamily: "monospace", color: "#38bdf8", fontWeight: 700 }}>
                {f.icon}
              </span>
              <span style={{ fontFamily: "monospace" }}>{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── FOOTER HINT ─────────────────────────────── */}
      <p style={{
        position: "relative", zIndex: 2,
        color: "#334155", fontSize: 12, fontFamily: "monospace",
      }}>
        <span style={{ color: "#475569" }}>{">"}</span> Already installed?
        Click <strong style={{ color: "#38bdf8" }}>Sync</strong> in the extension to load your emails.
      </p>

      {/* ── ANIMATIONS ──────────────────────────────── */}
      <style>{`
        @keyframes driftA {
          0%,100% { translate: 0 0; }
          50%     { translate: 6px -8px; }
        }
        @keyframes driftB {
          0%,100% { translate: 0 0; }
          50%     { translate: -10px 6px; }
        }
        @keyframes driftC {
          0%,100% { translate: 0 0; }
          50%     { translate: 8px 10px; }
        }
        @keyframes driftD {
          0%,100% { translate: 0 0; }
          50%     { translate: -7px -10px; }
        }
        .driftA { animation: driftA 7s ease-in-out infinite; }
        .driftB { animation: driftB 9s ease-in-out infinite; }
        .driftC { animation: driftC 8s ease-in-out infinite; }
        .driftD { animation: driftD 10s ease-in-out infinite; }

        @keyframes gradShift {
          0%,100% { background-position: 0% 50%; }
          50%     { background-position: 100% 50%; }
        }

        @keyframes blinkCaret {
          0%,49% { opacity: 1; }
          50%,100% { opacity: 0; }
        }
        .caret { animation: blinkCaret 1s steps(1) infinite; color: #38bdf8; }

        .featurePill:hover {
          background: rgba(56,189,248,0.08) !important;
          border-color: rgba(56,189,248,0.3) !important;
          color: #e2e8f0 !important;
          transform: translateY(-2px);
        }

        .stepCard {
          transition: transform 220ms cubic-bezier(.2,.7,.2,1),
                      box-shadow 220ms ease, border-color 220ms ease;
          will-change: transform;
        }

        @keyframes statusPulse {
          0%,100% { transform: scale(1);   opacity: 1;   }
          50%     { transform: scale(1.3); opacity: 0.6; }
        }
        .statusDot { animation: statusPulse 1.6s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

// ── Step card with magnetic 3D tilt toward cursor ────
function StepCard({ s, mouse, containerRef }) {
  const cardRef = useRef(null);
  const [local, setLocal] = useState({ tx: 0, ty: 0, lift: 0, hover: false });

  useEffect(() => {
    if (!cardRef.current || !containerRef.current) return;
    if (mouse.x < 0) {
      setLocal({ tx: 0, ty: 0, lift: 0, hover: false });
      return;
    }

    const cardRect = cardRef.current.getBoundingClientRect();
    const contRect = containerRef.current.getBoundingClientRect();

    // cursor pos in card-local px
    const cx = (mouse.x / 100) * contRect.width;
    const cy = (mouse.y / 100) * contRect.height;
    const localX = cx - (cardRect.left - contRect.left);
    const localY = cy - (cardRect.top  - contRect.top);

    const w = cardRect.width;
    const h = cardRect.height;
    const inside = localX >= 0 && localX <= w && localY >= 0 && localY <= h;

    if (inside) {
      const nx = (localX / w) - 0.5;  // -0.5..0.5
      const ny = (localY / h) - 0.5;
      setLocal({ tx: ny * -10, ty: nx * 10, lift: 1, hover: true });
    } else {
      setLocal({ tx: 0, ty: 0, lift: 0, hover: false });
    }
  }, [mouse, containerRef]);

  return (
    <div
      ref={cardRef}
      className="stepCard"
      style={{
        background: s.bg,
        border: `1px solid ${local.hover ? s.color + "66" : s.border}`,
        borderRadius: 16,
        padding: "30px 26px",
        textAlign: "left",
        position: "relative",
        overflow: "hidden",
        transform: `perspective(900px) rotateX(${local.tx}deg) rotateY(${local.ty}deg) translateY(${local.lift * -6}px)`,
        boxShadow: local.hover
          ? `0 22px 60px -20px ${s.color}55, 0 0 0 1px ${s.color}22`
          : "0 6px 24px -16px rgba(0,0,0,0.4)",
      }}
    >
      {/* shine that follows the cursor when inside */}
      {local.hover && (
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: `radial-gradient(180px circle at ${(0.5 + local.ty / 20) * 100}% ${(0.5 - local.tx / 20) * 100}%, ${s.color}22, transparent 60%)`,
        }} />
      )}

      <div style={{
        ...mono, fontSize: 11, fontWeight: 700, color: s.color,
        letterSpacing: 2, marginBottom: 14, opacity: 0.85,
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{
          display: "inline-block", width: 6, height: 6, borderRadius: "50%",
          background: s.color, boxShadow: `0 0 10px ${s.color}`,
        }} />
        STEP {s.num}
      </div>

      <div style={{
        display: "flex", alignItems: "center", gap: 12, marginBottom: 14,
      }}>
        <span style={{
          fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
          fontSize: 22, fontWeight: 800, color: s.color,
          background: `${s.color}15`,
          border: `1px solid ${s.color}33`,
          padding: "4px 10px", borderRadius: 8,
          textShadow: local.hover ? `0 0 12px ${s.color}` : "none",
          transition: "text-shadow 200ms",
        }}>
          {s.icon}
        </span>
        <span style={{ fontWeight: 800, fontSize: 15, color: "#e2e8f0" }}>
          {s.title}
        </span>
      </div>

      <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.7, margin: 0 }}>
        {s.desc}
      </p>

      {s.actionLabel && (
        <a
          href={s.action}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            marginTop: 18,
            padding: "10px 18px",
            background: local.hover ? s.color + "22" : s.bg,
            border: `1px solid ${s.color}55`,
            borderRadius: 8,
            color: s.color,
            fontSize: 12, fontWeight: 700,
            fontFamily: "monospace",
            textDecoration: "none",
            letterSpacing: 0.5,
            cursor: "pointer",
            transition: "all 200ms ease",
            boxShadow: local.hover ? `0 0 24px -6px ${s.color}88` : "none",
          }}
        >
          <span style={{ opacity: 0.7 }}>$</span> {s.actionLabel}
        </a>
      )}
    </div>
  );
}
