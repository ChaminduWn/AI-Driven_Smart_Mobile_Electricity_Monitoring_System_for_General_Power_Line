import React, { useState } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Box,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  MoreVert,
  LocationOn,
  Person,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';

export default function OutageList({ outages, technicians, onUpdateOutage, onAssignTechnician, loading }) {
  const [anchorEl, setAnchorEl] = useState(null);
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

  const handleMenuOpen = (event, outage) => {
    setAnchorEl(event.currentTarget);
    setSelectedOutage(outage);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedOutage(null);
  };

  const handleStatusChange = (newStatus) => {
    if (selectedOutage) {
      onUpdateOutage(selectedOutage.id, { status: newStatus });
    }
    handleMenuClose();
  };

  const handleAssignClick = () => {
    setAssignDialogOpen(true);
    handleMenuClose();
  };

  const handleAssign = () => {
    if (selectedOutage && selectedTechnician) {
      onAssignTechnician(selectedOutage.id, selectedTechnician);
      setAssignDialogOpen(false);
      setSelectedOutage(null);
      setSelectedTechnician('');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Reported At</TableCell>
              <TableCell>Assigned Technician</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {outages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No outages reported
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              outages.map((outage) => (
                <TableRow key={outage.id} hover>
                  <TableCell>#{outage.id}</TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <LocationOn fontSize="small" color="primary" />
                      <Typography variant="body2">
                        {outage.latitude?.toFixed(4)}, {outage.longitude?.toFixed(4)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{outage.address || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip
                      label={outage.status}
                      color={getStatusColor(outage.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(outage.reportedAt || outage.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {outage.assignedTechnician ? (
                      <Box display="flex" alignItems="center" gap={1}>
                        <Person fontSize="small" />
                        <Typography variant="body2">
                          {outage.assignedTechnician.name || outage.assignedTechnician}
                        </Typography>
                      </Box>
                    ) : (
                      <Chip label="Unassigned" size="small" color="default" />
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, outage)}
                    >
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleAssignClick}>
          <Person sx={{ mr: 1 }} /> Assign Technician
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('in_progress')}>
          <CheckCircle sx={{ mr: 1 }} /> Mark In Progress
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('resolved')}>
          <CheckCircle sx={{ mr: 1 }} /> Mark Resolved
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('pending')}>
          <Cancel sx={{ mr: 1 }} /> Mark Pending
        </MenuItem>
      </Menu>

      {/* Assign Technician Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)}>
        <DialogTitle>Assign Technician</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2, minWidth: 250 }}>
            <InputLabel>Select Technician</InputLabel>
            <Select
              value={selectedTechnician}
              onChange={(e) => setSelectedTechnician(e.target.value)}
              label="Select Technician"
            >
              {availableTechnicians.length === 0 ? (
                <MenuItem disabled>No available technicians</MenuItem>
              ) : (
                availableTechnicians.map((tech) => (
                  <MenuItem key={tech.id} value={tech.id}>
                    {tech.name} - {tech.phone}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAssign}
            variant="contained"
            disabled={!selectedTechnician}
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}