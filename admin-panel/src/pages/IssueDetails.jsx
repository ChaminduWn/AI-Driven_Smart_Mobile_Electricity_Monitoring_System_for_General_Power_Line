import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  Breadcrumbs,
  Link,
  Divider,
  Card,
  CardContent,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  ArrowBack,
  LocationOn,
  Person,
  Phone,
  Description,
  Schedule,
  Assignment,
  Update,
} from '@mui/icons-material';
import { member2Service } from '../services/member2.service';
import { toast } from 'react-toastify';

const PRIORITY_COLORS = {
  Low: '#4caf50',
  Medium: '#ff9800',
  High: '#f57c00',
  Critical: '#d32f2f',
  Urgent: '#d32f2f', // Legacy support
};

const STATUS_COLORS = {
  Open: '#ffc107',
  Assigned: '#2196f3',
  'In Progress': '#2196f3',
  Resolved: '#4caf50',
  NEW: '#ffc107', // Legacy support
  PENDING: '#2196f3', // Legacy support
  RESOLVED: '#4caf50', // Legacy support
};

const STATUS_OPTIONS = [
  { value: 'Open', label: 'Open' },
  { value: 'Assigned', label: 'Assigned' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Resolved', label: 'Resolved' },
];

export default function IssueDetails() {
  const { issueId } = useParams();
  const navigate = useNavigate();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchIssueDetails();
  }, [issueId]);

  const fetchIssueDetails = async () => {
    try {
      setLoading(true);
      const response = await member2Service.getIssueDetails(issueId);
      setIssue(response.data);
      setSelectedStatus(response.data?.status || '');
    } catch (error) {
      console.error('Error fetching issue details:', error);
      toast.error('Failed to load issue details');
      // Fallback to sample data for development
      setIssue({
        id: issueId,
        location: {
          address: '123 Galle Road, Colombo 07',
          district: 'Colombo',
          feeder: 'Feeder-12',
          transformer: 'TR-456',
          area: 'Colombo 7',
          coordinates: { lat: 6.9271, lng: 79.8612 },
        },
        reporter: {
          name: 'John Doe',
          phone: '+94 77 123 4567',
          type: 'Technician',
        },
        description: 'Complete power outage in the area. Multiple households affected. Transformer malfunction suspected.',
        status: 'Open',
        priority: 'Critical',
        reportedAt: '2024-01-03T10:30:00',
        updatedAt: '2024-01-03T10:30:00',
        assignedTechnicians: null,
      });
      setSelectedStatus('Open');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = () => {
    setSelectedStatus(issue?.status || '');
    setUpdateDialogOpen(true);
  };

  const handleStatusUpdate = async () => {
    if (!selectedStatus || selectedStatus === issue?.status) {
      setUpdateDialogOpen(false);
      return;
    }

    try {
      setUpdating(true);
      await member2Service.updateOutageStatus(issueId, selectedStatus);
      toast.success('Status updated successfully');
      setUpdateDialogOpen(false);
      // Refresh issue details after update
      await fetchIssueDetails();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    return STATUS_COLORS[status] || '#757575';
  };

  const getPriorityColor = (priority) => {
    return PRIORITY_COLORS[priority] || '#1976d2';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!issue) {
    return <Typography>Issue not found</Typography>;
  }

  const getResponseLevel = (priority) => {
    switch (priority) {
      case 'Critical':
      case 'Urgent':
        return 'Immediate Response Required';
      case 'High':
        return 'High Priority Response';
      case 'Medium':
        return 'Standard Response';
      case 'Low':
        return 'Low Priority Response';
      default:
        return 'Standard Response';
    }
  };

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
        {issue.location?.district && (
          <Link
            component="button"
            variant="body1"
            onClick={() => navigate(`/district/${issue.location.district}`)}
            sx={{ textDecoration: 'none', cursor: 'pointer' }}
          >
            {issue.location.district}
          </Link>
        )}
        <Typography color="text.primary">{issueId}</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate(-1)}>
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Issue Details: {issueId}
            </Typography>
            <Chip
              label={issue.status}
              sx={{
                bgcolor: getStatusColor(issue.status),
                color: 'white',
                fontWeight: 'bold',
                mt: 1,
              }}
            />
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={8}>
          {/* Location Information */}
          <Card elevation={2} sx={{ mb: 3, borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocationOn color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  Location Information
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {issue.location?.address && (
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Address:</strong> {issue.location.address}
                </Typography>
              )}
              {issue.location?.area && (
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Area:</strong> {issue.location.area}
                </Typography>
              )}
              {issue.location?.feeder && (
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Feeder:</strong> {issue.location.feeder}
                </Typography>
              )}
              {issue.location?.transformer && (
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Transformer:</strong> {issue.location.transformer}
                </Typography>
              )}
              {issue.location?.district && (
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>District:</strong> {issue.location.district}
                </Typography>
              )}
              {issue.location?.coordinates && (
                <Typography variant="body2" color="text.secondary">
                  Coordinates: {issue.location.coordinates.lat}, {issue.location.coordinates.lng}
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Reporter Information */}
          <Card elevation={2} sx={{ mb: 3, borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Person color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  Reporter Information
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Name:</strong> {issue.reporter?.name || 'N/A'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Phone fontSize="small" />
                <Typography variant="body1">
                  <strong>Phone:</strong> {issue.reporter?.phone || 'N/A'}
                </Typography>
              </Box>
              {issue.reporter?.type && (
                <Chip
                  label={issue.reporter.type}
                  size="small"
                  sx={{
                    bgcolor: issue.reporter.type === 'Technician' ? '#ff9800' : '#1976d2',
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                />
              )}
            </CardContent>
          </Card>

          {/* Issue Description */}
          <Card elevation={2} sx={{ mb: 3, borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Description color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  Issue Description
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {issue.description || 'No description provided.'}
              </Typography>
            </CardContent>
          </Card>

          {/* Assigned Team Section */}
          {issue.assignedTechnicians && issue.assignedTechnicians.length > 0 && (
            <Card elevation={2} sx={{ mb: 3, borderRadius: 2, bgcolor: '#e3f2fd' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Assignment color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" fontWeight="bold">
                    Assigned Team
                  </Typography>
                  <Chip
                    label="Team Assigned"
                    color="success"
                    size="small"
                    sx={{ ml: 2, fontWeight: 'bold' }}
                  />
                </Box>
                <Divider sx={{ mb: 2 }} />
                {issue.assignedTechnicians.map((tech, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Typography variant="body1" fontWeight="medium">
                      {tech.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Phone: {tech.phone}
                    </Typography>
                    {tech.vehicle && (
                      <Typography variant="body2" color="text.secondary">
                        Vehicle: {tech.vehicle.number} ({tech.vehicle.type})
                      </Typography>
                    )}
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={4}>
          {/* Current Status */}
          <Card elevation={2} sx={{ mb: 3, borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Schedule color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  Current Status
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Reported At
                </Typography>
                <Typography variant="body1">
                  {issue.reportedAt ? new Date(issue.reportedAt).toLocaleString() : 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Last Updated
                </Typography>
                <Typography variant="body1">
                  {issue.updatedAt ? new Date(issue.updatedAt).toLocaleString() : 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Priority
                </Typography>
                <Chip
                  label={issue.priority}
                  sx={{
                    bgcolor: getPriorityColor(issue.priority),
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Required Response Level
                </Typography>
                <Typography variant="body2" fontWeight="medium" color={getPriorityColor(issue.priority)}>
                  {getResponseLevel(issue.priority)}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card elevation={2} sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Actions
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<Assignment />}
                  fullWidth
                  sx={{ textTransform: 'none' }}
                  onClick={() => navigate(`/issue/${issueId}/assign-team`)}
                >
                  Assign Team
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Update />}
                  fullWidth
                  sx={{ textTransform: 'none' }}
                  onClick={handleUpdateStatus}
                >
                  Update Status
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Update Status Dialog */}
      <Dialog open={updateDialogOpen} onClose={() => setUpdateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Issue Status</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Current Status: <strong>{issue.status}</strong>
            </Typography>
            <FormControl fullWidth sx={{ mt: 3 }}>
              <InputLabel>New Status</InputLabel>
              <Select
                value={selectedStatus}
                label="New Status"
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                {STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpdateDialogOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleStatusUpdate}
            variant="contained"
            disabled={!selectedStatus || selectedStatus === issue.status || updating}
            sx={{ textTransform: 'none' }}
          >
            {updating ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}