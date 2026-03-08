import React, { useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Chip,
  MenuItem,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

import LocationOnIcon from "@mui/icons-material/LocationOn";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import SolarPowerIcon from "@mui/icons-material/SolarPower";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BoltIcon from "@mui/icons-material/Bolt";
import BatteryChargingFullIcon from "@mui/icons-material/BatteryChargingFull";
import SettingsSuggestIcon from "@mui/icons-material/SettingsSuggest";
import ThumbUpAltIcon from "@mui/icons-material/ThumbUpAlt";
import ThumbDownAltIcon from "@mui/icons-material/ThumbDownAlt";
import InfoIcon from "@mui/icons-material/Info";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";

const USD_TO_LKR_RATE = 320;

/* ================= LOGIC & HELPERS ================= */
function getProsAndCons({ panel, inverter, battery, isSurplus }) {
  const pros = [];
  const cons = [];
  if (panel.details.efficiency_percent > 20) pros.push("High-efficiency panels minimize footprint.");
  if (inverter.details.type.toLowerCase().includes("hybrid")) pros.push("Hybrid inverter supports future-proof storage.");
  if (battery.details.capacity_kwh > 10) pros.push("High capacity battery for extended backup.");
  if (isSurplus) pros.push("System fits comfortably within your financial plan.");
  if (panel.details.efficiency_percent <= 18) cons.push("Lower efficiency may require more roof space.");
  if (!isSurplus) cons.push("Initial investment exceeds the specified budget.");
  if (battery.details.capacity_kwh < 5) cons.push("Limited night-time autonomy.");
  return { pros, cons };
}

/* ================= STYLED COMPONENTS ================= */
const GlassCard = (props) => (
  <Card
    {...props}
    sx={{
      borderRadius: 4,
      background: "rgba(255, 255, 255, 0.9)",
      backdropFilter: "blur(10px)",
      boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.07)",
      border: "1px solid rgba(255, 255, 255, 0.18)",
      transition: "transform 0.2s ease-in-out",
      "&:hover": { transform: "translateY(-4px)" },
      height: '100%',
      ...props.sx,
    }}
  />
);

/* ================= COMPONENT: BEST RECOMMENDATION (DETAILED) ================= */
function BestRecommendationSummary({ data, form }) {
  const panel = data.recommendations.panels[0];
  const inverter = data.recommendations.inverters[0];
  const battery = data.recommendations.batteries[0];

  const apiTotalCostUSD = data?.recommended_configuration?.total_cost ?? null;
  const totalCostLKR = apiTotalCostUSD ? apiTotalCostUSD * USD_TO_LKR_RATE : null;
  const userBudgetLKR = Number(form.Budget_LKR) || 0;
  const budgetDifferenceLKR = totalCostLKR !== null ? userBudgetLKR - totalCostLKR : null;
  const isSurplus = budgetDifferenceLKR !== null && budgetDifferenceLKR >= 0;

  const { pros, cons } = getProsAndCons({ panel, inverter, battery, isSurplus });

  return (
    <GlassCard sx={{ mb: 6, overflow: "hidden", height: 'auto', border: '2px solid #4caf50' }}>
      <Box sx={{ p: 3, background: "linear-gradient(90deg, #1b5e20 0%, #4caf50 100%)", color: "#fff" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" alignItems="center" spacing={1}>
            <CheckCircleIcon />
            <Typography variant="h5" fontWeight="700">Best System Configuration</Typography>
          </Stack>
          
        </Stack>
      </Box>

      <CardContent sx={{ p: 4 }}>
        <Grid container spacing={4}>
          {/* Left Side: Strategic Analysis & Logic */}
          <Grid item xs={12} md={7}>
            <Typography variant="h6" fontWeight="700" color="primary" gutterBottom>Strategic System Analysis</Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              {isSurplus 
                ? `Budget Match: You are saving LKR ${Math.abs(budgetDifferenceLKR).toLocaleString()} compared to your ceiling.`
                : `Investment Note: This premium setup is LKR ${Math.abs(budgetDifferenceLKR).toLocaleString()} over the target budget.`}
            </Typography>

            {/* Detailed Hardware Breakdown */}
            <Stack spacing={2} sx={{ mb: 4 }}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: '#f8f9fa' }}>
                <Stack direction="row" spacing={2} alignItems="start">
                  <WbSunnyIcon color="warning" />
                  <Box>
                    <Typography variant="subtitle2" fontWeight="800">{panel.brand} (Solar Brand)</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {panel.details.power_w}W High-Efficiency Output • {panel.details.efficiency_percent}% Cell Conversion
                    </Typography>
                  </Box>
                </Stack>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: '#f8f9fa' }}>
                <Stack direction="row" spacing={2} alignItems="start">
                  <BoltIcon color="primary" />
                  <Box>
                    <Typography variant="subtitle2" fontWeight="800">{inverter.brand} (Power Conversion)</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {inverter.details.type} Logic • {inverter.details.efficiency_percent}% Inversion Efficiency
                    </Typography>
                  </Box>
                </Stack>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: '#f8f9fa' }}>
                <Stack direction="row" spacing={2} alignItems="start">
                  <BatteryChargingFullIcon color="success" />
                  <Box>
                    <Typography variant="subtitle2" fontWeight="800">{battery.brand} (Energy Storage)</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {battery.details.capacity_kwh}kWh Storage Capacity • Deep Cycle LFP Technology
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Stack>

            <Divider sx={{ my: 2 }} />

            {/* Pros and Cons */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" fontWeight="700" display="flex" alignItems="center" gap={1} color="success.main">
                  <ThumbUpAltIcon fontSize="small" /> System Advantages
                </Typography>
                {pros.map((p, i) => <Typography key={i} variant="caption" display="block" sx={{ mt: 0.5 }}>• {p}</Typography>)}
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" fontWeight="700" display="flex" alignItems="center" gap={1} color="error.main">
                  <ThumbDownAltIcon fontSize="small" /> Technical Considerations
                </Typography>
                {cons.map((c, i) => <Typography key={i} variant="caption" display="block" sx={{ mt: 0.5 }}>• {c}</Typography>)}
              </Grid>
            </Grid>
          </Grid>

          {/* Right Side: Financial Overview */}
          <Grid item xs={12} md={5}>
            <Stack spacing={2} sx={{ height: '100%', justifyContent: 'center' }}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 4, 
                  bgcolor: isSurplus ? "#f1f8e9" : "#fff5f5", 
                  borderRadius: 4, 
                  textAlign: 'center', 
                  border: `1px dashed ${isSurplus ? "#4caf50" : "#f44336"}` 
                }}
              >
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>TOTAL ESTIMATED INVESTMENT</Typography>
                <Typography variant="h3" fontWeight="900" sx={{ color: isSurplus ? "#2e7d32" : "#d32f2f", my: 1 }}>
                  {totalCostLKR ? `LKR ${totalCostLKR.toLocaleString()}` : "N/A"}
                </Typography>
                <Chip 
                  label={isSurplus ? "WITHIN BUDGET LIMITS" : "EXCEEDS BUDGET CEILING"} 
                  color={isSurplus ? "success" : "error"} 
                  sx={{ fontWeight: "bold", px: 2 }} 
                />
              </Paper>

              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  *Prices are based on a current exchange rate of 1 USD = {USD_TO_LKR_RATE} LKR. 
                  Includes standard installation estimates.
                </Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </CardContent>
    </GlassCard>
  );
}

