// CursorField.jsx — reusable floating-symbol layer that reacts to the cursor.
// Tracks mouse on the window (viewport coords), so the layer can sit inside
// a `position: fixed` wrapper and ignore layout entirely.
import { useEffect, useRef, useState } from "react";

function computeForce(sx, sy, mx, my, depth, radius, strength, globalStrength) {
  if (mx < 0) return { tx: 0, ty: 0, scale: 1, glow: 0 };

  // Global anti-parallax — every shape slides opposite to where the cursor
  // is relative to the centre of the viewport. Cursor right → shape left.
  const gx = -((mx - 50) / 50) * globalStrength * depth;
  const gy = -((my - 50) / 50) * globalStrength * depth;

  // Local repulsion — extra scatter + glow when the cursor is *near* a shape.
  const dx = sx - mx;
  const dy = sy - my;
  const dist = Math.hypot(dx, dy);
  if (dist >= radius) return { tx: gx, ty: gy, scale: 1, glow: 0 };
  const f  = (radius - dist) / radius;
  const nx = dist > 0 ? dx / dist : 0;
  const ny = dist > 0 ? dy / dist : 0;
  return {
    tx:    gx + nx * f * strength * depth,
    ty:    gy + ny * f * strength * depth,
    scale: 1 + f * 0.4 * depth,
    glow:  f,
  };
}

function Shape({ s, mouse, radius, strength, globalStrength }) {
  const { tx, ty, scale, glow } = computeForce(
    s.x, s.y, mouse.x, mouse.y, s.depth, radius, strength, globalStrength
  );
  return (
    <div style={{
      position: "absolute",
      top:  `${s.y}%`,
      left: `${s.x}%`,
      pointerEvents: "none",
      transform: "translate(-50%, -50%)",
    }}>
      {/* outer = ambient drift (uses CSS `translate` prop) */}
      <div className={s.drift}>
        {/* middle = optional spin (uses CSS `rotate` prop — composes with drift) */}
        <div
          className={s.spin ? "cfSpin" : ""}
          style={{ display: "inline-block" }}
        >
          {/* inner = cursor reaction (transform — applies last) */}
          <div
            style={{
              fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
              fontSize: s.size,
              color: s.color,
              fontWeight: s.weight ?? 700,
              opacity: (s.baseOpacity ?? 0.2) + glow * 0.6,
              textShadow: glow > 0
                ? `0 0 ${6 + glow * 18}px ${s.color}, 0 0 ${2 + glow * 4}px ${s.color}`
                : "none",
              transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
              transition: "opacity 200ms ease-out, text-shadow 200ms ease-out",
              willChange: "transform, opacity",
            }}
          >
            {s.c}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CursorField({
  shapes,
  radius = 18,
  strength = 30,
  globalStrength = 60,   // px max anti-parallax offset (× shape.depth)
}) {
  const rafRef     = useRef(null);
  const pendingRef = useRef({ x: -9999, y: -9999 });
  const [mouse, setMouse] = useState({ x: -9999, y: -9999 });

  useEffect(() => {
    const flush = () => { setMouse(pendingRef.current); rafRef.current = null; };
    const onMove = (e) => {
      pendingRef.current = {
        x: (e.clientX / window.innerWidth)  * 100,
        y: (e.clientY / window.innerHeight) * 100,
      };
      if (!rafRef.current) rafRef.current = requestAnimationFrame(flush);
    };
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      pointerEvents: "none",
      zIndex: 0,
      overflow: "hidden",
    }}>
      {shapes.map((s, i) => (
        <Shape key={i} s={s} mouse={mouse} radius={radius} strength={strength} globalStrength={globalStrength} />
      ))}
      <style>{`
        @keyframes cfDriftA { 0%,100%{translate:0 0} 50%{translate:8px -10px} }
        @keyframes cfDriftB { 0%,100%{translate:0 0} 50%{translate:-12px 8px} }
        @keyframes cfDriftC { 0%,100%{translate:0 0} 50%{translate:10px 12px} }
        @keyframes cfDriftD { 0%,100%{translate:0 0} 50%{translate:-9px -12px} }
        .cfDriftA { animation: cfDriftA 7s  ease-in-out infinite; }
        .cfDriftB { animation: cfDriftB 9s  ease-in-out infinite; }
        .cfDriftC { animation: cfDriftC 8s  ease-in-out infinite; }
        .cfDriftD { animation: cfDriftD 10s ease-in-out infinite; }

        @keyframes cfSpin { to { rotate: 360deg; } }
        .cfSpin { animation: cfSpin 18s linear infinite; }
      `}</style>
    </div>
  );
}
