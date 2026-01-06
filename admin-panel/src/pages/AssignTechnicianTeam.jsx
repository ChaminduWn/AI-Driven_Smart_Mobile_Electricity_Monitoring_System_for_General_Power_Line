import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Breadcrumbs,
  Link,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  Card,
  CardContent,
} from '@mui/material';
import {
  ArrowBack,
  CheckCircle,
  Cancel,
  DirectionsBike,
  LocalShipping,
  AirportShuttle,
} from '@mui/icons-material';
import { member2Service } from '../services/member2.service';
import { toast } from 'react-toastify';

const PRIORITY_COLORS = {
  Low: '#4caf50',
  Medium: '#ff9800',
  High: '#f57c00',
  Critical: '#d32f2f',
  Urgent: '#d32f2f',
};

const VEHICLE_ICONS = {
  Bike: <DirectionsBike />,
  Van: <LocalShipping />,
  Truck: <AirportShuttle />,
};

export default function AssignTechnicianTeam() {
  const { issueId } = useParams();
  const navigate = useNavigate();
  const [issue, setIssue] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechnicians, setSelectedTechnicians] = useState([]);
  const [filters, setFilters] = useState({
    availability: 'All',
    attendance: 'All',
    vehicleAvailability: 'All',
  });
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [issueId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [issueRes, techniciansRes] = await Promise.all([
        member2Service.getIssueDetails(issueId).catch(() => ({ data: null })),
        member2Service.getTechniciansWithVehicles().catch(() => ({ data: [] })),
      ]);

      setIssue(issueRes?.data || {
        id: issueId,
        priority: 'Critical',
        location: { area: 'Colombo 7', feeder: 'Feeder-12' },
      });
      setTechnicians(techniciansRes?.data || [
        {
          id: 'T001',
          name: 'Kamal Perera',
          attendanceStatus: 'Present',
          availability: 'Available',
          currentTask: null,
          phone: '+94 77 123 4567',
          vehicle: { number: 'ABC-1234', type: 'Van', available: true },
        },
        {
          id: 'T002',
          name: 'Nimal Silva',
          attendanceStatus: 'Present',
          availability: 'Available',
          currentTask: null,
          phone: '+94 77 234 5678',
          vehicle: { number: 'XYZ-5678', type: 'Bike', available: true },
        },
        {
          id: 'T003',
          name: 'Sunil Fernando',
          attendanceStatus: 'Present',
          availability: 'On Task',
          currentTask: 'CEB-2399',
          phone: '+94 77 345 6789',
          vehicle: { number: 'DEF-9012', type: 'Truck', available: false },
        },
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Using sample data.');
      // Set sample data as fallback
      setIssue({
        id: issueId,
        priority: 'Critical',
        location: { area: 'Colombo 7', feeder: 'Feeder-12' },
      });
      setTechnicians([
        {
          id: 'T001',
          name: 'Kamal Perera',
          attendanceStatus: 'Present',
          availability: 'Available',
          currentTask: null,
          phone: '+94 77 123 4567',
          vehicle: { number: 'ABC-1234', type: 'Van', available: true },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTechnicians = technicians.filter((tech) => {
    const matchAvailability = filters.availability === 'All' || 
      (filters.availability === 'Available' && tech.availability === 'Available');
    const matchAttendance = filters.attendance === 'All' || 
      (filters.attendance === 'Present' && tech.attendanceStatus === 'Present');
    const matchVehicle = filters.vehicleAvailability === 'All' || 
      (filters.vehicleAvailability === 'Available' && tech.vehicle?.available === true);

    return matchAvailability && matchAttendance && matchVehicle;
  });

  const handleTechnicianSelect = (technicianId) => {
    setSelectedTechnicians((prev) => {
      if (prev.includes(technicianId)) {
        return prev.filter((id) => id !== technicianId);
      }
      return [...prev, technicianId];
    });
  };

  const handleAssign = () => {
    if (selectedTechnicians.length === 0) {
      toast.warning('Please select at least one technician');
      return;
    }
    setConfirmDialogOpen(true);
  };

  const confirmAssignment = async () => {
    try {
      const selectedTechs = technicians.filter((tech) =>
        selectedTechnicians.includes(tech.id)
      );

      await member2Service.assignTechnicianTeam(issueId, {
        technicianIds: selectedTechnicians,
        vehicles: selectedTechs.map((tech) => tech.vehicle?.number).filter(Boolean),
      });

      toast.success('Technicians assigned successfully');
      navigate(`/issue/${issueId}`);
    } catch (error) {
      console.error('Error assigning technicians:', error);
      toast.error('Failed to assign technicians');
    } finally {
      setConfirmDialogOpen(false);
    }
  };

  const getAttendanceBadge = (status) => {
    return (
      <Chip
        label={status}
        size="small"
        sx={{
          bgcolor: status === 'Present' ? '#4caf50' : '#d32f2f',
          color: 'white',
          fontWeight: 'bold',
        }}
      />
    );
  };

  const getAvailabilityBadge = (status) => {
    const colors = {
      Available: { bg: '#4caf50', label: 'Available' },
      'On Task': { bg: '#ff9800', label: 'Busy' },
      'Off Duty': { bg: '#757575', label: 'Off Duty' },
    };
    const config = colors[status] || { bg: '#757575', label: status };

    return (
      <Chip
        label={config.label}
        size="small"
        sx={{
          bgcolor: config.bg,
          color: 'white',
          fontWeight: 'bold',
        }}
      />
    );
  };

  const getVehicleBadge = (vehicle) => {
    if (!vehicle) return <Typography variant="body2" color="text.secondary">No Vehicle</Typography>;
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {VEHICLE_ICONS[vehicle.type]}
        <Typography variant="body2">{vehicle.number}</Typography>
        <Chip
          label={vehicle.available ? 'Available' : 'Not Available'}
          size="small"
          sx={{
            bgcolor: vehicle.available ? '#4caf50' : '#d32f2f',
            color: 'white',
            fontSize: '0.7rem',
          }}
        />
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (error) {
    console.warn(error);
  }

  return (
    <Box>
      {/* Breadcrumb */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          component="button"
          variant="body1"
          onClick={() => navigate('/')}
          sx={{ textDecoration: 'none', cursor: 'pointer' }}
        >
          Dashboard
        </Link>
        <Link
          component="button"
          variant="body1"
          onClick={() => navigate(`/issue/${issueId}`)}
          sx={{ textDecoration: 'none', cursor: 'pointer' }}
        >
          Issue {issueId}
        </Link>
        <Typography color="text.primary">Assign Team</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate(`/issue/${issueId}`)}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" fontWeight="bold">
            Assign Technician Team
          </Typography>
        </Box>
      </Box>

      {/* Issue Reference Panel */}
      <Card elevation={2} sx={{ mb: 3, borderRadius: 2, bgcolor: '#f5f5f5' }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Issue Reference (Read-only)
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Issue ID
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {issueId}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Priority
              </Typography>
              <Chip
                label={issue?.priority || 'N/A'}
                sx={{
                  bgcolor: PRIORITY_COLORS[issue?.priority] || '#757575',
                  color: 'white',
                  fontWeight: 'bold',
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Affected Area
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {issue?.location?.area || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Required Response Level
              </Typography>
              <Typography variant="body2" fontWeight="medium" color={PRIORITY_COLORS[issue?.priority] || '#757575'}>
                {issue?.priority === 'Critical' || issue?.priority === 'Urgent'
                  ? 'Immediate Response Required'
                  : issue?.priority === 'High'
                  ? 'High Priority Response'
                  : 'Standard Response'}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Filters */}
      <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Filters
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Availability</InputLabel>
            <Select
              value={filters.availability}
              label="Availability"
              onChange={(e) => setFilters({ ...filters, availability: e.target.value })}
            >
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="Available">Available Only</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Attendance</InputLabel>
            <Select
              value={filters.attendance}
              label="Attendance"
              onChange={(e) => setFilters({ ...filters, attendance: e.target.value })}
            >
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="Present">Present Today</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Vehicle</InputLabel>
            <Select
              value={filters.vehicleAvailability}
              label="Vehicle"
              onChange={(e) => setFilters({ ...filters, vehicleAvailability: e.target.value })}
            >
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="Available">Available Only</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Technician List */}
      <Paper elevation={2} sx={{ borderRadius: 2, mb: 3 }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight="bold">
            Available Technicians ({filteredTechnicians.length})
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell padding="checkbox">Select</TableCell>
                <TableCell><strong>Technician ID</strong></TableCell>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell align="center"><strong>Attendance Status</strong></TableCell>
                <TableCell align="center"><strong>Availability</strong></TableCell>
                <TableCell><strong>Current Task</strong></TableCell>
                <TableCell><strong>Contact</strong></TableCell>
                <TableCell><strong>Vehicle</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTechnicians.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography color="text.secondary">No technicians found matching filters</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTechnicians.map((tech) => (
                  <TableRow
                    key={tech.id}
                    hover
                    selected={selectedTechnicians.includes(tech.id)}
                    sx={{
                      '&.Mui-selected': {
                        bgcolor: 'action.selected',
                      },
                    }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedTechnicians.includes(tech.id)}
                        onChange={() => handleTechnicianSelect(tech.id)}
                        disabled={tech.availability !== 'Available' || tech.attendanceStatus !== 'Present'}
                      />
                    </TableCell>
                    <TableCell>{tech.id}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {tech.name}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {getAttendanceBadge(tech.attendanceStatus)}
                    </TableCell>
                    <TableCell align="center">
                      {getAvailabilityBadge(tech.availability)}
                    </TableCell>
                    <TableCell>
                      {tech.currentTask ? (
                        <Chip label={tech.currentTask} size="small" color="warning" />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          None
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{tech.phone}</Typography>
                    </TableCell>
                    <TableCell>{getVehicleBadge(tech.vehicle)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={() => navigate(`/issue/${issueId}`)}
          sx={{ textTransform: 'none' }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleAssign}
          disabled={selectedTechnicians.length === 0}
          sx={{ textTransform: 'none' }}
        >
          Assign Technician(s) ({selectedTechnicians.length})
        </Button>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Assignment</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            <strong>Issue ID:</strong> {issueId}
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body1" gutterBottom>
            <strong>Selected Technicians:</strong>
          </Typography>
          <List dense>
            {technicians
              .filter((tech) => selectedTechnicians.includes(tech.id))
              .map((tech) => (
                <ListItem key={tech.id}>
                  <ListItemText
                    primary={tech.name}
                    secondary={`${tech.id} - ${tech.phone}${tech.vehicle ? ` - Vehicle: ${tech.vehicle.number}` : ''}`}
                  />
                </ListItem>
              ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button onClick={confirmAssignment} variant="contained" sx={{ textTransform: 'none' }}>
            Confirm Assignment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}