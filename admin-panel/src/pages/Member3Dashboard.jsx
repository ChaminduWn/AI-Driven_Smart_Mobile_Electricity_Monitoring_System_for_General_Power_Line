import { useState, useEffect, useRef } from "react";
import imgSolis from "../assets/Picture2.png";
import imgLhp from "../assets/Picture3.png";
import imgHayleys from "../assets/Picture4.png";
import imgSlsea from "../assets/Picture5.jpg";
import imgSurya from "../assets/Picture6.png";
import imgMinistry from "../assets/Picture7.png";

const API_BASE = "http://localhost:5000";

const C = {
  bg: "#060b14",
  surface: "#0d1424",
  card: "#111c2e",
  border: "#1a2d45",
  accent: "#f5a623",
  accentDim: "#c17d0e",
  teal: "#22d3cc",
  red: "#f87171",
  green: "#4ade80",
  purple: "#a78bfa",
  blue: "#60a5fa",
  textPri: "#f0f4ff",
  textSec: "#8ea0bb",
  textMuted: "#3e5470",
};

const CLIMATE_DATA = {
  Colombo: { Jan_Mar: 5.2, Apr_Jun: 5.0, Jul_Sep: 4.8, Oct_Dec: 5.1, temp: 28.5, rain: 2390, wind: "Low", impact: "Low", lat: 6.9271, lng: 79.8612 },
  Kandy: { Jan_Mar: 4.8, Apr_Jun: 4.6, Jul_Sep: 4.4, Oct_Dec: 4.7, temp: 24.0, rain: 1900, wind: "Medium", impact: "Medium", lat: 7.2906, lng: 80.6337 },
  Galle: { Jan_Mar: 5.1, Apr_Jun: 4.9, Jul_Sep: 4.7, Oct_Dec: 5.0, temp: 27.5, rain: 2300, wind: "Low", impact: "Low", lat: 6.0535, lng: 80.2210 },
  Jaffna: { Jan_Mar: 5.8, Apr_Jun: 5.6, Jul_Sep: 5.4, Oct_Dec: 5.7, temp: 30.0, rain: 1000, wind: "High", impact: "Medium", lat: 9.6615, lng: 80.0255 },
  Anuradhapura: { Jan_Mar: 5.5, Apr_Jun: 5.3, Jul_Sep: 5.1, Oct_Dec: 5.4, temp: 30.5, rain: 900, wind: "Medium", impact: "Low", lat: 8.3114, lng: 80.4037 },
  Kurunegala: { Jan_Mar: 5.2, Apr_Jun: 5.0, Jul_Sep: 4.8, Oct_Dec: 5.1, temp: 29.0, rain: 1500, wind: "Medium", impact: "Low", lat: 7.4818, lng: 80.3609 },
  Batticaloa: { Jan_Mar: 5.4, Apr_Jun: 5.2, Jul_Sep: 5.0, Oct_Dec: 5.3, temp: 29.5, rain: 1650, wind: "High", impact: "Medium", lat: 7.7170, lng: 81.7000 },
  Badulla: { Jan_Mar: 4.5, Apr_Jun: 4.3, Jul_Sep: 4.1, Oct_Dec: 4.4, temp: 20.0, rain: 2100, wind: "High", impact: "High", lat: 6.9934, lng: 81.0550 },
  Ratnapura: { Jan_Mar: 4.6, Apr_Jun: 4.4, Jul_Sep: 4.2, Oct_Dec: 4.5, temp: 26.0, rain: 3700, wind: "Medium", impact: "High", lat: 6.6828, lng: 80.3992 },
  Hambantota: { Jan_Mar: 5.9, Apr_Jun: 6.0, Jul_Sep: 6.2, Oct_Dec: 5.1, temp: 33.5, rain: 1100, wind: "Very High", impact: "Very Low", lat: 6.1429, lng: 81.1212 },
  Gampaha: { Jan_Mar: 5.4, Apr_Jun: 4.6, Jul_Sep: 4.8, Oct_Dec: 4.3, temp: 32.0, rain: 2100, wind: "Medium", impact: "High", lat: 7.0840, lng: 80.0098 },
  Kalutara: { Jan_Mar: 5.2, Apr_Jun: 4.3, Jul_Sep: 4.5, Oct_Dec: 4.1, temp: 30.5, rain: 3200, wind: "High", impact: "Very High", lat: 6.5854, lng: 79.9607 },
  Matale: { Jan_Mar: 4.9, Apr_Jun: 4.3, Jul_Sep: 4.5, Oct_Dec: 4.1, temp: 30.2, rain: 1800, wind: "Low", impact: "Medium", lat: 7.4675, lng: 80.6234 },
  "Nuwara Eliya": { Jan_Mar: 4.2, Apr_Jun: 3.7, Jul_Sep: 3.5, Oct_Dec: 3.4, temp: 15.8, rain: 2500, wind: "Med-High", impact: "Very High", lat: 6.9497, lng: 80.7891 },
  Matara: { Jan_Mar: 5.2, Apr_Jun: 4.4, Jul_Sep: 4.5, Oct_Dec: 4.2, temp: 30.5, rain: 2400, wind: "High", impact: "High", lat: 5.9549, lng: 80.5550 },
};

const fmt = (n) => n != null ? `Rs. ${Number(n).toLocaleString("en-LK")}` : "—";
const fmtN = (n, unit = "") => n != null ? `${Number(n).toLocaleString("en-LK")}${unit}` : "—";

const PARTNERS = [
  { name: "University of Moratuwa", abbr: "UOM", color: "#1e40af", emoji: "🎓" },
  { name: "Ceylon Electricity Board", abbr: "CEB", color: "#b45309", emoji: "⚡" },
  { name: "Sri Lanka Sustainable Energy Authority", abbr: "SLSEA", color: "#065f46", emoji: "🌿" },
  { name: "National Science Foundation", abbr: "NSF", color: "#6b21a8", emoji: "🔬" },
  { name: "Ministry of Power & Energy", abbr: "MPE", color: "#991b1b", emoji: "🏛️" },
  { name: "Asian Development Bank", abbr: "ADB", color: "#1e3a5f", emoji: "🌏" },
];

// ─── SparkLine ────────────────────────────────────────────────────────
function SparkLine({ data, color, height = 40, width = 120 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={`0,${height} ${pts} ${width},${height}`} fill={`${color}18`} stroke="none" />
    </svg>
  );
}

