import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Box, Paper, Typography, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel, Grid } from '@mui/material';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { ShowChart } from '@mui/icons-material';

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons
const outageIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const technicianIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Default center for Sri Lanka
const defaultCenter = [7.8731, 80.7718];

// Sample energy consumption data
const energyData = [
  { month: 'Jan', consumption: 4000 },
  { month: 'Feb', consumption: 3000 },
  { month: 'Mar', consumption: 5000 },
  { month: 'Apr', consumption: 4500 },
  { month: 'May', consumption: 6000 },
  { month: 'Jun', consumption: 5500 },
];

export default function OutageMapView({ outages, technicians, onAssignTechnician, onUpdateOutage }) {
  const [selectedOutage, setSelectedOutage] = useState(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState('');

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open':
      case 'NEW': return 'error';
      case 'Assigned':
      case 'In Progress':
      case 'PENDING': return 'warning';
      case 'Resolved':
      case 'RESOLVED': return 'success';
      default: return 'default';
    }
  };

  const availableTechnicians = technicians.filter(t => 
    t.availability === 'Available' || t.availability === 'available'
  );

  const handleAssignClick = (outage) => {
    setSelectedOutage(outage);
    setAssignDialogOpen(true);
  };

  const handleAssign = () => {
    if (selectedOutage && selectedTechnician) {
      onAssignTechnician(selectedOutage.id || selectedOutage.issueId, selectedTechnician);
      setAssignDialogOpen(false);
      setSelectedOutage(null);
      setSelectedTechnician('');
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Live Outage Map
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Red markers: Outages | Blue markers: Technicians
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        {/* Energy Consumption Trends Graph */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ShowChart sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6" fontWeight="bold">
                Energy Consumption Trends
              </Typography>
            </Box>
            <Box sx={{ height: 300, mt: 2 }}>
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
              <Typography variant="h6" fontWeight="bold">
                Live Outage Map
              </Typography>
              <Chip
                label={`${outages.filter(o => o.status === 'Open' || o.status === 'NEW').length} Active`}
                color="error"
                size="small"
                sx={{ fontWeight: 'bold' }}
              />
            </Box>
            <Box sx={{ height: 300, borderRadius: 1, overflow: 'hidden' }}>
              <MapContainer
                center={defaultCenter}
                zoom={8}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Outage Markers */}
                {outages.map((outage) => (
                  <Marker
                    key={outage.id || outage.issueId}
                    position={[parseFloat(outage.latitude), parseFloat(outage.longitude)]}
                    icon={outageIcon}
                  >
                    <Popup>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          Outage #{outage.issueId || outage.id}
                        </Typography>
                        <Typography variant="body2">
                          Status: <Chip label={outage.status} color={getStatusColor(outage.status)} size="small" />
                        </Typography>
                        <Typography variant="body2">
                          District: {outage.district || 'N/A'}
                        </Typography>
                        {outage.address && (
                          <Typography variant="body2">
                            Address: {outage.address}
                          </Typography>
                        )}
                      </Box>
                    </Popup>
                  </Marker>
                ))}

                {/* Technician Markers */}
                {technicians.map((technician) => (
                  <Marker
                    key={technician.id}
                    position={[parseFloat(technician.latitude || 0), parseFloat(technician.longitude || 0)]}
                    icon={technicianIcon}
                  >
                    <Popup>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {technician.name}
                        </Typography>
                        <Typography variant="body2">
                          Status: <Chip 
                            label={technician.availability} 
                            color={technician.availability === 'Available' ? 'success' : 'warning'} 
                            size="small" 
                          />
                        </Typography>
                        <Typography variant="body2">
                          Phone: {technician.phone}
                        </Typography>
                      </Box>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Assign Technician Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)}>
        <DialogTitle>Assign Technician to Outage</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Select Technician</InputLabel>
            <Select
              value={selectedTechnician}
              onChange={(e) => setSelectedTechnician(e.target.value)}
              label="Select Technician"
            >
              {availableTechnicians.map((tech) => (
                <MenuItem key={tech.id} value={tech.id}>
                  {tech.name} - {tech.phone} ({tech.availability})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAssign} variant="contained" disabled={!selectedTechnician}>
            Assign
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}