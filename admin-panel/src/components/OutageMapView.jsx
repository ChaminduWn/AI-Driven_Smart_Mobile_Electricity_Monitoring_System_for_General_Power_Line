import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Box, Paper, Typography, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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
const defaultCenter = [7.8731, 80.7718]; // Center of Sri Lanka

export default function OutageMapView({ outages, technicians, onAssignTechnician, onUpdateOutage }) {
  const [selectedOutage, setSelectedOutage] = useState(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState('');

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'error';
      case 'in_progress': return 'warning';
      case 'resolved': return 'success';
      default: return 'default';
    }
  };

  const availableTechnicians = technicians.filter(t => 
    t.status === 'available' || t.status === 'online'
  );

  const handleAssignClick = (outage) => {
    setSelectedOutage(outage);
    setAssignDialogOpen(true);
  };

  const handleAssign = () => {
    if (selectedOutage && selectedTechnician) {
      onAssignTechnician(selectedOutage.id, selectedTechnician);
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

      <Box sx={{ height: '600px', width: '100%', position: 'relative' }}>
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
              key={outage.id}
              position={[outage.latitude, outage.longitude]}
              icon={outageIcon}
            >
              <Popup>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Outage #{outage.id}
                  </Typography>
                  <Typography variant="body2">
                    Status: <Chip label={outage.status} color={getStatusColor(outage.status)} size="small" />
                  </Typography>
                  <Typography variant="body2">
                    Reported: {new Date(outage.reportedAt).toLocaleString()}
                  </Typography>
                  {outage.address && (
                    <Typography variant="body2">
                      Address: {outage.address}
                    </Typography>
                  )}
                  {outage.assignedTechnician ? (
                    <Typography variant="body2" color="success.main">
                      Assigned to: {outage.assignedTechnician.name}
                    </Typography>
                  ) : (
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      onClick={() => handleAssignClick(outage)}
                      sx={{ mt: 1 }}
                    >
                      Assign Technician
                    </Button>
                  )}
                </Box>
              </Popup>
            </Marker>
          ))}

          {/* Technician Markers */}
          {technicians.map((technician) => (
            <Marker
              key={technician.id}
              position={[technician.latitude, technician.longitude]}
              icon={technicianIcon}
            >
              <Popup>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {technician.name}
                  </Typography>
                  <Typography variant="body2">
                    Status: <Chip 
                      label={technician.status} 
                      color={technician.status === 'available' ? 'success' : 'warning'} 
                      size="small" 
                    />
                  </Typography>
                  <Typography variant="body2">
                    Phone: {technician.phone}
                  </Typography>
                  {technician.currentJob && (
                    <Typography variant="body2" color="warning.main">
                      Current Job: Outage #{technician.currentJob}
                    </Typography>
                  )}
                </Box>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </Box>

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
                  {tech.name} - {tech.phone} ({tech.status})
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