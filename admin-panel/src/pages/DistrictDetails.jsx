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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  ArrowBack,
  Visibility,
  LocationOn,
  Person,
  Warning,
  CheckCircle,
  Schedule,
} from '@mui/icons-material';

const PRIORITY_COLORS = {
  Urgent: '#d32f2f',
  High: '#f57c00',
  Normal: '#1976d2',
};

const STATUS_COLORS = {
  NEW: { color: '#ffc107', label: 'NEW' },
  PENDING: { color: '#2196f3', label: 'PENDING' },
  RESOLVED: { color: '#4caf50', label: 'RESOLVED' },
};

export default function DistrictDetails() {
  const { districtName } = useParams();
  const navigate = useNavigate();
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [issues, setIssues] = useState([]);
  const [summary, setSummary] = useState({
    newReports: 0,
    inProgress: 0,
    resolved: 0,
    urgent: 0,
  });

  useEffect(() => {
    // Sample data - replace with API call
    const sampleIssues = [
      {
        id: 'CEB-2401',
        location: 'Colombo 7, Colombo 2',
        reportedBy: 'Technician',
        priority: 'Urgent',
        status: 'NEW',
        date: '2024-01-03',
      },
      {
        id: 'CEB-2402',
        location: 'Colombo 5',
        reportedBy: 'Householder',
        priority: 'High',
        status: 'PENDING',
        date: '2024-01-02',
      },
      {
        id: 'CEB-2403',
        location: 'Colombo 3',
        reportedBy: 'Technician',
        priority: 'Normal',
        status: 'RESOLVED',
        date: '2024-01-01',
      },
    ];

    setIssues(sampleIssues);
    setSummary({
      newReports: 1,
      inProgress: 1,
      resolved: 1,
      urgent: 1,
    });
  }, [districtName]);

  const filteredIssues = issues.filter((issue) => {
    const matchPriority = priorityFilter === 'All' || issue.priority === priorityFilter;
    const matchStatus = statusFilter === 'All' || issue.status === statusFilter;
    return matchPriority && matchStatus;
  });

  const handleViewIssue = (issueId) => {
    navigate(`/issue/${issueId}`);
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
        <Typography color="text.primary">{districtName}</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" fontWeight="bold">
            {districtName} District Details
          </Typography>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              background: 'linear-gradient(135deg, #ffc107 0%, #ffc107dd 100%)',
              color: 'white',
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Warning sx={{ mr: 1 }} />
              <Typography variant="body2">New Reports</Typography>
            </Box>
            <Typography variant="h3" fontWeight="bold">
              {summary.newReports}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              background: 'linear-gradient(135deg, #2196f3 0%, #2196f3dd 100%)',
              color: 'white',
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Schedule sx={{ mr: 1 }} />
              <Typography variant="body2">In Progress</Typography>
            </Box>
            <Typography variant="h3" fontWeight="bold">
              {summary.inProgress}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              background: 'linear-gradient(135deg, #4caf50 0%, #4caf50dd 100%)',
              color: 'white',
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <CheckCircle sx={{ mr: 1 }} />
              <Typography variant="body2">Resolved</Typography>
            </Box>
            <Typography variant="h3" fontWeight="bold">
              {summary.resolved}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              background: 'linear-gradient(135deg, #d32f2f 0%, #d32f2fdd 100%)',
              color: 'white',
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Warning sx={{ mr: 1 }} />
              <Typography variant="body2">Urgent</Typography>
            </Box>
            <Typography variant="h3" fontWeight="bold">
              {summary.urgent}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Priority</InputLabel>
              <Select
                value={priorityFilter}
                label="Priority"
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <MenuItem value="All">All</MenuItem>
                <MenuItem value="Urgent">Urgent</MenuItem>
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Normal">Normal</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="All">All</MenuItem>
                <MenuItem value="NEW">New</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="RESOLVED">Resolved</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Issues Table */}
      <Paper elevation={2} sx={{ borderRadius: 2 }}>
        <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight="bold">
            Issues List
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell><strong>Issue ID</strong></TableCell>
                <TableCell><strong>Location</strong></TableCell>
                <TableCell><strong>Reported By</strong></TableCell>
                <TableCell><strong>Priority</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Date</strong></TableCell>
                <TableCell align="center"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredIssues.map((issue) => (
                <TableRow
                  key={issue.id}
                  hover
                  sx={{
                    '&:hover .view-button': {
                      opacity: 1,
                    },
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {issue.id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOn color="primary" fontSize="small" />
                      <Typography variant="body2">{issue.location}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={issue.reportedBy}
                      size="small"
                      sx={{
                        bgcolor: issue.reportedBy === 'Technician' ? '#ff9800' : '#1976d2',
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={issue.priority}
                      size="small"
                      sx={{
                        bgcolor: PRIORITY_COLORS[issue.priority],
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={STATUS_COLORS[issue.status].label}
                      size="small"
                      sx={{
                        bgcolor: STATUS_COLORS[issue.status].color,
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(issue.date).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Details">
                      <IconButton
                        className="view-button"
                        size="small"
                        onClick={() => handleViewIssue(issue.id)}
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