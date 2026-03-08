import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navScrolled = scrollY > 20 || location.pathname !== "/"; // Always solid on non-home pages

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      padding: "0 24px",
      background: navScrolled ? "#000000" : "transparent",
      backdropFilter: navScrolled ? "blur(20px)" : "none",
      borderBottom: navScrolled ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
      transition: "all 0.3s ease",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", height: 68 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, cursor: "pointer" }} onClick={() => navigate("/")}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(37,99,235,0.3)",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M13 2L4.09 12.26a1 1 0 00.9 1.74H12l-1 8 8.91-10.26a1 1 0 00-.9-1.74H13l1-8z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.5px", color: navScrolled ? "white" : "#0F172A", transition: "color 0.3s ease" }}>
            EMS<span style={{ color: "#2563EB" }}>CORE</span>
          </span>
        </div>

        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {["Solutions", "Technology", "Pricing"].map(item => (
            <button key={item} style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "8px 16px", borderRadius: 8, fontSize: 14,
              fontWeight: 500, color: navScrolled ? "#CBD5E1" : "#475569",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.target.style.color = "#2563EB"; e.target.style.background = navScrolled ? "rgba(255,255,255,0.1)" : "rgba(37,99,235,0.06)"; }}
            onMouseLeave={e => { e.target.style.color = navScrolled ? "#CBD5E1" : "#475569"; e.target.style.background = "none"; }}
            >{item}</button>
          ))}
          <div style={{ width: 1, height: 20, background: navScrolled ? "#334155" : "#E2E8F0", margin: "0 8px", transition: "background 0.3s ease" }}/>
          <button style={{
            background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
            border: "none", cursor: "pointer",
            padding: "9px 20px", borderRadius: 10, fontSize: 14,
            fontWeight: 600, color: "white",
            boxShadow: "0 4px 12px rgba(37,99,235,0.3)",
            transition: "all 0.2s",
          }}
          onClick={() => navigate("/d")}
          onMouseEnter={e => e.target.style.boxShadow = "0 6px 20px rgba(37,99,235,0.45)"}
          onMouseLeave={e => e.target.style.boxShadow = "0 4px 12px rgba(37,99,235,0.3)"}
          >Launch App →</button>
        </div>
      </div>
    </nav>
  );
}
