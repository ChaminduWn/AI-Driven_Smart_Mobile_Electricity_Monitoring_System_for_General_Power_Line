import {
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Box,
  Divider,
} from "@mui/material";

import SolarPowerIcon from "@mui/icons-material/SolarPower";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import BatteryChargingFullIcon from "@mui/icons-material/BatteryChargingFull";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";

export default function BestSystemConfiguration({ config }) {
  if (!config) return null;

  return (
    <Card sx={{ borderRadius: 3, mb: 4 }}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          ✅ Best System Configuration
        </Typography>

        <Typography color="text.secondary" mb={2}>
          Optimized solar system based on your budget, roof size & energy usage
        </Typography>

        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          {/* SYSTEM SIZE */}
          <Grid item xs={12} md={3}>
            <Box>
              <SolarPowerIcon color="primary" />
              <Typography fontWeight="bold">System Size</Typography>
              <Typography color="text.secondary">
                {config.system_size_kw} kW
              </Typography>
            </Box>
          </Grid>

          {/* PANELS */}
          <Grid item xs={12} md={3}>
            <Box>
              <WbSunnyIcon color="warning" />
              <Typography fontWeight="bold">Solar Panels</Typography>
              <Typography color="text.secondary">
                {config.panel_count} Panels
              </Typography>
              <Chip
                label={config.panel_brand}
                size="small"
                sx={{ mt: 1 }}
              />
            </Box>
          </Grid>

          {/* INVERTER */}
          <Grid item xs={12} md={3}>
            <Box>
              <ShowChartIcon color="success" />
              <Typography fontWeight="bold">Inverter</Typography>
              <Typography color="text.secondary">
                {config.inverter_type}
              </Typography>
              <Chip
                label={config.inverter_brand}
                size="small"
                sx={{ mt: 1 }}
              />
            </Box>
          </Grid>

          {/* BATTERY */}
          <Grid item xs={12} md={3}>
            <Box>
              <BatteryChargingFullIcon color="secondary" />
              <Typography fontWeight="bold">Battery</Typography>
              <Typography color="text.secondary">
                {config.battery_capacity_kwh} kWh
              </Typography>
              <Chip
                label={config.battery_brand}
                size="small"
                sx={{ mt: 1 }}
              />
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* COST & OUTPUT */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box>
              <MonetizationOnIcon color="primary" />
              <Typography fontWeight="bold">Total Estimated Cost</Typography>
              <Typography color="primary" fontSize={18}>
                LKR {config.total_cost_lkr.toLocaleString()}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box>
              <ShowChartIcon color="success" />
              <Typography fontWeight="bold">
                Estimated Daily Energy Output
              </Typography>
              <Typography color="success.main" fontSize={18}>
                {config.estimated_daily_output_kwh} kWh / day
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
