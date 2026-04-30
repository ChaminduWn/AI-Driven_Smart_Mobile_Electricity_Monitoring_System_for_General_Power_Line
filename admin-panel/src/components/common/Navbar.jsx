import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from '../../contexts/AuthContext';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [scrollY, setScrollY] = useState(0);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

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

        <div style={{ display: "flex", gap: 4, alignItems: "center", position: 'relative' }}>
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

          {user ? (
            <>
              <button
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: '#1d4ed8',
                  color: 'white',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                }}
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              >
                {(user?.full_name || user?.name || user?.email || 'U')[0].toUpperCase()}
              </button>
              {profileMenuOpen && (
                <div style={{
                  position: 'absolute', top: 54, right: 0,
                  background: '#0f172a', borderRadius: 12,
                  boxShadow: '0 18px 40px rgba(15,23,42,0.35)',
                  border: '1px solid rgba(148,163,184,0.16)',
                  overflow: 'hidden',
                  minWidth: 180,
                  zIndex: 200,
                }}>
                  <button onClick={() => { setProfileMenuOpen(false); navigate('/profile'); }} style={{
                    width: '100%', textAlign: 'left', padding: '12px 16px', border: 'none', background: 'transparent', color: 'white', cursor: 'pointer'
                  }}>
                    Profile
                  </button>
                  <button onClick={async () => { setProfileMenuOpen(false); await logout(); navigate('/'); }} style={{
                    width: '100%', textAlign: 'left', padding: '12px 16px', border: 'none', background: 'transparent', color: 'white', cursor: 'pointer'
                  }}>
                    Logout
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <button style={{
                background: "none", border: "1px solid rgba(255,255,255,0.18)", cursor: "pointer",
                padding: "9px 18px", borderRadius: 8, fontSize: 14,
                fontWeight: 600, color: "white",
                transition: "all 0.2s",
              }}
              onClick={() => navigate('/login')}
              >Login</button>
              <button style={{
                background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
                border: "none", cursor: "pointer",
                padding: "9px 20px", borderRadius: 10, fontSize: 14,
                fontWeight: 600, color: "white",
                boxShadow: "0 4px 12px rgba(37,99,235,0.3)",
              }}
              onClick={() => navigate('/register')}
              >Register</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