/* ================= MAIN DASHBOARD ================= */
export default function Member3Dashboard() {
  const API_BASE = "http://localhost:5000";
  const locations = [
    "Western Province (Colombo)", "Central Province (Kandy)", "Southern Province (Galle)",
    "North Western Province (Kurunegala)", "North Central Province (Anuradhapura)",
    "Eastern Province (Batticaloa)", "Northern Province (Jaffna)", "Uva Province (Badulla)",
    "Sabaragamuwa Province (Ratnapura)",
  ];

  const [form, setForm] = useState({ User_ID: "API_User", Budget_LKR: "", Roof_Size_m2: "", Location: "", Energy_Usage_kWhPerDay: "" });
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    setLoading(true); setError(null); setResponse(null);
    try {
      const res = await fetch(`${API_BASE}/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          Budget_LKR: Number(form.Budget_LKR),
          Roof_Size_m2: Number(form.Roof_Size_m2),
          Energy_Usage_kWhPerDay: Number(form.Energy_Usage_kWhPerDay),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw data;
      setResponse(data);
    } catch (err) {
      setError(err.error || "Connection Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f0f4f8", pt: 4, pb: 10 }}>
      <Container maxWidth="xl">
        <Box textAlign="center" mb={6}>
          <Typography variant="h3" fontWeight="900" sx={{ color: "#1a237e", mb: 1 }}>
            Solar <Box component="span" sx={{ color: "#4caf50" }}>Recommendation System</Box>
          </Typography>
          <Typography variant="h6" color="text.secondary">Supports smart grid integration by managing decentralized energy</Typography>
        </Box>

        <Grid container spacing={4} sx={{ mb: 6 }}>
          <Grid item xs={12} md={4}>
            <GlassCard sx={{ p: 2 }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={3}>
                  <SettingsSuggestIcon color="primary" />
                  <Typography variant="h6" fontWeight="700">System Parameters</Typography>
                </Stack>
                <Stack spacing={2.5}>
                  <TextField select fullWidth label="Location" name="Location" value={form.Location} onChange={handleChange}>
                    {locations.map((loc) => <MenuItem key={loc} value={loc}>{loc}</MenuItem>)}
                  </TextField>
                  <TextField fullWidth label="Budget (LKR)" name="Budget_LKR" type="number" value={form.Budget_LKR} onChange={handleChange} />
                  <TextField fullWidth label="Roof Area (m²)" name="Roof_Size_m2" type="number" value={form.Roof_Size_m2} onChange={handleChange} />
                  <TextField fullWidth label="Daily kWh Usage" name="Energy_Usage_kWhPerDay" type="number" value={form.Energy_Usage_kWhPerDay} onChange={handleChange} />
                  <Button variant="contained" size="large" onClick={handleSubmit} disabled={loading} sx={{ py: 2, borderRadius: 3, fontWeight: "bold", bgcolor: "#2e7d32", "&:hover": { bgcolor: "#1b5e20" } }} fullWidth>
                    {loading ? <CircularProgress size={24} color="inherit" /> : "Generate Analysis"}
                  </Button>
                  {error && <Typography color="error" textAlign="center">{error}</Typography>}
                </Stack>
              </CardContent>
            </GlassCard>
          </Grid>
          <Grid item xs={12} md={8}>
            <Box sx={{ height: "100%", borderRadius: 4, background: "url('https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=1000') center/cover", display: "flex", alignItems: "flex-end", p: 4, minHeight: 400 }}>
              <Paper sx={{ p: 3, background: "rgba(0,0,0,0.7)", color: "#fff", backdropFilter: "blur(6px)", borderRadius: 3, width: '100%' }}>
                <Typography variant="h5" fontWeight="bold">Optimizing the Prosumer Experience</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>Our system optimizes decentralized energy by recommending the right solar setup for every user.</Typography>
              </Paper>
            </Box>
          </Grid>
        </Grid>

        {response && (
          <Box>
            <BestRecommendationSummary data={response} form={form} />
            
            {["panels", "inverters", "batteries", "installers"].map((key) => (
              <Box key={key} sx={{ mb: 8 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 4 }}>
                  <Typography variant="h5" fontWeight="800" sx={{ textTransform: 'capitalize', color: '#1a237e' }}>
                    {key === "panels" && <WbSunnyIcon sx={{ mr: 1, color: '#fbc02d' }} />}
                    {key === "inverters" && <BoltIcon sx={{ mr: 1, color: '#1976d2' }} />}
                    {key === "batteries" && <BatteryChargingFullIcon sx={{ mr: 1, color: '#4caf50' }} />}
                    {key === "installers" && <LocationOnIcon sx={{ mr: 1, color: '#d32f2f' }} />}
                     {key}
                  </Typography>
                  <Chip label="Top 5" color="secondary" size="small" variant="filled" />
                </Stack>

                {/* EQUAL MAGNITUDE GRID (5 COLUMNS) */}
                <Grid container spacing={2} columns={{ xs: 1, sm: 2, md: 5 }}>
                  {response.recommendations[key].slice(0, 5).map((item) => (
                    <Grid item xs={1} sm={1} md={1} key={item.id}>
                      <GlassCard sx={{ textAlign: 'center', p: 2, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="overline" fontWeight="900" color="text.disabled">Tier {item.rank}</Typography>
                          <Typography variant="h6" fontWeight="800" sx={{ mt: 1, mb: 2, height: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {item.brand}
                          </Typography>
                          <Divider sx={{ mb: 2 }} />
                        </Box>
                        <Button 
                          fullWidth variant="outlined" size="medium" color="primary" sx={{ borderRadius: 2, fontWeight: 'bold' }}
                          onClick={() => setSelectedItem({ ...item, type: key.slice(0, -1) })}
                        >
                          Technical Specs
                        </Button>
                      </GlassCard>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            ))}
          </Box>
        )}

        {/* DIALOG FOR DETAILS */}
        <Dialog open={Boolean(selectedItem)} onClose={() => setSelectedItem(null)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
          <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon color="primary" /> {selectedItem?.type?.toUpperCase()} Info
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="h5" color="primary" fontWeight="bold">{selectedItem?.brand}</Typography>
              <Divider />
              {selectedItem?.type === "panel" && (
                <>
                  <Typography><b>Power Output:</b> {selectedItem.details.power_w}W</Typography>
                  <Typography><b>Cell Efficiency:</b> {selectedItem.details.efficiency_percent}%</Typography>
                  <Typography><b>Technology:</b> Monocrystalline PERC</Typography>
                </>
              )}
              {selectedItem?.type === "inverter" && (
                <>
                  <Typography><b>Inverter Type:</b> {selectedItem.details.type}</Typography>
                  <Typography><b>Max Efficiency:</b> {selectedItem.details.efficiency_percent}%</Typography>
                  <Typography><b>Warranty:</b> 10 Years</Typography>
                </>
              )}
              {selectedItem?.type === "battery" && (
                <>
                  <Typography><b>Usable Capacity:</b> {selectedItem.details.capacity_kwh} kWh</Typography>
                  <Typography><b>Chemistry:</b> Lithium Iron Phosphate (LFP)</Typography>
                  <Typography><b>Cycle Life:</b> 6000+ Cycles</Typography>
                </>
              )}
              {selectedItem?.type === "installer" && (
                <>
                  <Typography><b>Service Area:</b> {selectedItem.details.location}</Typography>
                  <Typography><b>User Rating:</b> ⭐ {selectedItem.details.rating} / 5.0</Typography>
                  <Typography><b>Accreditation:</b> SLSEA Certified</Typography>
                </>
              )}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setSelectedItem(null)} variant="contained" fullWidth sx={{ borderRadius: 2, bgcolor: '#1a237e', py: 1.5 }}>Close Details</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
