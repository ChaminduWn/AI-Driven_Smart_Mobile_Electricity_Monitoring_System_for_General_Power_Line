import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ElectricBolt,
  ReportProblem,
  WbSunny,
  Security,
  FilterList,
  Download,
  ShowChart,
  Map as MapIcon,
  LocationOn,
  Visibility,
  Person,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Sri Lankan Districts
const SRI_LANKAN_DISTRICTS = [
  'All Districts',
  'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo',
  'Galle', 'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara',
  'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar',
  'Matale', 'Matara', 'Moneragala', 'Mullaitivu', 'Nuwara Eliya',
  'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya'
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedDistrict, setSelectedDistrict] = useState('All Districts');
  const [stats, setStats] = useState({
    totalHouseholds: 0,
    activeOutages: 0,
    solarAssessments: 0,
    safetyAlerts: 0,
  });
  const [districtSummary, setDistrictSummary] = useState([]);

  useEffect(() => {
    // Fetch dashboard stats
    setStats({
      totalHouseholds: 150,
      activeOutages: 12,
      solarAssessments: 45,
      safetyAlerts: 8,
    });

    // Sample district summary data
    setDistrictSummary([
      {
        district: 'Colombo',
        technicianReports: 5,
        householderReports: 3,
        date: '2024-01-03',
        id: 'COL-001',
      },
      {
        district: 'Gampaha',
        technicianReports: 2,
        householderReports: 4,
        date: '2024-01-03',
        id: 'GAM-001',
      },
      {
        district: 'Kandy',
        technicianReports: 1,
        householderReports: 2,
        date: '2024-01-02',
        id: 'KAN-001',
      },
    ]);
  }, [selectedDistrict]);

  // Sample data for energy consumption chart
  const energyData = [
    { month: 'Jan', consumption: 4000 },
    { month: 'Feb', consumption: 3000 },
    { month: 'Mar', consumption: 5000 },
    { month: 'Apr', consumption: 4500 },
    { month: 'May', consumption: 6000 },
    { month: 'Jun', consumption: 5500 },
  ];

  // Sample outage locations for map
  const outageLocations = [
    { id: 1, lat: 6.9271, lng: 79.8612, district: 'Colombo', status: 'NEW' },
    { id: 2, lat: 7.2906, lng: 80.6337, district: 'Kandy', status: 'PENDING' },
    { id: 3, lat: 6.0329, lng: 80.2170, district: 'Galle', status: 'NEW' },
  ];

  const cards = [
    {
      title: selectedDistrict === 'All Districts' ? 'Total Households in Sri Lanka' : `Total Households in ${selectedDistrict}`,
      value: stats.totalHouseholds,
      icon: <ElectricBolt />,
      color: '#1976d2',
    },
    { title: 'Active Outages', value: stats.activeOutages, icon: <ReportProblem />, color: '#d32f2f' },
    { title: 'Solar Assessments', value: stats.solarAssessments, icon: <WbSunny />, color: '#f57c00' },
    { title: 'Safety Alerts', value: stats.safetyAlerts, icon: <Security />, color: '#388e3c' },
  ];

  const handleDistrictClick = (district) => {
    navigate(`/district/${district}`);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" color="text.primary">
          Dashboard Overview
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>District Filter</InputLabel>
            <Select
              value={selectedDistrict}
              label="District Filter"
              onChange={(e) => setSelectedDistrict(e.target.value)}
            >
              {SRI_LANKAN_DISTRICTS.map((district) => (
                <MenuItem key={district} value={district}>
                  {district}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<Download />}
            sx={{ textTransform: 'none' }}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
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
              <Typography variant="body2" sx={{ opacity: 0.9, textAlign: 'center' }}>
                {card.title}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Charts and Map Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Energy Consumption Trends */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ShowChart sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6" fontWeight="bold">
                Energy Consumption Trends
              </Typography>
            </Box>
            <Box sx={{ height: 250, mt: 2 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={energyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip />
                  <Line type="monotone" dataKey="consumption" stroke="#1976d2" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Live Outage Map */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <MapIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="bold">
                  Live Outage Map
                </Typography>
              </Box>
              <Chip
                label={`${stats.activeOutages} Active`}
                color="error"
                size="small"
                sx={{ fontWeight: 'bold' }}
              />
            </Box>
            <Box sx={{ height: 250, borderRadius: 1, overflow: 'hidden' }}>
              <MapContainer
                center={[7.8731, 80.7718]}
                zoom={7}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {outageLocations.map((outage) => (
                  <Marker key={outage.id} position={[outage.lat, outage.lng]}>
                    <Popup>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {outage.district}
                        </Typography>
                        <Chip
                          label={outage.status}
                          size="small"
                          color={outage.status === 'NEW' ? 'warning' : 'info'}
                          sx={{ mt: 1 }}
                        />
                      </Box>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Activities Table */}
      <Paper elevation={2} sx={{ borderRadius: 2 }}>
        <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight="bold">
            District-wise Summary
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell><strong>Location</strong></TableCell>
                <TableCell align="center"><strong>Reported by Technician</strong></TableCell>
                <TableCell align="center"><strong>Reported by Householder</strong></TableCell>
                <TableCell><strong>Reported Date</strong></TableCell>
                <TableCell align="center"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {districtSummary.map((row, index) => (
                <TableRow
                  key={row.id}
                  hover
                  sx={{
                    '&:hover .view-button': {
                      opacity: 1,
                    },
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOn color="primary" fontSize="small" />
                      <Typography variant="body2" fontWeight="medium">
                        {row.district}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={row.technicianReports}
                      size="small"
                      sx={{
                        bgcolor: '#ff9800',
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={row.householderReports}
                      size="small"
                      sx={{
                        bgcolor: '#1976d2',
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(row.date).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View District Details">
                      <IconButton
                        className="view-button"
                        size="small"
                        onClick={() => handleDistrictClick(row.district)}
                        sx={{
                          opacity: 0,
                          transition: 'opacity 0.2s',
                          color: 'primary.main',
                        }}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}