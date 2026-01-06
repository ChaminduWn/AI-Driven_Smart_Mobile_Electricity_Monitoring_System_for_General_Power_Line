import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Typography,
  Box,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  LocationOn,
  Visibility,
} from '@mui/icons-material';

export default function OutageList({ outages, technicians, onUpdateOutage, onAssignTechnician, onDistrictClick, loading }) {
  const navigate = useNavigate();

  // Calculate district-wise summary
  const districtSummary = useMemo(() => {
    const summary = {};
    
    outages.forEach((outage) => {
      const district = outage.district || 'Unknown';
      if (!summary[district]) {
        summary[district] = {
          district,
          technicianReports: 0,
          householderReports: 0,
          latestDate: null,
          id: district,
        };
      }
      
      if (outage.reportedBy === 'Technician') {
        summary[district].technicianReports++;
      } else if (outage.reportedBy === 'Householder') {
        summary[district].householderReports++;
      }
      
      const reportDate = new Date(outage.reportedAt || outage.createdAt);
      if (!summary[district].latestDate || reportDate > summary[district].latestDate) {
        summary[district].latestDate = reportDate;
      }
    });
    
    return Object.values(summary).sort((a, b) => 
      (b.technicianReports + b.householderReports) - (a.technicianReports + a.householderReports)
    );
  }, [outages]);

  const handleViewDistrict = (district) => {
    if (onDistrictClick) {
      onDistrictClick(district);
    } else {
      navigate(`/district/${district}`);
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
              {districtSummary.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No outages reported
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                districtSummary.map((row) => (
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
                        {row.latestDate ? row.latestDate.toLocaleDateString() : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View District Issues">
                        <IconButton
                          className="view-button"
                          size="small"
                          onClick={() => handleViewDistrict(row.district)}
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
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}