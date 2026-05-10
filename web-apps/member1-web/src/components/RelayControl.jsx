/**
 * RelayControl.jsx
 * ================
 * Drop-in relay control panel for a device detail page.
 *
 * Props:
 *   deviceId  – MAC-style string, e.g. "A1B2C3D4E5F6"
 *   apiBase   – your API root, e.g. "http://localhost:8000/api/v1"
 *
 * The component:
 *   1. Fetches initial relay state from GET /relay/state/{deviceId}
 *   2. Listens to the existing WebSocket for live_reading events
 *      (which include relay_on, safety_tripped etc.) so the UI
 *      stays in sync with the device in real-time without polling.
 *   3. Sends commands via POST /relay/command
 *
 * Usage (in your device detail page):
 *   import RelayControl from "@/components/RelayControl";
 *   <RelayControl deviceId={device.device_id} apiBase="/api/v1" />
 */

import { useState, useEffect, useRef, useCallback } from "react";

// ── tiny helper ──────────────────────────────────────────────────────────────
function normalizeId(id = "") {
  return id.replace(/:/g, "").toUpperCase();
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function RelayControl({ deviceId, apiBase = "/api/v1", wsUrl = null }) {
  const normId = normalizeId(deviceId);

  // ── state ────────────────────────────────────────────────────────────────
  const [relayOn,        setRelayOn]        = useState(false);
  const [safetyTripped,  setSafetyTripped]  = useState(false);
  const [safetyReason,   setSafetyReason]   = useState("");
  const [safetyEnabled,  setSafetyEnabled]  = useState(true);
  const [customMaxW,     setCustomMaxW]     = useState(2300);
  const [customMaxA,     setCustomMaxA]     = useState(9.0);
  const [loading,        setLoading]        = useState(false);
  const [initLoading,    setInitLoading]    = useState(true);
  const [error,          setError]          = useState(null);
  const [lastCmdResult,  setLastCmdResult]  = useState(null);

  // limit editor
  const [editLimits,  setEditLimits]  = useState(false);
  const [draftMaxW,   setDraftMaxW]   = useState(2300);
  const [draftMaxA,   setDraftMaxA]   = useState(9.0);

  const wsRef = useRef(null);

  // ── apply state from any source (fetch or websocket) ─────────────────────
  const applyState = useCallback((data) => {
    if (data.relay_on       !== undefined) setRelayOn(!!data.relay_on);
    if (data.safety_tripped !== undefined) setSafetyTripped(!!data.safety_tripped);
    if (data.safety_reason  !== undefined) setSafetyReason(data.safety_reason  || "");
    if (data.safety_enabled !== undefined) setSafetyEnabled(!!data.safety_enabled);
    if (data.custom_max_w   !== undefined) setCustomMaxW(data.custom_max_w);
    if (data.custom_max_a   !== undefined) setCustomMaxA(data.custom_max_a);
  }, []);

  // ── initial fetch ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!normId) return;
    setInitLoading(true);
    fetch(`${apiBase}/relay/state/${normId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data) => {
        applyState(data);
        setDraftMaxW(data.custom_max_w ?? 2300);
        setDraftMaxA(data.custom_max_a ?? 9.0);
      })
      .catch(() => {
        // device may be offline — silently ok, WS will update when it comes online
      })
      .finally(() => setInitLoading(false));
  }, [normId, apiBase, applyState]);

  // ── WebSocket listener (reads live_reading events that include relay state) ─
  useEffect(() => {
    if (!wsUrl) return;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        // live_reading events carry the full relay state from the device
        if (msg.type === "live_reading" && msg.data) {
          const d = msg.data;
          // Only update if this reading is from our device
          if (!d.device_id || normalizeId(d.device_id) === normId) {
            applyState(d);
          }
        }
      } catch (_) {}
    };

    ws.onerror = () => {};
    return () => ws.close();
  }, [wsUrl, normId, applyState]);

  // ── send command ──────────────────────────────────────────────────────────
  const sendCommand = useCallback(async (action, extras = {}) => {
    setLoading(true);
    setError(null);
    setLastCmdResult(null);
    try {
      const res = await fetch(`${apiBase}/relay/command`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ device_id: normId, action, ...extras }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Command failed");
      setLastCmdResult(`✓ ${action} sent`);

      // Optimistic UI update — the live reading will confirm shortly
      if (action === "on")           setRelayOn(true);
      if (action === "off")          setRelayOn(false);
      if (action === "reset_safety") setSafetyTripped(false);
      if (action === "set_limits") {
        if (extras.max_w !== undefined) setCustomMaxW(extras.max_w);
        if (extras.max_a !== undefined) setCustomMaxA(extras.max_a);
        setEditLimits(false);
      }
      if (action === "safety_on")  setSafetyEnabled(true);
      if (action === "safety_off") setSafetyEnabled(false);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [normId, apiBase]);

  // ── sub-components ────────────────────────────────────────────────────────

  const Badge = ({ on }) => (
    <span style={{
      display:       "inline-flex",
      alignItems:    "center",
      gap:           6,
      padding:       "4px 12px",
      borderRadius:  20,
      fontSize:      13,
      fontWeight:    500,
      background:    on ? "rgba(76, 175, 80, 0.1)" : "rgba(158, 158, 158, 0.1)",
      color:         on ? "#4caf50" : "#9e9e9e",
      border:        `1px solid ${on ? "#4caf50" : "#9e9e9e"}`,
      transition:    "all 0.25s",
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: "50%",
        background: on ? "#4caf50" : "#9e9e9e",
        flexShrink: 0,
      }}/>
      {on ? "ON — Live" : "OFF — Safe"}
    </span>
  );

  const Btn = ({ onClick, disabled, children, variant = "default" }) => {
    const styles = {
      default:  { background: "rgba(255, 255, 255, 0.05)", color: "inherit", border: "1px solid rgba(255, 255, 255, 0.1)" },
      danger:   { background: "rgba(244, 67, 54, 0.1)",    color: "#f44336", border: "1px solid #f44336" },
      success:  { background: "rgba(76, 175, 80, 0.1)",   color: "#4caf50", border: "1px solid #4caf50" },
      warning:  { background: "rgba(255, 152, 0, 0.1)",   color: "#ff9800", border: "1px solid #ff9800" },
      primary:  { background: "#2196f3",                  color: "#fff",    border: "none" },
    };
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        style={{
          ...styles[variant],
          padding:      "8px 18px",
          borderRadius: "8px",
          fontSize:     14,
          fontWeight:   500,
          cursor:       disabled ? "not-allowed" : "pointer",
          opacity:      disabled ? 0.5 : 1,
          transition:   "opacity 0.15s",
          outline:      "none",
          whiteSpace:   "nowrap",
        }}
      >
        {children}
      </button>
    );
  };

  // ── render ────────────────────────────────────────────────────────────────
  if (initLoading) {
    return (
      <div style={{ padding: "20px 0", color: "#888", fontSize: 14 }}>
        Loading relay state…
      </div>
    );
  }

  return (
    <div style={{
      display:      "flex",
      flexDirection:"column",
      gap:          16,
      padding:      "20px 0",
    }}>

      {/* ── Main relay toggle ─────────────────────────────────────── */}
      <div style={{
        display:       "flex",
        alignItems:    "center",
        gap:           16,
        padding:       "16px 20px",
        background:    "rgba(255, 255, 255, 0.03)",
        borderRadius:  "12px",
        border:        "1px solid rgba(255, 255, 255, 0.08)",
        flexWrap:      "wrap",
      }}>
        <div style={{ flex: 1, minWidth: 160 }}>
          <p style={{ margin: 0, fontWeight: 500, fontSize: 15 }}>
            Relay power
          </p>
          <p style={{ margin: "2px 0 8px", fontSize: 12, color: "#888" }}>
            Controls the physical relay on GPIO 23
          </p>
          <Badge on={relayOn} />
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {safetyTripped ? (
            <>
              <Btn variant="warning" onClick={() => sendCommand("reset_safety")} disabled={loading}>
                Reset safety latch
              </Btn>
            </>
          ) : (
            <>
              <Btn
                variant={relayOn ? "danger" : "success"}
                onClick={() => sendCommand(relayOn ? "off" : "on")}
                disabled={loading}
              >
                {loading ? "Sending…" : relayOn ? "Turn OFF" : "Turn ON"}
              </Btn>
            </>
          )}
        </div>
      </div>

      {/* ── Safety trip banner ────────────────────────────────────── */}
      {safetyTripped && (
        <div style={{
          padding:      "12px 16px",
          borderRadius: "8px",
          background:   "rgba(244, 67, 54, 0.1)",
          border:       "1px solid #f44336",
          color:        "#f44336",
          fontSize:     13,
        }}>
          <strong>Safety trip active:</strong> {safetyReason || "Unknown reason"}.
          {" "}Click <em>Reset safety latch</em> above, then turn on again.
        </div>
      )}

      {/* ── Error / result feedback ───────────────────────────────── */}
      {error && (
        <div style={{
          padding:      "10px 14px",
          borderRadius: "8px",
          background:   "rgba(244, 67, 54, 0.1)",
          color:        "#f44336",
          fontSize:     13,
        }}>
          {error}
        </div>
      )}
      {lastCmdResult && !error && (
        <div style={{
          padding:      "10px 14px",
          borderRadius: "8px",
          background:   "rgba(76, 175, 80, 0.1)",
          color:        "#4caf50",
          fontSize:     13,
        }}>
          {lastCmdResult}
        </div>
      )}

      {/* ── Limits panel ──────────────────────────────────────────── */}
      <div style={{
        padding:      "14px 20px",
        background:   "rgba(255, 255, 255, 0.03)",
        borderRadius: "12px",
        border:       "1px solid rgba(255, 255, 255, 0.08)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: editLimits ? 14 : 0 }}>
          <div>
            <p style={{ margin: 0, fontWeight: 500, fontSize: 14 }}>
              Safety limits
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>
              Max {customMaxW}W · Max {customMaxA}A · Safety {safetyEnabled ? "enabled" : "disabled"}
            </p>
          </div>
          <Btn onClick={() => { setEditLimits(!editLimits); setDraftMaxW(customMaxW); setDraftMaxA(customMaxA); }}>
            {editLimits ? "Cancel" : "Edit"}
          </Btn>
        </div>

        {editLimits && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, color: "#aaa" }}>
                Max power (W)
                <input
                  type="number"
                  min={1} max={2300}
                  value={draftMaxW}
                  onChange={(e) => setDraftMaxW(Number(e.target.value))}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    background: "rgba(0, 0, 0, 0.2)",
                    color: "#fff",
                    fontSize: 14,
                    width: 120,
                  }}
                />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, color: "#aaa" }}>
                Max current (A)
                <input
                  type="number"
                  min={0.1} max={9.0} step={0.1}
                  value={draftMaxA}
                  onChange={(e) => setDraftMaxA(Number(e.target.value))}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    background: "rgba(0, 0, 0, 0.2)",
                    color: "#fff",
                    fontSize: 14,
                    width: 120,
                  }}
                />
              </label>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Btn
                variant="primary"
                onClick={() => sendCommand("set_limits", { max_w: draftMaxW, max_a: draftMaxA })}
                disabled={loading}
              >
                Save limits
              </Btn>
              <Btn
                variant={safetyEnabled ? "warning" : "success"}
                onClick={() => sendCommand(safetyEnabled ? "safety_off" : "safety_on")}
                disabled={loading}
              >
                {safetyEnabled ? "Disable safety monitoring" : "Enable safety monitoring"}
              </Btn>
              <Btn onClick={() => sendCommand("reset_energy")} disabled={loading}>
                Reset energy counter
              </Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
