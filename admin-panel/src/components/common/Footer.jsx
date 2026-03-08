import React from "react";

export default function Footer() {
  return (
    <footer style={{
      borderTop: "1px solid #1E293B",
      padding: "32px 24px",
      textAlign: "center",
      background: "#000000",
      marginTop: "auto"
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={{ fontSize: 13, color: "#94A3B8", margin: 0, fontWeight: 500 }}>
          © 2026 EMS.plus · Smart Mobile Electricity Monitoring System 
        </p>
      </div>
    </footer>
  );
}
