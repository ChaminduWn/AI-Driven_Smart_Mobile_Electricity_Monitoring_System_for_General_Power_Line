import React from 'react';
import { Grid, Paper, Typography, Box, CircularProgress } from '@mui/material';
import {
  ReportProblem,
  CheckCircle,
} from '@mui/icons-material';

export default function OutageStats({ stats, loading }) {
  const statCards = [
    {
      title: 'Total Outages',
      value: stats.totalOutages,
      icon: <ReportProblem />,
      color: '#d32f2f',
    },
    {
      title: 'Active Outages',
      value: stats.activeOutages,
      icon: <ReportProblem />,
      color: '#f57c00',
    },
    {
      title: 'Resolved',
      value: stats.resolvedOutages,
      icon: <CheckCircle />,
      color: '#388e3c',
    },
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Grid container spacing={3} sx={{ mt: 1 }}>
      {statCards.map((card, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              bgcolor: card.color,
              color: 'white',
              minHeight: 120,
            }}
          >
            <Box sx={{ fontSize: 40, mb: 1 }}>{card.icon}</Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              {card.value}
            </Typography>
            <Typography variant="body2" sx={{ textAlign: 'center', mt: 1 }}>
              {card.title}
            </Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}