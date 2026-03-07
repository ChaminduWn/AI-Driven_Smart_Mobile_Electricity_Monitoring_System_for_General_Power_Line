import { useState, useEffect, useRef } from "react";

const API_BASE = "http://localhost:5000";

const C = {
  bg:        "#060b14",
  surface:   "#0d1424",
  card:      "#111c2e",
  border:    "#1a2d45",
  accent:    "#f5a623",
  accentDim: "#c17d0e",
  teal:      "#22d3cc",
  red:       "#f87171",
  green:     "#4ade80",
  purple:    "#a78bfa",
  blue:      "#60a5fa",
  textPri:   "#f0f4ff",
  textSec:   "#8ea0bb",
  textMuted: "#3e5470",
};

const CLIMATE_DATA = {
  Colombo:      { Jan_Mar:5.2, Apr_Jun:5.0, Jul_Sep:4.8, Oct_Dec:5.1, temp:28.5, rain:2390, wind:"Low",      impact:"Low",      lat:6.9271,  lng:79.8612 },
  Kandy:        { Jan_Mar:4.8, Apr_Jun:4.6, Jul_Sep:4.4, Oct_Dec:4.7, temp:24.0, rain:1900, wind:"Medium",   impact:"Medium",   lat:7.2906,  lng:80.6337 },
  Galle:        { Jan_Mar:5.1, Apr_Jun:4.9, Jul_Sep:4.7, Oct_Dec:5.0, temp:27.5, rain:2300, wind:"Low",      impact:"Low",      lat:6.0535,  lng:80.2210 },
  Jaffna:       { Jan_Mar:5.8, Apr_Jun:5.6, Jul_Sep:5.4, Oct_Dec:5.7, temp:30.0, rain:1000, wind:"High",     impact:"Medium",   lat:9.6615,  lng:80.0255 },
  Anuradhapura: { Jan_Mar:5.5, Apr_Jun:5.3, Jul_Sep:5.1, Oct_Dec:5.4, temp:30.5, rain:900,  wind:"Medium",   impact:"Low",      lat:8.3114,  lng:80.4037 },
  Kurunegala:   { Jan_Mar:5.2, Apr_Jun:5.0, Jul_Sep:4.8, Oct_Dec:5.1, temp:29.0, rain:1500, wind:"Medium",   impact:"Low",      lat:7.4818,  lng:80.3609 },
  Batticaloa:   { Jan_Mar:5.4, Apr_Jun:5.2, Jul_Sep:5.0, Oct_Dec:5.3, temp:29.5, rain:1650, wind:"High",     impact:"Medium",   lat:7.7170,  lng:81.7000 },
  Badulla:      { Jan_Mar:4.5, Apr_Jun:4.3, Jul_Sep:4.1, Oct_Dec:4.4, temp:20.0, rain:2100, wind:"High",     impact:"High",     lat:6.9934,  lng:81.0550 },
  Ratnapura:    { Jan_Mar:4.6, Apr_Jun:4.4, Jul_Sep:4.2, Oct_Dec:4.5, temp:26.0, rain:3700, wind:"Medium",   impact:"High",     lat:6.6828,  lng:80.3992 },
  Hambantota:   { Jan_Mar:5.9, Apr_Jun:6.0, Jul_Sep:6.2, Oct_Dec:5.1, temp:33.5, rain:1100, wind:"Very High",impact:"Very Low", lat:6.1429,  lng:81.1212 },
  Gampaha:      { Jan_Mar:5.4, Apr_Jun:4.6, Jul_Sep:4.8, Oct_Dec:4.3, temp:32.0, rain:2100, wind:"Medium",   impact:"High",     lat:7.0840,  lng:80.0098 },
  Kalutara:     { Jan_Mar:5.2, Apr_Jun:4.3, Jul_Sep:4.5, Oct_Dec:4.1, temp:30.5, rain:3200, wind:"High",     impact:"Very High",lat:6.5854,  lng:79.9607 },
  Matale:       { Jan_Mar:4.9, Apr_Jun:4.3, Jul_Sep:4.5, Oct_Dec:4.1, temp:30.2, rain:1800, wind:"Low",      impact:"Medium",   lat:7.4675,  lng:80.6234 },
  "Nuwara Eliya":{ Jan_Mar:4.2,Apr_Jun:3.7, Jul_Sep:3.5, Oct_Dec:3.4, temp:15.8, rain:2500, wind:"Med-High", impact:"Very High",lat:6.9497,  lng:80.7891 },
  Matara:       { Jan_Mar:5.2, Apr_Jun:4.4, Jul_Sep:4.5, Oct_Dec:4.2, temp:30.5, rain:2400, wind:"High",     impact:"High",     lat:5.9549,  lng:80.5550 },
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

function BarChart({ data, labels, color, height = 80 }) {
  const max = Math.max(...data) || 1;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <div style={{ width: "100%", height: `${(v / max) * (height - 18)}px`, background: color, borderRadius: "3px 3px 0 0", transition: "height 0.8s cubic-bezier(.4,0,.2,1)", opacity: 0.85 }} />
          <span style={{ fontSize: 9, color: C.textMuted, whiteSpace: "nowrap" }}>{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

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
    <div
      onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
      style={{ cursor: dragging ? "grabbing" : "grab", userSelect: "none" }}
    >
      <div style={{ textAlign: "center", fontSize: 10, color: C.textMuted, marginBottom: 8, letterSpacing: "0.1em" }}>
        ↔ DRAG TO ROTATE
      </div>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 220, perspective: "600px" }}>
        <div style={{ transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`, transformStyle: "preserve-3d", transition: dragging ? "none" : "transform 0.3s ease" }}>
          {/* Base/ground shadow */}
          <div style={{
            position: "absolute", width: cols * (panelW + gap), height: rows * (panelH + gap),
            background: "radial-gradient(ellipse, rgba(245,166,35,0.15) 0%, transparent 70%)",
            transform: "rotateX(90deg) translateZ(-30px)",
            borderRadius: 8,
          }} />
          {/* Panel grid */}
          {Array.from({ length: rows }).map((_, r) =>
            Array.from({ length: cols }).map((_, c) => {
              const idx = r * cols + c;
              if (idx >= panels) return null;
              return (
                <div key={`${r}-${c}`} style={{
                  position: "absolute",
                  left: c * (panelW + gap),
                  top: r * (panelH + gap),
                  width: panelW, height: panelH,
                  background: "linear-gradient(135deg, #0a1628 0%, #112240 40%, #0d1e35 100%)",
                  border: "1px solid #1e3a5f",
                  borderRadius: 4,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(34,211,204,0.1)",
                  display: "grid", gridTemplateColumns: "repeat(6,1fr)", gridTemplateRows: "repeat(4,1fr)",
                  gap: 2, padding: 6,
                  transformStyle: "preserve-3d",
                }}>
                  {Array.from({ length: 24 }).map((_, ci) => (
                    <div key={ci} style={{
                      background: `linear-gradient(135deg, #1e3a5f, #0d2444)`,
                      borderRadius: 1, border: "0.5px solid #22d3cc22",
                    }} />
                  ))}
                  {/* Shimmer effect */}
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(45deg, transparent 30%, rgba(34,211,204,0.08) 50%, transparent 70%)", borderRadius: 4 }} />
                </div>
              );
            })
          )}
          {/* Frame/mounting structure */}
          <div style={{
            position: "absolute",
            left: -8, top: -8,
            width: cols * (panelW + gap) + 16,
            height: rows * (panelH + gap) + 16,
            border: "2px solid #c17d0e66",
            borderRadius: 6,
            background: "transparent",
          }} />
          {/* Side face for 3D depth */}
          <div style={{
            position: "absolute", left: cols * (panelW + gap) - 8, top: -8,
            width: 16, height: rows * (panelH + gap) + 16,
            background: "linear-gradient(90deg, #c17d0e44, #c17d0e22)",
            transform: "rotateY(-90deg) translateX(8px)",
            transformOrigin: "left center",
          }} />
        </div>
      </div>
      {/* Stats under 3D */}
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

