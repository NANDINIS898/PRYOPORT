import React from "react";

export default function Terms() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0b1120",
        color: "#e2e8f0",
        padding: "40px 20px",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          maxWidth: "800px",
          width: "100%",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "16px",
          padding: "30px",
          backdropFilter: "blur(10px)",
        }}
      >
        <h1 style={{ fontSize: "28px", marginBottom: "20px" }}>
          Terms & Disclaimer
        </h1>

        <p style={{ marginBottom: "16px", lineHeight: 1.6 }}>
          Welcome to <strong>PrYoPort</strong>. This page explains the basic
          usage disclaimer for the platform.
        </p>

        <h2 style={{ fontSize: "20px", marginTop: "20px" }}>
          Disclaimer
        </h2>

        <ul style={{ lineHeight: 1.8, marginTop: "10px" }}>
          <li>AI predictions may be inaccurate.</li>
          <li>Users should verify important emails manually.</li>
          <li>
            PrYoPort assists with prioritization only and does not guarantee
            correctness of email classification.
          </li>
        </ul>

        <h2 style={{ fontSize: "20px", marginTop: "20px" }}>
          User Responsibility
        </h2>

        <p style={{ marginTop: "10px", lineHeight: 1.6 }}>
          Users are responsible for reviewing all critical emails such as
          internship, interview, or financial messages before taking action.
        </p>

        <div
          style={{
            marginTop: "30px",
            fontSize: "14px",
            opacity: 0.7,
            borderTop: "1px solid rgba(255,255,255,0.1)",
            paddingTop: "15px",
          }}
        >
          © {new Date().getFullYear()} PrYoPort. All rights reserved.
        </div>
      </div>
    </div>
  );
}