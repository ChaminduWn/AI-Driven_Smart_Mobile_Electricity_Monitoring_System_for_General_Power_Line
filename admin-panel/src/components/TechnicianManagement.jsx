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
      case 'Available': return 'success';
      case 'On Task': return 'warning';
      case 'Off Duty': return 'default';
      default: return 'default';
    }
  };

  const getAttendanceColor = (status) => {
    return status === 'Present' ? 'success' : 'error';
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
      o.assignedTechnicianIds?.includes(technicianId) ||
      o.assignedTechnicians?.some(t => t.id === technicianId)
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
                {technicians.filter(t => t.availability === 'Available').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                On Task
              </Typography>
              <Typography variant="h4" color="warning.main">
                {technicians.filter(t => t.availability === 'On Task').length}
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
              <TableCell><strong>Technician ID</strong></TableCell>
              <TableCell><strong>Technician Name</strong></TableCell>
              <TableCell align="center"><strong>Attendance Status</strong></TableCell>
              <TableCell align="center"><strong>Availability Status</strong></TableCell>
              <TableCell><strong>Contact Number</strong></TableCell>
              <TableCell><strong>Active Jobs</strong></TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {technicians.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
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
                      <Typography variant="body2" fontWeight="medium">
                        {technician.technicianId || technician.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Person fontSize="small" />
                        <Typography variant="body2" fontWeight="medium">
                          {technician.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={technician.attendanceStatus || 'Present'}
                        size="small"
                        color={getAttendanceColor(technician.attendanceStatus || 'Present')}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={technician.availability || 'Available'}
                        size="small"
                        color={getStatusColor(technician.availability || 'Available')}
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Phone fontSize="small" />
                        <Typography variant="body2">
                          {technician.phone}
                        </Typography>
                      </Box>
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
                    <TableCell align="center">
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
        <MenuItem onClick={() => handleStatusChange('Available')}>
          <CheckCircle sx={{ mr: 1 }} color="success" /> Mark Available
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('On Task')}>
          <Cancel sx={{ mr: 1 }} color="warning" /> Mark On Task
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('Off Duty')}>
          <Cancel sx={{ mr: 1 }} /> Mark Off Duty
        </MenuItem>
      </Menu>
    </Box>
  );
}