// ─── Price Prediction Graph ───────────────────────────────────────────
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

      {/* Price comparison cards */}
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

      {/* SVG line chart */}
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
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(y => (
            <line key={y} x1="0" y1={y} x2="340" y2={y} stroke={C.border} strokeWidth="0.5" />
          ))}
          {/* Historical line (first 4 points = historical) */}
          {(() => {
            const pts4 = prices.slice(0, 4).map((p, i) => {
              const x = (i / 6) * 340;
              const y = 95 - ((p - Math.min(...prices)) / (Math.max(...prices) - Math.min(...prices))) * 90;
              return `${x},${y}`;
            });
            return (
              <>
                <polyline points={pts4.join(" ")} fill="none" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round" />
                <polyline points={`0,100 ${pts4.join(" ")} ${(3/6)*340},100`} fill="url(#priceGrad)" stroke="none" />
              </>
            );
          })()}
          {/* Forecast line (last 4 points = includes "Now") */}
          {(() => {
            const pts4 = prices.slice(3, 7).map((p, i) => {
              const x = ((i + 3) / 6) * 340;
              const y = 95 - ((p - Math.min(...prices)) / (Math.max(...prices) - Math.min(...prices))) * 90;
              return `${x},${y}`;
            });
            return (
              <>
                <polyline points={pts4.join(" ")} fill="none" stroke={C.teal} strokeWidth="2" strokeDasharray="6,3" strokeLinecap="round" />
                <polyline points={`${(3/6)*340},100 ${pts4.join(" ")} 340,100`} fill="url(#predGrad)" stroke="none" />
              </>
            );
          })()}
          {/* Data points with labels */}
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
          {/* "Now" vertical line */}
          <line x1={(3/6)*340} y1="0" x2={(3/6)*340} y2="100" stroke={C.accent} strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />
        </svg>
        <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: C.textSec }}>
            <div style={{ width: 16, height: 2, background: C.accent, borderRadius: 1 }} /> Historical
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: C.textSec }}>
            <div style={{ width: 16, height: 2, background: C.teal, borderRadius: 1, borderTop: "2px dashed" }} /> Forecast
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Weather Trend Chart ──────────────────────────────────────────────
function WeatherTrendChart({ district }) {
  const data = CLIMATE_DATA[district];
  if (!data) return null;

  const ghiData = [data.Jan_Mar, data.Apr_Jun, data.Jul_Sep, data.Oct_Dec];
  const quarters = ["Jan–Mar", "Apr–Jun", "Jul–Sep", "Oct–Dec"];
  const maxGHI = 7;

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px 20px", marginBottom: 16 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.purple, marginBottom: 4 }}>
        🌤 Weather Trends — {district}
      </div>
      <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 14 }}>Quarterly solar irradiance (GHI kWh/m²/day)</div>

      {/* GHI Quarter bars */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 16 }}>
        {ghiData.map((v, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.teal, marginBottom: 4 }}>{v.toFixed(1)}</div>
            <div style={{ height: 60, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
              <div style={{
                background: `linear-gradient(to top, ${C.teal}88, ${C.teal}33)`,
                borderRadius: "3px 3px 0 0",
                height: `${(v / maxGHI) * 60}px`,
                border: `1px solid ${C.teal}44`,
                transition: "height 1s ease",
              }} />
            </div>
            <div style={{ fontSize: 9, color: C.textMuted, marginTop: 4 }}>{quarters[i]}</div>
          </div>
        ))}
      </div>

      {/* Climate metrics */}
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

      {/* Avg GHI sparkline */}
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

