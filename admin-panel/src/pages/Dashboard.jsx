import React, { useEffect, useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
} from '@mui/material';
import {
  ElectricBolt,
  ReportProblem,
  WbSunny,
  Security,
} from '@mui/icons-material';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalHouseholds: 0,
    activeOutages: 0,
    solarAssessments: 0,
    safetyAlerts: 0,
  });

  useEffect(() => {
    // Fetch dashboard stats from all services
    setStats({
      totalHouseholds: 150,
      activeOutages: 12,
      solarAssessments: 45,
      safetyAlerts: 8,
    });
  }, []);

  const cards = [
    { title: 'Total Households', value: stats.totalHouseholds, icon: <ElectricBolt />, color: '#1976d2' },
    { title: 'Active Outages', value: stats.activeOutages, icon: <ReportProblem />, color: '#d32f2f' },
    { title: 'Solar Assessments', value: stats.solarAssessments, icon: <WbSunny />, color: '#f57c00' },
    { title: 'Safety Alerts', value: stats.safetyAlerts, icon: <Security />, color: '#388e3c' },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard Overview
      </Typography>
      <Grid container spacing={3}>
        {cards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper
              elevation={2}
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: `linear-gradient(135deg, ${card.color} 0%, ${card.color}dd 100%)`,
                color: 'white',
                borderRadius: 2,
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                },
              }}
            >
              <Box sx={{ fontSize: 48, mb: 1 }}>{card.icon}</Box>
              <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
                {card.value}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, textAlign: 'center' }}>
                {card.title}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}