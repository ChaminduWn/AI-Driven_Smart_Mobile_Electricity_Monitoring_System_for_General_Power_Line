import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const features = [
  {
    title: "Energy Analysis",
    route: "/Energy Analysis",
    description: "AI-driven bill prediction and NILM energy disaggregation to track every watt in real time.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28">
        <path d="M3 13.5L7.5 9l3 3L15 7.5l4.5 4.5" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="3" y="3" width="18" height="18" rx="3" strokeLinecap="round"/>
      </svg>
    ),
    color: "#2563EB",
    glow: "rgba(37,99,235,0.2)",
    accent: "rgba(37,99,235,0.08)",
    lightBg: "rgba(37,99,235,0.04)",
  },
  {
    title: "Outage Tracking",
    route: "/Outage Tracking",
    description: "Real-time fault detection with GPS-enabled technician dispatching for zero downtime.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28">
        <path d="M13 2L4.09 12.26a1 1 0 00.9 1.74H12l-1 8 8.91-10.26a1 1 0 00-.9-1.74H13l1-8z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    color: "#7C3AED",
    glow: "rgba(124,58,237,0.2)",
    accent: "rgba(124,58,237,0.08)",
    lightBg: "rgba(124,58,237,0.04)",
  },
  {
    title: "Solar Intelligence",
    route: "/Solar Intelligence",
    description: "Climate-aware ROI prediction and system sizing for maximum sustainable energy output.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28">
        <circle cx="12" cy="12" r="4"/>
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round"/>
      </svg>
    ),
    color: "#059669",
    glow: "rgba(5,150,105,0.2)",
    accent: "rgba(5,150,105,0.08)",
    lightBg: "rgba(5,150,105,0.04)",
  },
  {
    title: "Safety Assistant",
    route: "/Safety Assistant",
    description: "Natural Language AI for emergency protocols, risk mitigation and automated alerts.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    color: "#D97706",
    glow: "rgba(217,119,6,0.2)",
    accent: "rgba(217,119,6,0.08)",
    lightBg: "rgba(217,119,6,0.04)",
  },
];

const stats = [
  { value: "98.7%", label: "Uptime Accuracy" },
  { value: "2.4x", label: "Energy Savings" },
  { value: "500+", label: "Grid Nodes" },
  { value: "<50ms", label: "Response Time" },
];

const GridBackground = () => (
  <div style={{
    position: "absolute", inset: 0, overflow: "hidden",
    backgroundImage: `
      linear-gradient(rgba(37,99,235,0.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(37,99,235,0.06) 1px, transparent 1px)
    `,
    backgroundSize: "50px 50px",
    maskImage: "radial-gradient(ellipse 90% 80% at 50% 40%, black 40%, transparent 100%)"
  }}/>
);

const Orb = ({ x, y, color, size = 400 }) => (
  <div style={{
    position: "absolute", left: x, top: y,
    width: size, height: size,
    background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
    borderRadius: "50%", pointerEvents: "none",
    transform: "translate(-50%, -50%)",
    filter: "blur(50px)", opacity: 0.6,
  }}/>
);