// ─── Sri Lanka Weather Map ────────────────────────────────────────────
function SriLankaMap({ selectedDistrict }) {
  const districts = Object.entries(CLIMATE_DATA);
  // Normalise lat/lng to SVG coords (approximate bounding box)
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
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.blue, marginBottom: 4 }}>
        🗺️ Solar Irradiance Map — Sri Lanka
      </div>
      <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 14 }}>Annual average GHI by district</div>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <svg width="200" height="260" style={{ flexShrink: 0 }}>
          {/* Simplified Sri Lanka outline */}
          <path d="M100,12 L130,18 L155,35 L170,60 L178,95 L175,130 L170,165 L160,200 L140,230 L115,248 L95,248 L70,235 L52,210 L40,180 L35,148 L38,115 L45,82 L60,55 L80,30 Z"
            fill="#0a1628" stroke="#1e3a5f" strokeWidth="1.5" />
          {/* District dots */}
          {districts.map(([name, d]) => {
            const avgGhi = (d.Jan_Mar + d.Apr_Jun + d.Jul_Sep + d.Oct_Dec) / 4;
            const { x, y } = toSVG(d.lat, d.lng);
            const isSelected = name === selectedDistrict;
            return (
              <g key={name}>
                <circle cx={x} cy={y} r={isSelected ? 10 : 6}
                  fill={ghiColor(avgGhi)} fillOpacity={0.8}
                  stroke={isSelected ? C.accent : "transparent"} strokeWidth={isSelected ? 2 : 0}
                  style={{ filter: isSelected ? "drop-shadow(0 0 4px rgba(245,166,35,0.8))" : "none" }} />
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
        {/* Legend + district list */}
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

// ─── Savings Over Years ───────────────────────────────────────────────
function SavingsChart({ monthlySavings, totalCost }) {
  if (!monthlySavings || !totalCost) return null;
  const annualSavings = monthlySavings * 12;
  const years = [1, 2, 3, 5, 7, 10, 15, 20, 25];
  const cumulative = years.map(y => annualSavings * y);
  const maxVal = cumulative[cumulative.length - 1];
  const breakEvenYear = totalCost / annualSavings;

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px 20px", marginBottom: 16 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.green, marginBottom: 4 }}>
        💰 Savings Over Years
      </div>
      <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 14 }}>
        Cumulative savings projection · Break-even at {breakEvenYear.toFixed(1)} years
      </div>

      {/* Bar chart */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 100, marginBottom: 12 }}>
        {years.map((y, i) => {
          const isAboveBreakEven = y >= breakEvenYear;
          const barHeight = (cumulative[i] / maxVal) * 88;
          return (
            <div key={y} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <div style={{ fontSize: 8, color: isAboveBreakEven ? C.green : C.textMuted, fontWeight: isAboveBreakEven ? 700 : 400 }}>
                {cumulative[i] >= 1000000 ? `${(cumulative[i]/1000000).toFixed(1)}M` : `${(cumulative[i]/1000).toFixed(0)}k`}
              </div>
              <div style={{
                width: "100%", height: `${barHeight}px`,
                background: isAboveBreakEven
                  ? `linear-gradient(to top, ${C.green}cc, ${C.green}44)`
                  : `linear-gradient(to top, ${C.teal}66, ${C.teal}22)`,
                borderRadius: "3px 3px 0 0",
                border: `1px solid ${isAboveBreakEven ? C.green : C.teal}44`,
                position: "relative",
                transition: "height 1s ease",
              }}>
                {/* Break-even marker */}
                {y >= Math.ceil(breakEvenYear) && y - 1 < breakEvenYear && (
                  <div style={{ position: "absolute", top: -4, left: "50%", transform: "translateX(-50%)", width: 6, height: 6, background: C.accent, borderRadius: "50%" }} />
                )}
              </div>
              <span style={{ fontSize: 8, color: C.textMuted }}>{y}yr</span>
            </div>
          );
        })}
      </div>

      {/* Break-even annotation */}
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

// ─── Report Download ──────────────────────────────────────────────────
function ReportButton({ cfg, rec, ml, fin, clim, form }) {
  const handleDownload = () => {
    const lines = [
      "═══════════════════════════════════════════════════",
      "        SOLAR PV RECOMMENDATION REPORT",
      "═══════════════════════════════════════════════════",
      `Date: ${new Date().toLocaleDateString("en-LK")}`,
      `Location: ${clim?.district || form?.Location}`,
      "",
      "── SYSTEM RECOMMENDATION ──",
      `System Capacity: ${cfg?.capacity_kw} kW`,
      `Panel: ${cfg?.panel_brand_model}`,
      `Total Cost: ${fmt(cfg?.total_cost_lkr)}`,
      `Budget Status: ${cfg?.within_budget ? "✓ Within Budget" : "✗ Over Budget"}`,
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
    <button
      onClick={handleDownload}
      style={{
        width: "100%", padding: "14px 0", marginBottom: 16,
        background: "linear-gradient(135deg, #1e3a5f, #0d2444)",
        border: `1px solid ${C.teal}44`,
        borderRadius: 10, color: C.teal,
        fontSize: 13, fontWeight: 700, letterSpacing: "0.08em",
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        transition: "all 0.2s",
        fontFamily: "'Barlow Condensed', sans-serif",
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = C.teal}
      onMouseLeave={e => e.currentTarget.style.borderColor = `${C.teal}44`}
    >
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

function Select({ children, ...props }) {
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

function StatusBadge({ ok }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 99, fontSize: 10, fontWeight: 700, background: ok ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)", color: ok ? C.green : C.red, border: `1px solid ${ok ? "rgba(74,222,128,0.25)" : "rgba(248,113,113,0.25)"}` }}>
      <span style={{ fontSize: 8 }}>●</span>{ok ? "Within Budget" : "Over Budget"}
    </span>
  );
}
const PARTNER_LOGOS = [
  {
    name: "Solis Group",
    img: "data:image/png;base64,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fMHej07mlji5wDc7p4hrWDHHic589l2P6Eq9D01xhqq+Cs9LfG5pjYW7u6COOfMLfFhEREWUREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREX//Z",
  },
  {
    name: "LHP Energy Holdings",
    img: "data:image/png;base64,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",
  },
  {
    name: "Hayleys Solar",
    img: "data:image/png;base64,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",
  },
  {
    name: "Sri Lanka Sustainable Energy Authority",
    img: "data:image/jpeg;base64,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fCfxq0cWniPT911ECLXULU7Lq3J/ut6Zz8rblr4h+JX7B3j7wlNPP4b+y+LtLxk+R+4ux/2zb5W/4C//AACv0sxTdvvWFWhCt8R5eJy7D4r4z8VvEPhHxB4SufK1rRNQ0qX/AKfbKSH/ANCWseH/AEm58qL9/L/zxj+eT/vla/b7yh/EF/Kjyh/CF/KuP6hH+Y8T/V9c38U/IvwV+zr8S/Hvkf2X4Q1ARf8AP1fR/Y4P97dJt3f8B3V9W/Br9gDTdFnt9V+Id5D4gu4/9XpVoG+yJ/10ZvmlP/fK+1fZIjHYCnNkAYreGFhA7sPk+Hovml7xVtLSHTrWKGGKKCGIYSOP5ERau0UV2H0C02CiiigYUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAJRilooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA/9k=",
  },
  {
    name: "Surya Bala Sangamaya",
    img: "data:image/png;base64,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",
  },
  {
    name: "Ministry of Energy",
    img: "data:image/png;base64,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",
  },
];

// ─── Footer ───────────────────────────────────────────────────────────
function Footer() {
  return (
    <div style={{ marginTop: 40, borderTop: `1px solid ${C.border}`, paddingTop: 28 }}>
      <div
        style={{
          textAlign: "center",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: C.textMuted,
          marginBottom: 20,
        }}
      >
        Partner Institutions &amp; Acknowledgements
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {PARTNER_LOGOS.map(({ name, img }) => (
          <div
            key={name}
            style={{
              background: "#ffffff",
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              padding: "10px 16px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              width: 160,
              height: 90,
            }}
          >
            <img
              src={img}
              alt={name}
              title={name}
              style={{
                maxWidth: "100%",
                maxHeight: 60,
                objectFit: "contain",
              }}
            />
          </div>
        ))}
      </div>

      <div
        style={{
          textAlign: "center",
          fontSize: 10,
          color: C.textMuted,
          paddingBottom: 16,
        }}
      >
        Solar PV Recommendation System · Powered by Machine Learning &amp; Climate Data · Sri Lanka
      </div>
    </div>
  );
}

// ─── Auth Context & Helpers ───────────────────────────────────────────
const TOKEN_KEY = "solar_auth_token";
const EMAIL_KEY = "solar_auth_email";

// ─── Login / Register Screen ──────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode, setMode]       = useState("login"); // "login" | "register"
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [success, setSuccess] = useState(null);

  const [showPass, setShowPass]    = useState(false);
  const [focusedField, setFocused] = useState(null);

  const iStyle = (field) => ({
    width: "100%", padding: "11px 14px", borderRadius: 8,
    border: `1.5px solid ${focusedField === field ? C.teal : C.border}`,
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
      // Store token
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
      {/* Background sun rays */}
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
        {/* Logo / Title */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>☀️</div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 800, color: C.textPri, lineHeight: 1.1, marginBottom: 6 }}>
            Solar PV <span style={{ color: C.accent }}>Recommendation</span>
          </h1>
          <p style={{ fontSize: 12, color: C.textMuted }}>AI-Powered Solar Analysis · Sri Lanka</p>
        </div>

        {/* Card */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "28px 28px 24px", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
          {/* Tab switcher */}
          <div style={{ display: "flex", background: C.card, borderRadius: 10, padding: 4, marginBottom: 24 }}>
            {["login", "register"].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(null); setSuccess(null); }}
                style={{ flex: 1, padding: "9px 0", borderRadius: 7, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, letterSpacing: "0.06em", textTransform: "capitalize", transition: "all 0.2s",
                  background: mode === m ? C.accent : "transparent",
                  color: mode === m ? "#000" : C.textMuted,
                }}>
                {m === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          {/* Fields */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.textSec, marginBottom: 6 }}>Email Address</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={iStyle("email")}
              onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
            />
          </div>

          <div style={{ marginBottom: mode === "register" ? 14 : 20 }}>
            <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.textSec, marginBottom: 6 }}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                placeholder={mode === "register" ? "Min. 6 characters" : "Your password"}
                style={{ ...iStyle("password"), paddingRight: 40 }}
                onFocus={() => setFocused("password")} onBlur={() => setFocused(null)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
              />
              <button onClick={() => setShowPass(v => !v)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.textMuted, fontSize: 13 }}>
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {mode === "register" && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.textSec, marginBottom: 6 }}>Confirm Password</label>
              <input
                type={showPass ? "text" : "password"} value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat password"
                style={iStyle("confirm")}
                onFocus={() => setFocused("confirm")} onBlur={() => setFocused(null)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
              />
            </div>
          )}

          {/* Error / Success */}
          {error && (
            <div style={{ marginBottom: 14, padding: "10px 12px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: 8, color: C.red, fontSize: 12 }}>
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div style={{ marginBottom: 14, padding: "10px 12px", background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 8, color: C.green, fontSize: 12 }}>
              ✅ {success}
            </div>
          )}

          {/* Submit */}
          <button onClick={handleSubmit} disabled={loading}
            style={{ width: "100%", padding: "14px 0", background: loading ? C.accentDim : C.accent, color: "#000", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 800, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {loading
              ? <><div style={{ width: 13, height: 13, border: "2px solid #000", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />Processing...</>
              : mode === "login" ? "☀️ Sign In" : "🌟 Create Account"
            }
          </button>
        </div>

        <p style={{ textAlign: "center", fontSize: 11, color: C.textMuted, marginTop: 18 }}>
          Solar PV Recommendation System · Sri Lanka
        </p>
      </div>
    </div>
  );
}

// ─── History Panel ────────────────────────────────────────────────────
function HistoryPanel({ token, onClose }) {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/predictions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { setPredictions(d.predictions || []); setLoading(false); })
      .catch(() => { setError("Could not load history."); setLoading(false); });
  }, [token]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(6,11,20,0.85)", zIndex: 100, display: "flex", alignItems: "flex-start", justifyContent: "flex-end", padding: 20 }}>
      <div className="fade-up" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, width: "100%", maxWidth: 540, maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "18px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: C.accent }}>📋 Prediction History</div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3 }}>All your past solar recommendations</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.textSec, fontSize: 20, cursor: "pointer", padding: "4px 8px", borderRadius: 6 }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px" }}>
          {loading && <div style={{ textAlign: "center", color: C.textMuted, padding: 40, fontSize: 13 }}>Loading history...</div>}
          {error && <div style={{ color: C.red, fontSize: 12, padding: 16 }}>⚠️ {error}</div>}
          {!loading && !error && predictions.length === 0 && (
            <div style={{ textAlign: "center", color: C.textMuted, padding: 40 }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🌞</div>
              <div style={{ fontSize: 13 }}>No predictions yet. Submit your first recommendation!</div>
            </div>
          )}
          {predictions.map((p, i) => (
            <div key={p.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 16, color: C.accent }}>
                  {p.capacity_kw} kW · {p.location}
                </div>
                <div style={{ fontSize: 9, color: C.textMuted }}>
                  {new Date(p.created).toLocaleDateString("en-LK", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
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
              <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                <span style={{ fontSize: 9, padding: "3px 8px", borderRadius: 99, background: p.within_budget ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)", color: p.within_budget ? C.green : C.red, border: `1px solid ${p.within_budget ? "rgba(74,222,128,0.25)" : "rgba(248,113,113,0.25)"}`, fontWeight: 700 }}>
                  {p.within_budget ? "✓ Within Budget" : "✗ Over Budget"}
                </span>
                <span style={{ fontSize: 9, padding: "3px 8px", borderRadius: 99, background: "rgba(245,166,35,0.08)", color: C.accent, border: "1px solid rgba(245,166,35,0.2)", fontWeight: 700 }}>
                  Budget: Rs. {Number(p.budget_lkr).toLocaleString("en-LK")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────
export default function App() {
  const locationList = Object.keys(CLIMATE_DATA);

  // ── ALL hooks must come first — before any conditional returns ──
  const [authToken, setAuthToken] = useState(() => sessionStorage.getItem(TOKEN_KEY));
  const [authEmail, setAuthEmail] = useState(() => sessionStorage.getItem(EMAIL_KEY) || "");
  const [showHistory, setShowHistory] = useState(false);

  const [form, setForm] = useState({ Budget_LKR: "", Roof_Size_m2: "", Location: "", Preferred_Brand: "", Energy_Usage_kWhPerDay: "" });
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError]       = useState(null);
  const [apiOnline, setApiOnline] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then(r => r.ok ? setApiOnline(true) : setApiOnline(false))
      .catch(() => setApiOnline(false));
  }, []);

  // ── Auth handlers ──
  const handleAuth = (token, email) => {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(EMAIL_KEY, email);
    setAuthToken(token);
    setAuthEmail(email);
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
      });
    } catch (_) {}
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(EMAIL_KEY);
    setAuthToken(null);
    setAuthEmail("");
    setResponse(null);
    setShowHistory(false);
  };

  // ── If not logged in, show auth screen (safe — all hooks already called above) ──
  if (!authToken) return <AuthScreen onAuth={handleAuth} />;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null); setResponse(null);
    try {
      const res = await fetch(`${API_BASE}/recommend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
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

  const cfg  = response?.recommended_configuration;
  const rec  = response?.recommendations;
  const ml   = rec?.ml_predictions;
  const fin  = rec?.financial_analysis;
  const clim = rec?.climate_data;

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
            {/* Right side: user info + controls */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
              {/* API status */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", background: apiOnline ? "rgba(74,222,128,0.08)" : "rgba(248,113,113,0.08)", border: `1px solid ${apiOnline ? "rgba(74,222,128,0.25)" : "rgba(248,113,113,0.25)"}`, borderRadius: 99 }}>
                <span style={{ fontSize: 8, color: apiOnline ? C.green : C.red, animation: apiOnline ? "pulse 2s infinite" : "none" }}>●</span>
                <span style={{ fontSize: 11, color: apiOnline ? C.green : C.red, fontWeight: 700 }}>{apiOnline ? "API Online" : "API Offline"}</span>
              </div>
              {/* User badge + actions */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ padding: "5px 12px", background: "rgba(34,211,204,0.08)", border: `1px solid rgba(34,211,204,0.2)`, borderRadius: 99, fontSize: 11, color: C.teal, fontWeight: 600 }}>
                  👤 {authEmail}
                </div>
                <button onClick={() => setShowHistory(true)}
                  style={{ padding: "5px 12px", background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.25)", borderRadius: 99, fontSize: 11, color: C.accent, fontWeight: 600, cursor: "pointer" }}>
                  📋 History
                </button>
                <button onClick={handleLogout}
                  style={{ padding: "5px 12px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: 99, fontSize: 11, color: C.red, fontWeight: 600, cursor: "pointer" }}>
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main layout ── */}
        <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 18, alignItems: "start" }}>

          {/* ── Left: Form ── */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 18px", position: "sticky", top: 20 }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 13, color: C.teal, marginBottom: 18, letterSpacing: "0.05em" }}>
              ⚙️ System Configuration
            </div>
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
                <Select name="Location" value={form.Location} onChange={handleChange} required>
                  <option value="">Select district...</option>
                  {locationList.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                </Select>
              </Field>
              <Field label="Preferred Brand (optional)">
                <Input name="Preferred_Brand" value={form.Preferred_Brand} onChange={handleChange} placeholder="Longi, JA Solar, SMA..." />
              </Field>
              <div style={{ borderTop: `1px solid ${C.border}`, margin: "14px 0" }} />
              <button
                type="submit"
                disabled={loading || apiOnline === false}
                style={{ width: "100%", background: loading ? C.accentDim : C.accent, color: "#000", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 800, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em", padding: "14px 0", cursor: loading || apiOnline === false ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: apiOnline === false ? 0.5 : 1 }}
              >
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
                <div style={{ marginTop: 16, fontSize: 11, color: C.textMuted }}>
                  💾 Results are automatically saved to your account history.
                </div>
              </div>
            )}

            {response && cfg && (
              <div className="fade-up">
                {/* ── Summary bar ── */}
                <div style={{ background: "linear-gradient(135deg, #0b1f10 0%, #0a1824 100%)", border: `1px solid ${C.green}30`, borderRadius: 14, padding: "16px 20px", marginBottom: 14, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 24, color: C.accent }}>{cfg.capacity_kw} kW System</div>
                    <div style={{ fontSize: 11, color: C.textSec, marginTop: 2 }}>Recommended for {rec?.location || form.Location}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <StatusBadge ok={cfg.within_budget} />
                    <div style={{ padding: "5px 12px", background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.3)", borderRadius: 99, fontSize: 13, fontWeight: 700, color: C.accent }}>{fmt(cfg.total_cost_lkr)}</div>
                  </div>
                </div>

                {/* ── Download Report ── */}
                <ReportButton cfg={cfg} rec={rec} ml={ml} fin={fin} clim={clim} form={form} />

                {/* ── Tabs ── */}
                <div style={{ display: "flex", gap: 4, marginBottom: 16, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 4 }}>
                  {TABS.map(({ id, label, icon }) => (
                    <button key={id} onClick={() => setActiveTab(id)}
                      style={{ flex: 1, padding: "8px 4px", background: activeTab === id ? C.card : "transparent", border: activeTab === id ? `1px solid ${C.border}` : "1px solid transparent", borderRadius: 8, color: activeTab === id ? C.accent : C.textMuted, fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: "0.04em", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, transition: "all 0.2s" }}>
                      <span style={{ fontSize: 14 }}>{icon}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>

                {/* ── Tab: Overview ── */}
                {activeTab === "overview" && (
                  <div className="fade-up">
                    {ml && (
                      <Section title="ML Prediction Insights" icon="🤖" color={C.teal}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10 }}>
                          <Chip label="Predicted Capacity" value={`${ml.predicted_capacity_kw} kW`} accent={C.teal} />
                          <Chip label="Constrained Cap." value={`${ml.constrained_capacity_kw} kW`} accent={C.teal} />
                          <Chip label="Recommended Brand" value={ml.predicted_brand || "—"} />
                          <Chip label="Predicted Price" value={fmt(ml.predicted_price_lkr)} accent={C.accent} />
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
                            <span style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Budget utilisation</span>
                            <span>{fmt(cfg.total_cost_lkr)} / {fmt(form.Budget_LKR)}</span>
                          </div>
                          <ProgressBar value={cfg.total_cost_lkr} max={Number(form.Budget_LKR)} color={cfg.within_budget ? C.green : C.red} />
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

                {/* ── Tab: 3D View ── */}
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

                
                {activeTab === "price" && (
                  <div className="fade-up">
                    <PricePredictionGraph currentPrice={cfg.total_cost_lkr} predictedPrice={ml?.predicted_price_lkr} />
                  </div>
                )}

               
                {activeTab === "weather" && (
                  <div className="fade-up">
                    <WeatherTrendChart district={clim?.district || form.Location} />
                    <SriLankaMap selectedDistrict={clim?.district || form.Location} />
                  </div>
                )}

                
                {activeTab === "savings" && (
                  <div className="fade-up">
                    <SavingsChart monthlySavings={fin?.monthly_savings_lkr} totalCost={cfg.total_cost_lkr} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <Footer />
      </div>
    </>
  );
}