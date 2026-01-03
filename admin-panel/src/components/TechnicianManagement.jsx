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
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Box,
  CircularProgress,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  MoreVert,
  LocationOn,
  Phone,
  CheckCircle,
  Cancel,
  Person,
} from '@mui/icons-material';

export default function TechnicianManagement({ technicians, outages, onUpdateTechnician, loading }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTechnician, setSelectedTechnician] = useState(null);

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'success';
      case 'busy': return 'warning';
      case 'offline': return 'default';
      case 'assigned': return 'info';
      default: return 'default';
    }
  };

  const handleMenuOpen = (event, technician) => {
    setAnchorEl(event.currentTarget);
    setSelectedTechnician(technician);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTechnician(null);
  };

  const handleStatusChange = (newStatus) => {
    if (selectedTechnician) {
      onUpdateTechnician(selectedTechnician.id, { status: newStatus });
    }
    handleMenuClose();
  };

  const getTechnicianOutages = (technicianId) => {
    return outages.filter(o => 
      o.assignedTechnician?.id === technicianId || 
      o.assignedTechnicianId === technicianId
    );
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
      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Technicians
              </Typography>
              <Typography variant="h4">
                {technicians.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Available
              </Typography>
              <Typography variant="h4" color="success.main">
                {technicians.filter(t => t.status === 'available').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Busy/Assigned
              </Typography>
              <Typography variant="h4" color="warning.main">
                {technicians.filter(t => t.status === 'busy' || t.status === 'assigned').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Technicians Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Active Jobs</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {technicians.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No technicians registered
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              technicians.map((technician) => {
                const activeOutages = getTechnicianOutages(technician.id);
                return (
                  <TableRow key={technician.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Person fontSize="small" />
                        <Typography variant="body2" fontWeight="medium">
                          {technician.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Phone fontSize="small" />
                        {technician.phone}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <LocationOn fontSize="small" color="primary" />
                        <Typography variant="body2">
                          {technician.latitude?.toFixed(4)}, {technician.longitude?.toFixed(4)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={technician.status}
                        color={getStatusColor(technician.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {activeOutages.length > 0 ? (
                        <Chip
                          label={`${activeOutages.length} job(s)`}
                          color="info"
                          size="small"
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No active jobs
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, technician)}
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
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
        <MenuItem onClick={() => handleStatusChange('available')}>
          <CheckCircle sx={{ mr: 1 }} color="success" /> Mark Available
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('busy')}>
          <Cancel sx={{ mr: 1 }} color="warning" /> Mark Busy
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('offline')}>
          <Cancel sx={{ mr: 1 }} /> Mark Offline
        </MenuItem>
      </Menu>
    </Box>
  );
}