export default function Home() {
  const navigate = useNavigate();
  const [hoveredFeature, setHoveredFeature] = useState(null);

  return (
    <div style={{ color: "#1E293B" }}>
      {/* ── HERO ── */}
      <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", overflow: "hidden" }}>
        <GridBackground />
        <Orb x="15%" y="25%" color="rgba(37,99,235,0.15)" size={600} />
        <Orb x="85%" y="35%" color="rgba(124,58,237,0.12)" size={500} />
        <Orb x="50%" y="85%" color="rgba(5,150,105,0.1)" size={450} />

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "120px 24px 80px", position: "relative", zIndex: 1, width: "100%" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>

            {/* Left */}
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: "rgba(37,99,235,0.08)",
                  border: "1px solid rgba(37,99,235,0.2)",
                  borderRadius: 100, padding: "6px 14px", marginBottom: 28,
                  fontSize: 13, fontWeight: 600, color: "#2563EB",
                }}
              >
                <span style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: "#2563EB",
                  display: "inline-block",
                  boxShadow: "0 0 8px rgba(37,99,235,0.8)",
                  animation: "livePulse 2s infinite",
                }}/>
                Next-Gen Energy Management Platform
              </motion.div>

              <h1 style={{
                fontSize: "clamp(2.6rem, 4.5vw, 4rem)",
                fontWeight: 900, lineHeight: 1.06,
                letterSpacing: "-2px", margin: "0 0 24px",
                color: "#0F172A",
              }}>
                Smart Power<br/>
                <span style={{
                  background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 60%, #0EA5E9 100%)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>Perfected by AI.</span>
              </h1>

              <p style={{ fontSize: 17, color: "#64748B", lineHeight: 1.75, margin: "0 0 40px", maxWidth: 460 }}>
                The ultimate monitoring dashboard for smart homes and industrial grids.
                Manage outages, optimize solar, and slash energy bills — intelligently.
              </p>

              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: "0 16px 36px rgba(37,99,235,0.35)" }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
                    border: "none", cursor: "pointer",
                    padding: "14px 28px", borderRadius: 14, fontSize: 15,
                    fontWeight: 700, color: "white",
                    boxShadow: "0 8px 22px rgba(37,99,235,0.3)",
                    display: "flex", alignItems: "center", gap: 8,
                  }}
                >
                  Get Started Free
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.03, background: "#F1F5F9" }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    background: "white",
                    border: "1.5px solid #E2E8F0",
                    cursor: "pointer",
                    padding: "14px 28px", borderRadius: 14, fontSize: 15,
                    fontWeight: 600, color: "#334155",
                    display: "flex", alignItems: "center", gap: 8,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M10 8l6 4-6 4V8z" fill="currentColor" stroke="none"/>
                  </svg>
                  View Demo
                </motion.button>
              </div>

              {/* Trust badges */}
              <div style={{ display: "flex", gap: 24, marginTop: 48, paddingTop: 32, borderTop: "1px solid #E2E8F0" }}>
                {["MIT Certified", "ISO 27001", "SOC 2 Type II"].map(badge => (
                  <div key={badge} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#94A3B8", fontWeight: 600 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#2563EB">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    {badge}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right — Dashboard Card */}
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ perspective: 1200 }}
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                style={{
                  background: "white",
                  border: "1px solid rgba(37,99,235,0.12)",
                  borderRadius: 24,
                  overflow: "hidden",
                  boxShadow: "0 40px 80px -20px rgba(37,99,235,0.15), 0 20px 40px -10px rgba(0,0,0,0.08)",
                  transform: "perspective(1200px) rotateX(2deg) rotateY(-4deg)",
                }}
              >
                {/* Window chrome */}
                <div style={{
                  background: "#F8FAFF",
                  borderBottom: "1px solid #EEF2FF",
                  padding: "12px 18px",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    {["#FCA5A5","#FCD34D","#86EFAC"].map(c => (
                      <div key={c} style={{ width: 11, height: 11, borderRadius: "50%", background: c }}/>
                    ))}
                  </div>
                  <div style={{ flex: 1, textAlign: "center", fontSize: 12, color: "#94A3B8", fontWeight: 500 }}>
                    EMS Core — Live Dashboard
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#059669", fontWeight: 600 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#059669" }}/>
                    Live
                  </div>
                </div>

                <div style={{ padding: 20, background: "#FAFBFF" }}>
                  {/* Top row */}
                  <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                    {/* Ring */}
                    <div style={{
                      flex: 1,
                      background: "white",
                      border: "1px solid #EEF2FF",
                      borderRadius: 16, padding: 16,
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      boxShadow: "0 2px 8px rgba(37,99,235,0.06)",
                    }}>
                      <svg width="90" height="90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="38" fill="none" stroke="#EEF2FF" strokeWidth="10"/>
                        <circle cx="50" cy="50" r="38" fill="none" stroke="#2563EB" strokeWidth="10"
                          strokeDasharray="180 239" strokeLinecap="round"
                          transform="rotate(-90 50 50)"
                          style={{ filter: "drop-shadow(0 0 4px rgba(37,99,235,0.5))" }}
                        />
                        <circle cx="50" cy="50" r="38" fill="none" stroke="#059669" strokeWidth="10"
                          strokeDasharray="55 239" strokeLinecap="round"
                          transform="rotate(165 50 50)"
                          style={{ filter: "drop-shadow(0 0 4px rgba(5,150,105,0.5))" }}
                        />
                        <text x="50" y="46" textAnchor="middle" fill="#0F172A" fontSize="14" fontWeight="700">78%</text>
                        <text x="50" y="60" textAnchor="middle" fill="#94A3B8" fontSize="8">Efficiency</text>
                      </svg>
                      <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 6, fontWeight: 600 }}>Grid Health</div>
                    </div>

                    {/* Stat stack */}
                    <div style={{ flex: 1.5, display: "flex", flexDirection: "column", gap: 8 }}>
                      {[
                        { label: "Total Consumption", value: "4.2 kWh", change: "-12%", color: "#2563EB" },
                        { label: "Solar Generation", value: "1.8 kWh", change: "+24%", color: "#059669" },
                        { label: "Active Alerts", value: "2", change: "Critical", color: "#D97706" },
                      ].map(s => (
                        <div key={s.label} style={{
                          background: "white",
                          border: `1px solid ${s.color}18`,
                          borderRadius: 12, padding: "9px 12px",
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                        }}>
                          <div>
                            <div style={{ fontSize: 9, color: "#94A3B8", fontWeight: 600, marginBottom: 2, textTransform: "uppercase" }}>{s.label}</div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>{s.value}</div>
                          </div>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: "3px 7px", borderRadius: 6,
                            background: `${s.color}12`, color: s.color,
                          }}>{s.change}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mini chart */}
                  <div style={{
                    background: "white", border: "1px solid #EEF2FF",
                    borderRadius: 14, padding: "12px 14px",
                    boxShadow: "0 2px 6px rgba(37,99,235,0.05)",
                  }}>
                    <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, marginBottom: 10, letterSpacing: "0.5px" }}>POWER FLOW · LAST 7 DAYS</div>
                    <svg width="100%" height="55" viewBox="0 0 300 55" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.15"/>
                          <stop offset="100%" stopColor="#2563EB" stopOpacity="0"/>
                        </linearGradient>
                      </defs>
                      <path d="M0,42 C30,37 60,18 90,23 C120,28 150,8 180,13 C210,18 240,32 270,26 L300,28 L300,55 L0,55 Z" fill="url(#blueGrad)"/>
                      <path d="M0,42 C30,37 60,18 90,23 C120,28 150,8 180,13 C210,18 240,32 270,26 L300,28" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round"/>
                      <path d="M0,47 C30,45 60,39 90,41 C120,43 150,33 180,35 C210,37 240,41 270,37 L300,39" fill="none" stroke="#059669" strokeWidth="2" strokeDasharray="4 3" opacity="0.6"/>
                    </svg>
                    <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                      {[{ label: "Consumed", color: "#2563EB" }, { label: "Solar", color: "#059669" }].map(l => (
                        <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#94A3B8", fontWeight: 600 }}>
                          <div style={{ width: 16, height: 2, background: l.color, borderRadius: 2 }}/>
                          {l.label}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <div style={{ padding: "0 24px", marginBottom: 0 }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto",
          background: "linear-gradient(135deg, rgba(37,99,235,0.07) 0%, rgba(124,58,237,0.06) 100%)",
          border: "1px solid rgba(37,99,235,0.12)",
          borderRadius: 24, padding: "40px 60px",
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20,
        }}>
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              style={{ textAlign: "center" }}
            >
              <div style={{
                fontSize: 38, fontWeight: 900, letterSpacing: "-2px",
                background: "linear-gradient(135deg, #2563EB, #7C3AED)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                lineHeight: 1.1, marginBottom: 6,
              }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#94A3B8", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section style={{ padding: "100px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: "center", marginBottom: 64 }}
          >
            <div style={{
              display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: "2px",
              color: "#2563EB", background: "rgba(37,99,235,0.08)",
              border: "1px solid rgba(37,99,235,0.2)", padding: "5px 16px",
              borderRadius: 100, marginBottom: 18, textTransform: "uppercase",
            }}>Intelligent Components</div>
            <h2 style={{
              fontSize: "clamp(2rem, 3.5vw, 2.8rem)", fontWeight: 900,
              letterSpacing: "-1.5px", color: "#0F172A", margin: "0 0 14px",
            }}>Everything your grid needs</h2>
            <p style={{ fontSize: 16, color: "#64748B", maxWidth: 460, margin: "0 auto", lineHeight: 1.7 }}>
              Powered by high-precision neural networks trained on millions of grid data points.
            </p>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -6, scale: 1.01 }}
                onClick={() => navigate(f.route)}
                onMouseEnter={() => setHoveredFeature(i)}
                onMouseLeave={() => setHoveredFeature(null)}
                style={{ cursor: "pointer" }}
              >
                <div style={{
                  background: hoveredFeature === i ? "white" : "white",
                  border: `1.5px solid ${hoveredFeature === i ? f.color + "40" : "#EEF2FF"}`,
                  borderRadius: 24, padding: 36,
                  height: "100%", position: "relative", overflow: "hidden",
                  boxShadow: hoveredFeature === i
                    ? `0 20px 50px ${f.glow}, 0 4px 16px rgba(0,0,0,0.06)`
                    : "0 4px 16px rgba(0,0,0,0.05)",
                  transition: "all 0.3s ease",
                }}>
                  {/* Subtle corner accent */}
                  <div style={{
                    position: "absolute", top: -20, right: -20,
                    width: 120, height: 120,
                    background: `radial-gradient(circle, ${f.glow} 0%, transparent 70%)`,
                    borderRadius: "50%",
                    opacity: hoveredFeature === i ? 1 : 0.4,
                    transition: "opacity 0.3s",
                  }}/>

                  <div style={{ display: "flex", alignItems: "flex-start", gap: 20, position: "relative" }}>
                    <div style={{
                      flexShrink: 0,
                      display: "inline-flex", padding: 14, borderRadius: 16,
                      background: f.accent, color: f.color,
                      border: `1px solid ${f.color}25`,
                      boxShadow: hoveredFeature === i ? `0 4px 16px ${f.glow}` : "none",
                      transition: "box-shadow 0.3s",
                    }}>
                      {f.icon}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <h3 style={{ fontSize: 19, fontWeight: 700, color: "#0F172A", margin: 0, letterSpacing: "-0.5px" }}>
                          {f.title}
                        </h3>
                        <motion.div
                          animate={{ x: hoveredFeature === i ? 4 : 0, opacity: hoveredFeature === i ? 1 : 0.4 }}
                          transition={{ duration: 0.2 }}
                          style={{ color: f.color }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </motion.div>
                      </div>
                      <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.7, margin: "0 0 16px" }}>
                        {f.description}
                      </p>
                      <span style={{
                        fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 8,
                        background: f.accent, color: f.color,
                        letterSpacing: "0.3px",
                      }}>
                        Open Dashboard →
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "0 24px 100px" }}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{
            maxWidth: 1200, margin: "0 auto",
            background: "linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 50%, #E0F2FE 100%)",
            border: "1.5px solid rgba(37,99,235,0.15)",
            borderRadius: 32, padding: "70px 60px",
            textAlign: "center", position: "relative", overflow: "hidden",
          }}
        >
          <Orb x="15%" y="60%" color="rgba(37,99,235,0.12)" size={400} />
          <Orb x="85%" y="40%" color="rgba(124,58,237,0.12)" size={400} />

          <div style={{ position: "relative", zIndex: 1 }}>
            <h2 style={{
              fontSize: "clamp(2rem, 3.5vw, 3rem)", fontWeight: 900,
              color: "#0F172A", letterSpacing: "-1.5px", margin: "0 0 18px",
            }}>
              Ready to transform<br/>your energy future?
            </h2>
            <p style={{ fontSize: 16, color: "#64748B", margin: "0 0 40px", maxWidth: 480, marginLeft: "auto", marginRight: "auto", lineHeight: 1.7 }}>
              Join hundreds of smart homes and industrial operators already using EMSCORE.
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center" }}>
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: "0 16px 36px rgba(37,99,235,0.35)" }}
                whileTap={{ scale: 0.97 }}
                style={{
                  background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
                  border: "none", cursor: "pointer",
                  padding: "15px 34px", borderRadius: 14, fontSize: 15,
                  fontWeight: 700, color: "white",
                  boxShadow: "0 8px 22px rgba(37,99,235,0.3)",
                }}
              >Start for Free</motion.button>
              <motion.button
                whileHover={{ scale: 1.04, background: "white" }}
                whileTap={{ scale: 0.97 }}
                style={{
                  background: "rgba(255,255,255,0.7)",
                  border: "1.5px solid #CBD5E1",
                  cursor: "pointer",
                  padding: "15px 34px", borderRadius: 14, fontSize: 15,
                  fontWeight: 600, color: "#334155",
                  backdropFilter: "blur(8px)",
                }}
              >Talk to Sales</motion.button>
            </div>
          </div>
        </motion.div>
      </section>

      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 8px rgba(37,99,235,0.8); }
          50% { opacity: 0.5; box-shadow: 0 0 16px rgba(37,99,235,0.4); }
        }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}