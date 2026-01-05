import React from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Chip
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import SolarPowerIcon from "@mui/icons-material/SolarPower";

export default function Member3Dashboard() {
  return (
    <Box sx={{ p: 4, backgroundColor: "#f5f7fb", minHeight: "100vh" }}>
      
      {/* Header */}
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        ☀️ Solar Power Recommendation System
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={4}>
        Smart weather-based solar feasibility and cost recommendation dashboard
      </Typography>

      <Grid container spacing={3}>

        {/* Location & Map Section */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <LocationOnIcon sx={{ verticalAlign: "middle" }} /> Location & Weather
              </Typography>

              {/* Map Placeholder */}
              <Box
                sx={{
                  height: 220,
                  backgroundImage:
                    "url(https://images.unsplash.com/photo-1500530855697-b586d89ba3ee)",
                  backgroundSize: "cover",
                  borderRadius: 2,
                  mb: 2
                }}
              />

              <Typography variant="body2">
                Select your <b>district and city</b> using the map to view
                monthly temperature changes and climate trends.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Temperature & Suitability */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <ShowChartIcon sx={{ verticalAlign: "middle" }} /> Climate Analysis
              </Typography>

              <Typography variant="body2" mb={2}>
                Monthly temperature variation and minimum temperature prediction
              </Typography>

              <Box mb={2}>
                <Chip label="Min Temp: 24°C" color="primary" sx={{ mr: 1 }} />
                <Chip label="Max Temp: 32°C" color="secondary" />
              </Box>

              <Typography variant="body1" fontWeight="bold" color="green">
                ✔ Suitable for Solar Installation
              </Typography>

              <Typography variant="body2" mt={1}>
                Climate conditions are favourable for installing a solar power system.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Solar Power Input */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <SolarPowerIcon sx={{ verticalAlign: "middle" }} /> Solar Power Requirement
              </Typography>

              <TextField
                fullWidth
                label="Required Power Output (kW)"
                placeholder="Example: 5 kW"
                sx={{ my: 2 }}
              />

              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={<WbSunnyIcon />}
              >
                Get Solar Cost Recommendation
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Cost Prediction */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                💰 Estimated Installation Cost
              </Typography>

              <Typography variant="body2">• Solar Panels: LKR 450,000</Typography>
              <Typography variant="body2">• Inverter: LKR 180,000</Typography>
              <Typography variant="body2">• Battery (Optional): LKR 220,000</Typography>
              <Typography variant="body2">• Wiring & Safety: LKR 50,000</Typography>
              <Typography variant="body2">• Labour Cost: LKR 60,000</Typography>

              <Typography variant="h6" mt={2} color="primary">
                Total Estimated Cost: LKR 960,000
              </Typography>
            </CardContent>
          </Card>
        </Grid>

      </Grid>
    </Box>
  );
}