// ─── Solar3DDisplay ───────────────────────────────────────────────────
function Solar3DDisplay({ capacityKw, monthlySavings, coverage }) {
  const [rot, setRot] = useState({ x: 20, y: -30 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef(null);

  const handleMouseDown = (e) => { setDragging(true); dragStart.current = { x: e.clientX, y: e.clientY, rot: { ...rot } }; };
  const handleMouseMove = (e) => {
    if (!dragging || !dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setRot({ x: dragStart.current.rot.x + dy * 0.4, y: dragStart.current.rot.y + dx * 0.4 });
  };
  const handleMouseUp = () => setDragging(false);

  const panels = Math.max(1, Math.round(capacityKw / 0.4));
  const rows = Math.ceil(Math.sqrt(panels));
  const cols = Math.ceil(panels / rows);
  const panelW = 80, panelH = 54, gap = 6;

  return (
    <div onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
      style={{ cursor: dragging ? "grabbing" : "grab", userSelect: "none" }}>
      <div style={{ textAlign: "center", fontSize: 10, color: C.textMuted, marginBottom: 8, letterSpacing: "0.1em" }}>↔ DRAG TO ROTATE</div>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 220, perspective: "600px" }}>
        <div style={{ transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`, transformStyle: "preserve-3d", transition: dragging ? "none" : "transform 0.3s ease" }}>
          <div style={{ position: "absolute", width: cols * (panelW + gap), height: rows * (panelH + gap), background: "radial-gradient(ellipse, rgba(245,166,35,0.15) 0%, transparent 70%)", transform: "rotateX(90deg) translateZ(-30px)", borderRadius: 8 }} />
          {Array.from({ length: rows }).map((_, r) =>
            Array.from({ length: cols }).map((_, c) => {
              const idx = r * cols + c;
              if (idx >= panels) return null;
              return (
                <div key={`${r}-${c}`} style={{ position: "absolute", left: c * (panelW + gap), top: r * (panelH + gap), width: panelW, height: panelH, background: "linear-gradient(135deg, #0a1628 0%, #112240 40%, #0d1e35 100%)", border: "1px solid #1e3a5f", borderRadius: 4, boxShadow: "0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(34,211,204,0.1)", display: "grid", gridTemplateColumns: "repeat(6,1fr)", gridTemplateRows: "repeat(4,1fr)", gap: 2, padding: 6, transformStyle: "preserve-3d" }}>
                  {Array.from({ length: 24 }).map((_, ci) => (
                    <div key={ci} style={{ background: `linear-gradient(135deg, #1e3a5f, #0d2444)`, borderRadius: 1, border: "0.5px solid #22d3cc22" }} />
                  ))}
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(45deg, transparent 30%, rgba(34,211,204,0.08) 50%, transparent 70%)", borderRadius: 4 }} />
                </div>
              );
            })
          )}
          <div style={{ position: "absolute", left: -8, top: -8, width: cols * (panelW + gap) + 16, height: rows * (panelH + gap) + 16, border: "2px solid #c17d0e66", borderRadius: 6, background: "transparent" }} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 16 }}>
        {[
          { label: "System Size", value: `${capacityKw} kW`, color: C.accent },
          { label: "Monthly Savings", value: fmt(monthlySavings), color: C.green },
          { label: "Coverage", value: `${coverage}%`, color: C.teal },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: "#0d1526", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 9, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 800, color, fontFamily: "'Barlow Condensed', sans-serif" }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PricePredictionGraph ─────────────────────────────────────────────
function PricePredictionGraph({ currentPrice, predictedPrice }) {
  const current = currentPrice || 450000;
  const predicted = predictedPrice || current * 1.12;
  const pctIncrease = (((predicted - current) / current) * 100).toFixed(1);
  const years = ["2022", "2023", "2024", "Now", "+1yr", "+2yr", "+3yr"];
  const historicalMultipliers = [0.72, 0.82, 0.93, 1.0, 1.05, 1.11, 1.18];
  const prices = historicalMultipliers.map(m => Math.round(current * m));

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px 20px", marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.textSec, marginBottom: 4 }}>📈 Price Prediction</div>
          <div style={{ fontSize: 11, color: C.textMuted }}>Solar system cost trend & forecast</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 2 }}>% Increase</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.accent, fontFamily: "'Barlow Condensed', sans-serif" }}>+{pctIncrease}%</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <div style={{ background: "#0d1526", border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 14px" }}>
          <div style={{ fontSize: 9, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Current Price</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.textPri, fontFamily: "'Barlow Condensed', sans-serif" }}>{fmt(current)}</div>
        </div>
        <div style={{ background: "rgba(245,166,35,0.06)", border: `1px solid rgba(245,166,35,0.3)`, borderRadius: 8, padding: "12px 14px" }}>
          <div style={{ fontSize: 9, color: C.accentDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Predicted Price</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.accent, fontFamily: "'Barlow Condensed', sans-serif" }}>{fmt(Math.round(predicted))}</div>
        </div>
      </div>
      <div style={{ position: "relative" }}>
        <svg width="100%" viewBox="0 0 340 100" style={{ overflow: "visible" }}>
          <defs>
            <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.accent} stopOpacity="0.3" />
              <stop offset="100%" stopColor={C.accent} stopOpacity="0" />
            </linearGradient>
            <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.teal} stopOpacity="0.2" />
              <stop offset="100%" stopColor={C.teal} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 25, 50, 75, 100].map(y => (
            <line key={y} x1="0" y1={y} x2="340" y2={y} stroke={C.border} strokeWidth="0.5" />
          ))}
          {(() => {
            const pts4 = prices.slice(0, 4).map((p, i) => {
              const x = (i / 6) * 340;
              const y = 95 - ((p - Math.min(...prices)) / (Math.max(...prices) - Math.min(...prices))) * 90;
              return `${x},${y}`;
            });
            return (
              <>
                <polyline points={pts4.join(" ")} fill="none" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round" />
                <polyline points={`0,100 ${pts4.join(" ")} ${(3 / 6) * 340},100`} fill="url(#priceGrad)" stroke="none" />
              </>
            );
          })()}
          {(() => {
            const pts4 = prices.slice(3, 7).map((p, i) => {
              const x = ((i + 3) / 6) * 340;
              const y = 95 - ((p - Math.min(...prices)) / (Math.max(...prices) - Math.min(...prices))) * 90;
              return `${x},${y}`;
            });
            return (
              <>
                <polyline points={pts4.join(" ")} fill="none" stroke={C.teal} strokeWidth="2" strokeDasharray="6,3" strokeLinecap="round" />
                <polyline points={`${(3 / 6) * 340},100 ${pts4.join(" ")} 340,100`} fill="url(#predGrad)" stroke="none" />
              </>
            );
          })()}
          {prices.map((p, i) => {
            const x = (i / 6) * 340;
            const y = 95 - ((p - Math.min(...prices)) / (Math.max(...prices) - Math.min(...prices))) * 90;
            const isForecast = i > 3;
            return (
              <g key={i}>
                <circle cx={x} cy={y} r={i === 3 ? 5 : 3.5} fill={isForecast ? C.teal : C.accent} stroke={C.bg} strokeWidth="1.5" />
                <text x={x} y={y - 8} textAnchor="middle" fontSize="7" fill={C.textMuted}>{years[i]}</text>
              </g>
            );
          })}
          <line x1={(3 / 6) * 340} y1="0" x2={(3 / 6) * 340} y2="100" stroke={C.accent} strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />
        </svg>
        <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: C.textSec }}>
            <div style={{ width: 16, height: 2, background: C.accent, borderRadius: 1 }} /> Historical
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: C.textSec }}>
            <div style={{ width: 16, height: 2, background: C.teal, borderRadius: 1 }} /> Forecast
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── WeatherTrendChart ────────────────────────────────────────────────
function WeatherTrendChart({ district }) {
  const data = CLIMATE_DATA[district];
  if (!data) return null;
  const ghiData = [data.Jan_Mar, data.Apr_Jun, data.Jul_Sep, data.Oct_Dec];
  const quarters = ["Jan–Mar", "Apr–Jun", "Jul–Sep", "Oct–Dec"];
  const maxGHI = 7;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px 20px", marginBottom: 16 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.purple, marginBottom: 4 }}>🌤 Weather Trends — {district}</div>
      <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 14 }}>Quarterly solar irradiance (GHI kWh/m²/day)</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 16 }}>
        {ghiData.map((v, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.teal, marginBottom: 4 }}>{v.toFixed(1)}</div>
            <div style={{ height: 60, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
              <div style={{ background: `linear-gradient(to top, ${C.teal}88, ${C.teal}33)`, borderRadius: "3px 3px 0 0", height: `${(v / maxGHI) * 60}px`, border: `1px solid ${C.teal}44`, transition: "height 1s ease" }} />
            </div>
            <div style={{ fontSize: 9, color: C.textMuted, marginTop: 4 }}>{quarters[i]}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
        {[
          { label: "Avg Temp", value: `${data.temp}°C`, icon: "🌡️", color: C.accent },
          { label: "Annual Rain", value: `${data.rain.toLocaleString()} mm`, icon: "🌧️", color: C.blue },
          { label: "Wind Stress", value: data.wind, icon: "💨", color: C.purple },
        ].map(({ label, value, icon, color }) => (
          <div key={label} style={{ background: "#0d1526", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 14, marginBottom: 4 }}>{icon}</div>
            <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: "#0d1526", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 9, color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase" }}>Avg Annual GHI</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.accent, fontFamily: "'Barlow Condensed', sans-serif" }}>
            {((data.Jan_Mar + data.Apr_Jun + data.Jul_Sep + data.Oct_Dec) / 4).toFixed(2)} kWh/m²/day
          </div>
        </div>
        <SparkLine data={ghiData} color={C.accent} height={36} width={100} />
      </div>
    </div>
  );
}

// ─── SriLankaMap ──────────────────────────────────────────────────────
function SriLankaMap({ selectedDistrict }) {
  const districts = Object.entries(CLIMATE_DATA);
  const minLat = 5.9, maxLat = 9.85, minLng = 79.6, maxLng = 81.9;
  const toSVG = (lat, lng) => ({
    x: ((lng - minLng) / (maxLng - minLng)) * 180 + 10,
    y: ((maxLat - lat) / (maxLat - minLat)) * 240 + 10,
  });
  const ghiColor = (ghi) => {
    const t = (ghi - 3.5) / (6.5 - 3.5);
    if (t < 0.33) return "#1e40af";
    if (t < 0.66) return "#d97706";
    return "#dc2626";
  };
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px 20px", marginBottom: 16 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.blue, marginBottom: 4 }}>🗺️ Solar Irradiance Map — Sri Lanka</div>
      <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 14 }}>Annual average GHI by district</div>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <svg width="200" height="260" style={{ flexShrink: 0 }}>
          <path d="M100,12 L130,18 L155,35 L170,60 L178,95 L175,130 L170,165 L160,200 L140,230 L115,248 L95,248 L70,235 L52,210 L40,180 L35,148 L38,115 L45,82 L60,55 L80,30 Z" fill="#0a1628" stroke="#1e3a5f" strokeWidth="1.5" />
          {districts.map(([name, d]) => {
            const avgGhi = (d.Jan_Mar + d.Apr_Jun + d.Jul_Sep + d.Oct_Dec) / 4;
            const { x, y } = toSVG(d.lat, d.lng);
            const isSelected = name === selectedDistrict;
            return (
              <g key={name}>
                <circle cx={x} cy={y} r={isSelected ? 10 : 6} fill={ghiColor(avgGhi)} fillOpacity={0.8} stroke={isSelected ? C.accent : "transparent"} strokeWidth={isSelected ? 2 : 0} style={{ filter: isSelected ? "drop-shadow(0 0 4px rgba(245,166,35,0.8))" : "none" }} />
                {isSelected && (
                  <>
                    <circle cx={x} cy={y} r={14} fill="none" stroke={C.accent} strokeWidth="1" strokeDasharray="3,3" opacity="0.7" />
                    <text x={x} y={y + 22} textAnchor="middle" fontSize="7" fill={C.accent} fontWeight="700">{name}</text>
                  </>
                )}
              </g>
            );
          })}
        </svg>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, color: C.textMuted, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>GHI Legend</div>
          {[
            { color: "#1e40af", label: "< 4.5 kWh/m²" },
            { color: "#d97706", label: "4.5–5.2 kWh/m²" },
            { color: "#dc2626", label: "> 5.2 kWh/m²" },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
              <span style={{ fontSize: 10, color: C.textSec }}>{label}</span>
            </div>
          ))}
          <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 10, paddingTop: 10 }}>
            <div style={{ fontSize: 9, color: C.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Top Districts</div>
            {districts
              .map(([name, d]) => ({ name, ghi: (d.Jan_Mar + d.Apr_Jun + d.Jul_Sep + d.Oct_Dec) / 4 }))
              .sort((a, b) => b.ghi - a.ghi)
              .slice(0, 5)
              .map(({ name, ghi }) => (
                <div key={name} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: name === selectedDistrict ? C.accent : C.textSec, fontWeight: name === selectedDistrict ? 700 : 400 }}>{name}</span>
                  <span style={{ fontSize: 10, color: C.teal, fontFamily: "monospace" }}>{ghi.toFixed(2)}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SavingsChart ─────────────────────────────────────────────────────
function SavingsChart({ monthlySavings, totalCost }) {
  if (!monthlySavings || !totalCost) return null;
  const annualSavings = monthlySavings * 12;
  const years = [1, 2, 3, 5, 7, 10, 15, 20, 25];
  const cumulative = years.map(y => annualSavings * y);
  const maxVal = cumulative[cumulative.length - 1];
  const breakEvenYear = totalCost / annualSavings;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px 20px", marginBottom: 16 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.green, marginBottom: 4 }}>💰 Savings Over Years</div>
      <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 14 }}>Cumulative savings projection · Break-even at {breakEvenYear.toFixed(1)} years</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 100, marginBottom: 12 }}>
        {years.map((y, i) => {
          const isAboveBreakEven = y >= breakEvenYear;
          const barHeight = (cumulative[i] / maxVal) * 88;
          return (
            <div key={y} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <div style={{ fontSize: 8, color: isAboveBreakEven ? C.green : C.textMuted, fontWeight: isAboveBreakEven ? 700 : 400 }}>
                {cumulative[i] >= 1000000 ? `${(cumulative[i] / 1000000).toFixed(1)}M` : `${(cumulative[i] / 1000).toFixed(0)}k`}
              </div>
              <div style={{ width: "100%", height: `${barHeight}px`, background: isAboveBreakEven ? `linear-gradient(to top, ${C.green}cc, ${C.green}44)` : `linear-gradient(to top, ${C.teal}66, ${C.teal}22)`, borderRadius: "3px 3px 0 0", border: `1px solid ${isAboveBreakEven ? C.green : C.teal}44`, position: "relative", transition: "height 1s ease" }}>
                {y >= Math.ceil(breakEvenYear) && y - 1 < breakEvenYear && (
                  <div style={{ position: "absolute", top: -4, left: "50%", transform: "translateX(-50%)", width: 6, height: 6, background: C.accent, borderRadius: "50%" }} />
                )}
              </div>
              <span style={{ fontSize: 8, color: C.textMuted }}>{y}yr</span>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 8 }}>
        <span style={{ fontSize: 11, color: C.textSec }}>Annual savings</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: C.green, fontFamily: "'Barlow Condensed', sans-serif" }}>{fmt(annualSavings)}/yr</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 8, marginTop: 6 }}>
        <span style={{ fontSize: 11, color: C.textSec }}>25-year total savings</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: C.accent, fontFamily: "'Barlow Condensed', sans-serif" }}>{fmt(annualSavings * 25)}</span>
      </div>
    </div>
  );
}

// ─── ReportButton ─────────────────────────────────────────────────────
function ReportButton({ cfg, rec, ml, fin, clim, form }) {
  const handleDownload = () => {
    const budgetLKR = Number(form?.Budget_LKR) || 1;
    const panelPrice = rec?.products?.panel?.Price_LKR || 0;
    const predPrice = (ml?.predicted_price_lkr || 0) + panelPrice;
    const isWithinBudget = predPrice <= budgetLKR;
    const budgetDiff = Math.abs(budgetLKR - predPrice);
    const diffWord = predPrice <= budgetLKR ? "Decrease" : "Increase";

    const lines = [
      "═══════════════════════════════════════════════════",
      "        SOLAR POWER RECOMMENDATION REPORT",
      "═══════════════════════════════════════════════════",
      `Date: ${new Date().toLocaleDateString("en-LK")}`,
      `Location: ${clim?.district || form?.Location}`,
      "",
      "── SYSTEM RECOMMENDATION ──",
      `System Capacity: ${cfg?.capacity_kw} kW`,
      `Panel: ${cfg?.panel_brand_model}`,
      `Total Cost: ${fmt(cfg?.total_cost_lkr)}`,
      `Predicted Price: ${fmt(predPrice)}`,
      `Budget Status: ${isWithinBudget ? "✓ Within Budget" : "✗ Over Budget"} (${diffWord}: ${fmt(budgetDiff)})`,
      "",
      "── ML PREDICTIONS ──",
      `Predicted Capacity: ${ml?.predicted_capacity_kw} kW`,
      `Predicted Price: ${fmt(ml?.predicted_price_lkr)}`,
      `Recommended Brand: ${ml?.predicted_brand}`,
      "",
      "── FINANCIAL ANALYSIS ──",
      `Monthly Generation: ${fmtN(fin?.monthly_generation_kwh, " kWh")}`,
      `Monthly Savings: ${fmt(fin?.monthly_savings_lkr)}`,
      `Annual Savings: ${fmt((fin?.monthly_savings_lkr || 0) * 12)}`,
      `Payback Period: ${fin?.payback_years} years`,
      `25-Year Savings: ${fmt((fin?.monthly_savings_lkr || 0) * 12 * 25)}`,
      "",
      "── CLIMATE DATA ──",
      `Average GHI: ${clim?.avg_ghi} kWh/m²/day`,
      `Average Temperature: ${clim?.avg_temp_c}°C`,
      `Annual Rainfall: ${fmtN(clim?.annual_rain_mm, " mm")}`,
      `Wind Stress: ${clim?.wind_stress}`,
      `Weather Impact: ${clim?.weather_impact}`,
      "",
      "═══════════════════════════════════════════════════",
      "Generated by Solar PV Recommendation System",
      "Powered by Machine Learning & Climate Analysis",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `solar_recommendation_${clim?.district || "report"}.txt`;
    a.click(); URL.revokeObjectURL(url);
  };
  return (
    <button onClick={handleDownload} style={{ width: "100%", padding: "14px 0", marginBottom: 16, background: "linear-gradient(135deg, #1e3a5f, #0d2444)", border: `1px solid ${C.teal}44`, borderRadius: 10, color: C.teal, fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s", fontFamily: "'Barlow Condensed', sans-serif" }}
      onMouseEnter={e => e.currentTarget.style.borderColor = C.teal}
      onMouseLeave={e => e.currentTarget.style.borderColor = `${C.teal}44`}>
      📄 Download Recommendation Report
    </button>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────
function SunRays() {
  return (
    <svg viewBox="0 0 600 220" style={{ position: "absolute", top: 0, left: 0, width: "100%", opacity: 0.06, pointerEvents: "none" }}>
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i / 24) * 360;
        const rad = (angle * Math.PI) / 180;
        return <line key={i} x1="300" y1="0" x2={300 + Math.cos(rad) * 600} y2={0 + Math.sin(rad) * 600} stroke={C.accent} strokeWidth="1" />;
      })}
      <circle cx="300" cy="0" r="60" fill={C.accent} />
    </svg>
  );
}

function Field({ label, children, required }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.textSec, marginBottom: 6 }}>
        {label}{required && <span style={{ color: C.accent, marginLeft: 4 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCss = { width: "100%", padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${C.border}`, background: "#0a1220", color: C.textPri, fontSize: 13, outline: "none", boxSizing: "border-box" };

function Input({ ...props }) {
  const [focused, setFocused] = useState(false);
  return <input {...props} style={{ ...inputCss, borderColor: focused ? C.teal : C.border }} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />;
}

function SelectInput({ children, ...props }) {
  const [focused, setFocused] = useState(false);
  return <select {...props} style={{ ...inputCss, borderColor: focused ? C.teal : C.border, cursor: "pointer" }} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}>{children}</select>;
}

function Chip({ label, value, accent }) {
  return (
    <div style={{ background: "#0a1220", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px" }}>
      <span style={{ display: "block", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.textSec, marginBottom: 3 }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: accent || C.textPri }}>{value}</span>
    </div>
  );
}

function Section({ title, icon, children, color }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 18px", marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontWeight: 800, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: color || C.teal }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function ProductCard({ label, data }) {
  if (!data) return null;
  return (
    <div style={{ background: "#0a1220", border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", marginBottom: 10 }}>
      <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: C.textMuted, marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.textPri, marginBottom: 3 }}>{data["Brand/Model"] || "—"}</div>
      <div style={{ fontSize: 11, color: C.textSec, marginBottom: 8 }}>{data["Company"] || "—"}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        <Chip label="Size" value={data["Size_KW"] != null ? `${data["Size_KW"]} kW` : "—"} />
        <Chip label="Warranty" value={data["Warranty_Years"] != null ? `${data["Warranty_Years"]} yrs` : "—"} />
        <Chip label="Price" value={fmt(data["Price_LKR"])} accent={C.accent} />
      </div>
    </div>
  );
}

function ProgressBar({ value, max, color }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ background: C.border, borderRadius: 99, height: 7, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color || C.teal, borderRadius: 99, transition: "width 0.8s cubic-bezier(.4,0,.2,1)" }} />
    </div>
  );
}

function StatusBadge({ ok, text }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 99, fontSize: 10, fontWeight: 700, background: ok ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)", color: ok ? C.green : C.red, border: `1px solid ${ok ? "rgba(74,222,128,0.25)" : "rgba(248,113,113,0.25)"}` }}>
      <span style={{ fontSize: 8 }}>●</span>{text || (ok ? "Within Budget" : "Over Budget")}
    </span>
  );
}

// ─── Partner Logos ────────────────────────────────────────────────────
const PARTNER_LOGOS = [
  { name: "Solis Group", img: imgSolis },
  { name: "LHP Energy", img: imgLhp },
  { name: "Hayleys Solar", img: imgHayleys },
  { name: "SLSEA", img: imgSlsea },
  { name: "Surya Bala", img: imgSurya },
  { name: "Ministry of Energy", img: imgMinistry },
];

// ─── Footer ───────────────────────────────────────────────────────────
function Footer() {
  return (
    <div style={{ marginTop: 40, borderTop: `1px solid ${C.border}`, paddingTop: 28 }}>
      <div style={{ textAlign: "center", fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: C.textMuted, marginBottom: 20 }}>
        Partner Institutions & Acknowledgements
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: 16, marginBottom: 24 }}>
        {PARTNER_LOGOS.map(({ name, img }) => (
          <div key={name} style={{ background: "#ffffff", border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, width: 220, height: 120 }}>
            <img src={img} alt={name} title={name} style={{ maxWidth: "100%", maxHeight: 85, objectFit: "contain" }} />
          </div>
        ))}
      </div>
      <div style={{ textAlign: "center", fontSize: 10, color: C.textMuted, paddingBottom: 16 }}>
        Solar PV Recommendation System · Powered by Machine Learning & Climate Data · Sri Lanka
      </div>
    </div>
  );
}

// ─── Auth Constants ───────────────────────────────────────────────────
const TOKEN_KEY = "solar_auth_token";
const EMAIL_KEY = "solar_auth_email";

// ─── AuthScreen ───────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused] = useState(null);

  const iStyle = (field) => ({
    width: "100%", padding: "11px 14px", borderRadius: 8,
    border: `1.5px solid ${focused === field ? C.teal : C.border}`,
    background: "#080f1c", color: C.textPri, fontSize: 14,
    outline: "none", boxSizing: "border-box", transition: "border-color 0.2s",
  });

  const handleSubmit = async () => {
    setError(null); setSuccess(null);
    if (!email || !password) { setError("Email and password are required."); return; }
    if (mode === "register" && password !== confirm) { setError("Passwords do not match."); return; }
    if (mode === "register" && password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      sessionStorage.setItem(TOKEN_KEY, data.token);
      sessionStorage.setItem(EMAIL_KEY, data.email);
      if (mode === "register") {
        setSuccess("Account created! Signing you in...");
        setTimeout(() => onAuth(data.token, data.email), 900);
      } else {
        onAuth(data.token, data.email);
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <svg viewBox="0 0 800 800" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "max(100vw,100vh)", opacity: 0.04 }}>
          {Array.from({ length: 24 }).map((_, i) => {
            const a = (i / 24) * 360;
            const r = (a * Math.PI) / 180;
            return <line key={i} x1="400" y1="400" x2={400 + Math.cos(r) * 700} y2={400 + Math.sin(r) * 700} stroke={C.accent} strokeWidth="1.5" />;
          })}
          <circle cx="400" cy="400" r="80" fill={C.accent} />
        </svg>
      </div>
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>☀️</div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 800, color: C.textPri, lineHeight: 1.1, marginBottom: 6 }}>
            Solar PV <span style={{ color: C.accent }}>Recommendation</span>
          </h1>
          <p style={{ fontSize: 12, color: C.textMuted }}>AI-Powered Solar Analysis · Sri Lanka</p>
        </div>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "28px 28px 24px", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
          <div style={{ display: "flex", background: C.card, borderRadius: 10, padding: 4, marginBottom: 24 }}>
            {["login", "register"].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(null); setSuccess(null); }}
                style={{ flex: 1, padding: "9px 0", borderRadius: 7, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, letterSpacing: "0.06em", textTransform: "capitalize", transition: "all 0.2s", background: mode === m ? C.accent : "transparent", color: mode === m ? "#000" : C.textMuted }}>
                {m === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.textSec, marginBottom: 6 }}>Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={iStyle("email")} onFocus={() => setFocused("email")} onBlur={() => setFocused(null)} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
          </div>
          <div style={{ marginBottom: mode === "register" ? 14 : 20 }}>
            <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.textSec, marginBottom: 6 }}>Password</label>
            <div style={{ position: "relative" }}>
              <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === "register" ? "Min. 6 characters" : "Your password"} style={{ ...iStyle("password"), paddingRight: 40 }} onFocus={() => setFocused("password")} onBlur={() => setFocused(null)} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
              <button onClick={() => setShowPass(v => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.textMuted, fontSize: 13 }}>
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>
          {mode === "register" && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.textSec, marginBottom: 6 }}>Confirm Password</label>
              <input type={showPass ? "text" : "password"} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat password" style={iStyle("confirm")} onFocus={() => setFocused("confirm")} onBlur={() => setFocused(null)} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
            </div>
          )}
          {error && <div style={{ marginBottom: 14, padding: "10px 12px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: 8, color: C.red, fontSize: 12 }}>⚠️ {error}</div>}
          {success && <div style={{ marginBottom: 14, padding: "10px 12px", background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 8, color: C.green, fontSize: 12 }}>✅ {success}</div>}
          <button onClick={handleSubmit} disabled={loading} style={{ width: "100%", padding: "14px 0", background: loading ? C.accentDim : C.accent, color: "#000", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 800, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {loading ? <><div style={{ width: 13, height: 13, border: "2px solid #000", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />Processing...</> : mode === "login" ? "☀️ Sign In" : "🌟 Create Account"}
          </button>
        </div>
        <p style={{ textAlign: "center", fontSize: 11, color: C.textMuted, marginTop: 18 }}>Solar PV Recommendation System · Sri Lanka</p>
      </div>
    </div>
  );
}

// ─── HistoryPanel ─────────────────────────────────────────────────────
function HistoryPanel({ token, onClose }) {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/predictions`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setPredictions(d.predictions || []); setLoading(false); })
      .catch(() => { setError("Could not load history."); setLoading(false); });
  }, [token]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(6,11,20,0.85)", zIndex: 100, display: "flex", alignItems: "flex-start", justifyContent: "flex-end", padding: 20 }}>
      <div className="fade-up" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, width: "100%", maxWidth: 540, maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "18px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: C.accent }}>📋 Prediction History</div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3 }}>All your past solar recommendations</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.textSec, fontSize: 20, cursor: "pointer", padding: "4px 8px", borderRadius: 6 }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px" }}>
          {loading && <div style={{ textAlign: "center", color: C.textMuted, padding: 40, fontSize: 13 }}>Loading history...</div>}
          {error && <div style={{ color: C.red, fontSize: 12, padding: 16 }}>⚠️ {error}</div>}
          {!loading && !error && predictions.length === 0 && (
            <div style={{ textAlign: "center", color: C.textMuted, padding: 40 }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🌞</div>
              <div style={{ fontSize: 13 }}>No predictions yet. Submit your first recommendation!</div>
            </div>
          )}
          {predictions.map((p) => (
            <div key={p.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 16, color: C.accent }}>{p.capacity_kw} kW · {p.location}</div>
                <div style={{ fontSize: 9, color: C.textMuted }}>{new Date(p.created).toLocaleDateString("en-LK", { day: "2-digit", month: "short", year: "numeric" })}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                {[
                  { label: "Total Cost", value: `Rs. ${Number(p.total_cost_lkr).toLocaleString("en-LK")}`, color: C.accent },
                  { label: "Monthly Savings", value: `Rs. ${Number(p.monthly_savings).toLocaleString("en-LK")}`, color: C.green },
                  { label: "Payback", value: `${p.payback_years} yrs`, color: C.teal },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: "#0a1220", borderRadius: 6, padding: "7px 8px" }}>
                    <div style={{ fontSize: 8, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────
export default function Member3Dashboard() {
  const locationList = Object.keys(CLIMATE_DATA);

  const [authToken, setAuthToken] = useState(() => sessionStorage.getItem(TOKEN_KEY));
  const [authEmail, setAuthEmail] = useState(() => sessionStorage.getItem(EMAIL_KEY) || "");
  const [showHistory, setShowHistory] = useState(false);
  const [form, setForm] = useState({ Budget_LKR: "", Roof_Size_m2: "", Location: "", Preferred_Brand: "", Energy_Usage_kWhPerDay: "" });
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [apiOnline, setApiOnline] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then(r => r.ok ? setApiOnline(true) : setApiOnline(false))
      .catch(() => setApiOnline(false));
  }, []);

  const handleAuth = (token, email) => {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(EMAIL_KEY, email);
    setAuthToken(token);
    setAuthEmail(email);
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, { method: "POST", headers: { Authorization: `Bearer ${authToken}` } });
    } catch (_) { }
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(EMAIL_KEY);
    setAuthToken(null);
    setAuthEmail("");
    setResponse(null);
    setShowHistory(false);
  };

  if (!authToken) return <AuthScreen onAuth={handleAuth} />;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null); setResponse(null);
    try {
      const res = await fetch(`${API_BASE}/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
        body: JSON.stringify({ Budget_LKR: Number(form.Budget_LKR), Roof_Size_m2: Number(form.Roof_Size_m2), Location: form.Location, Preferred_Brand: form.Preferred_Brand || null, Energy_Usage_kWhPerDay: Number(form.Energy_Usage_kWhPerDay) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setResponse(data);
      setActiveTab("overview");
    } catch (err) {
      setError(err.message || "Connection failed. Is the Flask server running?");
    } finally {
      setLoading(false);
    }
  };

  const cfg = response?.recommended_configuration;
  const rec = response?.recommendations;
  const ml = rec?.ml_predictions;
  const fin = rec?.financial_analysis;
  const clim = rec?.climate_data;

  const budgetLKR = Number(form.Budget_LKR) || 1;
  const panelPrice = rec?.products?.panel?.Price_LKR || 0;
  const predPrice = (ml?.predicted_price_lkr || 0) + panelPrice;
  const isWithinBudget = predPrice <= budgetLKR;
  const budgetDiff = Math.abs(budgetLKR - predPrice);
  const diffWord = predPrice <= budgetLKR ? "Decrease" : "Increase";

  const TABS = [
    { id: "overview", label: "Overview", icon: "⚡" },
    { id: "3d", label: "3D View", icon: "🔆" },
    { id: "price", label: "Price Trend", icon: "📈" },
    { id: "weather", label: "Weather", icon: "🌤" },
    { id: "savings", label: "Savings", icon: "💰" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html,body,#root{width:100%;min-height:100vh}
        body{background:${C.bg};font-family:'DM Sans',sans-serif;color:${C.textPri}}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:${C.surface}}::-webkit-scrollbar-thumb{background:${C.border};border-radius:99px}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(245,166,35,0.15)}50%{box-shadow:0 0 40px rgba(245,166,35,0.3)}}
        .fade-up{animation:fadeUp 0.4s ease both}
        select option{background:${C.card};color:${C.textPri}}
      `}</style>

      {showHistory && <HistoryPanel token={authToken} onClose={() => setShowHistory(false)} />}

      <div style={{ minHeight: "100vh", background: C.bg, padding: "20px 24px" }}>
        {/* ── Header ── */}
        <div style={{ position: "relative", overflow: "hidden", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "28px 32px 24px", marginBottom: 20, animation: "glow 4s ease infinite" }}>
          <SunRays />
          <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: C.accent, marginBottom: 6 }}>AI-Powered · Sri Lanka</div>
              <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(22px,4vw,38px)", fontWeight: 800, color: C.textPri, lineHeight: 1.1, marginBottom: 6 }}>
                Solar PV<br /><span style={{ color: C.accent }}>Recommendation</span> System
              </h1>
              <p style={{ fontSize: 12, color: C.textMuted }}>Machine learning–powered solar analysis with weather data & financial projections</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", background: apiOnline ? "rgba(74,222,128,0.08)" : "rgba(248,113,113,0.08)", border: `1px solid ${apiOnline ? "rgba(74,222,128,0.25)" : "rgba(248,113,113,0.25)"}`, borderRadius: 99 }}>
                <span style={{ fontSize: 8, color: apiOnline ? C.green : C.red, animation: apiOnline ? "pulse 2s infinite" : "none" }}>●</span>
                <span style={{ fontSize: 11, color: apiOnline ? C.green : C.red, fontWeight: 700 }}>{apiOnline ? "API Online" : "API Offline"}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ padding: "5px 12px", background: "rgba(34,211,204,0.08)", border: `1px solid rgba(34,211,204,0.2)`, borderRadius: 99, fontSize: 11, color: C.teal, fontWeight: 600 }}>👤 {authEmail}</div>
                <button onClick={() => setShowHistory(true)} style={{ padding: "5px 12px", background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.25)", borderRadius: 99, fontSize: 11, color: C.accent, fontWeight: 600, cursor: "pointer" }}>📋 History</button>
                <button onClick={handleLogout} style={{ padding: "5px 12px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: 99, fontSize: 11, color: C.red, fontWeight: 600, cursor: "pointer" }}>Sign Out</button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main Layout ── */}
        <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 18, alignItems: "start" }}>
          {/* ── Left: Form ── */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 18px", position: "sticky", top: 20 }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 13, color: C.teal, marginBottom: 18, letterSpacing: "0.05em" }}>⚙️ System Configuration</div>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Field label="Budget (LKR)" required>
                  <Input name="Budget_LKR" type="number" min="0" value={form.Budget_LKR} onChange={handleChange} placeholder="500000" required />
                </Field>
                <Field label="Roof Size (m²)" required>
                  <Input name="Roof_Size_m2" type="number" min="0" step="0.1" value={form.Roof_Size_m2} onChange={handleChange} placeholder="40" required />
                </Field>
              </div>
              <Field label="Energy Usage (kWh/day)" required>
                <Input name="Energy_Usage_kWhPerDay" type="number" min="0" step="0.1" value={form.Energy_Usage_kWhPerDay} onChange={handleChange} placeholder="20" required />
              </Field>
              <Field label="Location" required>
                <SelectInput name="Location" value={form.Location} onChange={handleChange} required>
                  <option value="">Select district...</option>
                  {locationList.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                </SelectInput>
              </Field>
              <Field label="Preferred Brand (optional)">
                <Input name="Preferred_Brand" value={form.Preferred_Brand} onChange={handleChange} placeholder="Longi, JA Solar, SMA..." />
              </Field>
              <div style={{ borderTop: `1px solid ${C.border}`, margin: "14px 0" }} />
              <button type="submit" disabled={loading || apiOnline === false}
                style={{ width: "100%", background: loading ? C.accentDim : C.accent, color: "#000", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 800, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em", padding: "14px 0", cursor: loading || apiOnline === false ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: apiOnline === false ? 0.5 : 1 }}>
                {loading ? (<><div style={{ width: 12, height: 12, border: "2px solid #000", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />Analysing...</>) : "☀️ Get Recommendation"}
              </button>
              {apiOnline === false && <p style={{ color: C.red, fontSize: 11, textAlign: "center", marginTop: 8 }}>Cannot reach Flask server at {API_BASE}</p>}
            </form>
            {error && <div style={{ marginTop: 14, padding: "10px 12px", background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 8, color: C.red, fontSize: 12 }}>⚠️ {error}</div>}
          </div>

          {/* ── Right: Output ── */}
          <div>
            {!response && !loading && (
              <div style={{ background: C.surface, border: `1px dashed ${C.border}`, borderRadius: 14, padding: "60px 40px", textAlign: "center", color: C.textMuted }}>
                <div style={{ fontSize: 52, marginBottom: 14 }}>🌞</div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 18, color: C.textSec, marginBottom: 8 }}>Awaiting your inputs</div>
                <div style={{ fontSize: 13 }}>Fill in the form to generate your personalised solar recommendation with price forecasts, weather analysis & 3D visualisation.</div>
                <div style={{ marginTop: 16, fontSize: 11, color: C.textMuted }}>💾 Results are automatically saved to your account history.</div>
              </div>
            )}

            {response && cfg && (
              <div className="fade-up">
                {/* Summary bar */}
                <div style={{ background: "linear-gradient(135deg, #0b1f10 0%, #0a1824 100%)", border: `1px solid ${C.green}30`, borderRadius: 14, padding: "16px 20px", marginBottom: 14, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 24, color: C.accent }}>{cfg.capacity_kw} kW System</div>
                    <div style={{ fontSize: 11, color: C.textSec, marginTop: 2 }}>Recommended for {rec?.location || form.Location}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <StatusBadge ok={isWithinBudget} text={`${isWithinBudget ? "Within Budget" : "Over Budget"} (${diffWord}: ${fmt(budgetDiff)})`} />
                    <div style={{ padding: "5px 12px", background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.3)", borderRadius: 99, fontSize: 13, fontWeight: 700, color: C.accent }}>{fmt(cfg.total_cost_lkr)}</div>
                  </div>
                </div>

                <ReportButton cfg={cfg} rec={rec} ml={ml} fin={fin} clim={clim} form={form} />

                {/* Tabs */}
                <div style={{ display: "flex", gap: 4, marginBottom: 16, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 4 }}>
                  {TABS.map(({ id, label, icon }) => (
                    <button key={id} onClick={() => setActiveTab(id)}
                      style={{ flex: 1, padding: "8px 4px", background: activeTab === id ? C.card : "transparent", border: activeTab === id ? `1px solid ${C.border}` : "1px solid transparent", borderRadius: 8, color: activeTab === id ? C.accent : C.textMuted, fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: "0.04em", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, transition: "all 0.2s" }}>
                      <span style={{ fontSize: 14 }}>{icon}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>

                {/* Tab: Overview */}
                {activeTab === "overview" && (
                  <div className="fade-up">
                    {ml && (
                      <Section title="ML Prediction Insights" icon="🤖" color={C.teal}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10 }}>
                          <Chip label="Predicted Capacity" value={`${ml.predicted_capacity_kw} kW`} accent={C.teal} />
                          <Chip label="Constrained Cap." value={`${ml.constrained_capacity_kw} kW`} accent={C.teal} />
                          <Chip label="Recommended Brand" value={ml.predicted_brand || "—"} />
                          <Chip label="Predicted Price" value={fmt(predPrice)} accent={C.accent} />
                        </div>
                      </Section>
                    )}
                    <Section title="Selected Products" icon="📦" color={C.accent}>
                      <ProductCard label="Solar Panel" data={rec?.products?.panel} />
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#0a1220", borderRadius: 8, border: `1px solid ${C.border}` }}>
                        <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: C.textSec }}>Total System Cost</span>
                        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 18, color: C.accent }}>{fmt(cfg.total_cost_lkr)}</span>
                      </div>
                    </Section>
                    {fin && (
                      <Section title="Financial Summary" icon="💰" color={C.green}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
                          <Chip label="Monthly Gen." value={fmtN(fin.monthly_generation_kwh, " kWh")} accent={C.teal} />
                          <Chip label="Monthly Savings" value={fmt(fin.monthly_savings_lkr)} accent={C.green} />
                          <Chip label="Payback Period" value={`${fin.payback_years} yrs`} accent={C.accent} />
                        </div>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.textSec, marginBottom: 5 }}>
                            <span style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Budget utilisation <span style={{ textTransform: "none", color: isWithinBudget ? C.green : C.red }}>({diffWord}: {fmt(budgetDiff)})</span></span>
                            <span>{fmt(predPrice)} / {fmt(form.Budget_LKR)}</span>
                          </div>
                          <ProgressBar value={predPrice} max={Number(form.Budget_LKR) || 1} color={isWithinBudget ? C.green : C.red} />
                        </div>
                      </Section>
                    )}
                    {clim && (
                      <Section title={`Climate — ${clim.district}`} icon="🌍" color={C.purple}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 10 }}>
                          <Chip label="Avg GHI" value={`${clim.avg_ghi} kWh/m²`} />
                          <Chip label="Avg Temp" value={`${clim.avg_temp_c}°C`} />
                          <Chip label="Annual Rain" value={fmtN(clim.annual_rain_mm, " mm")} />
                          <Chip label="Wind Stress" value={clim.wind_stress} />
                          <Chip label="Weather Impact" value={clim.weather_impact} />
                        </div>
                      </Section>
                    )}
                  </div>
                )}

                {/* Tab: 3D View */}
                {activeTab === "3d" && (
                  <div className="fade-up">
                    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.accent, marginBottom: 4 }}>🔆 3D Solar Array Visualisation</div>
                      <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 16 }}>Interactive drag-to-rotate 3D panel array based on your system recommendation</div>
                      <Solar3DDisplay
                        capacityKw={cfg.capacity_kw}
                        monthlySavings={fin?.monthly_savings_lkr}
                        coverage={rec?.financial_analysis ? Math.round((fin.monthly_generation_kwh / (form.Energy_Usage_kWhPerDay * 30)) * 100) : 0}
                      />
                    </div>
                  </div>
                )}

                {/* Tab: Price Trend */}
                {activeTab === "price" && (
                  <div className="fade-up">
                    <PricePredictionGraph currentPrice={cfg.total_cost_lkr} predictedPrice={predPrice} />
                  </div>
                )}

                {/* Tab: Weather */}
                {activeTab === "weather" && (
                  <div className="fade-up">
                    <WeatherTrendChart district={clim?.district || form.Location} />
                    <SriLankaMap selectedDistrict={clim?.district || form.Location} />
                  </div>
                )}

                {/* Tab: Savings */}
                {activeTab === "savings" && (
                  <div className="fade-up">
                    <SavingsChart monthlySavings={fin?.monthly_savings_lkr} totalCost={cfg.total_cost_lkr} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}
