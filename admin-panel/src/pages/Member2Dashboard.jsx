import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Grid,
} from '@mui/material';
import { member2Service } from '../services/member2.service';
import OutageMapView from '../components/OutageMapView';
import OutageList from '../components/OutageList';
import TechnicianManagement from '../components/TechnicianManagement';
import OutageStats from '../components/OutageStats';
import { toast } from 'react-toastify';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Member2Dashboard() {
  const [tabValue, setTabValue] = useState(0);
  const [outages, setOutages] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [stats, setStats] = useState({
    totalOutages: 0,
    activeOutages: 0,
    resolvedOutages: 0,
    availableTechnicians: 0,
    assignedTechnicians: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    // Set up polling for real-time updates (every 5 seconds)
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [outagesRes, techniciansRes] = await Promise.all([
        member2Service.getOutages(),
        member2Service.getTechnicians(),
      ]);

      const outagesData = outagesRes.data || [];
      const techniciansData = techniciansRes.data || [];

      setOutages(outagesData);
      setTechnicians(techniciansData);

      // Calculate stats
      const activeOutages = outagesData.filter(o => 
        o.status === 'pending' || o.status === 'in_progress'
      ).length;
      const resolvedOutages = outagesData.filter(o => 
        o.status === 'resolved'
      ).length;
      const availableTechnicians = techniciansData.filter(t => 
        t.status === 'available'
      ).length;
      const assignedTechnicians = techniciansData.filter(t => 
        t.status === 'busy' || t.status === 'assigned'
      ).length;

      setStats({
        totalOutages: outagesData.length,
        activeOutages,
        resolvedOutages,
        availableTechnicians,
        assignedTechnicians,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOutageUpdate = async (outageId, updates) => {
    try {
      await member2Service.updateOutageStatus(outageId, updates.status);
      toast.success('Outage status updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update outage');
    }
  };

  const handleAssignTechnician = async (outageId, technicianId) => {
    try {
      // This endpoint should be added to member2.service.js
      await member2Service.assignTechnician(outageId, technicianId);
      toast.success('Technician assigned successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to assign technician');
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Outage Reporting & Technician Management
      </Typography>

      {/* Statistics Cards */}
      <OutageStats stats={stats} loading={loading} />

      {/* Tabs for different views */}
      <Paper sx={{ mt: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Map View" />
          <Tab label="Outage List" />
          <Tab label="Technician Management" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <OutageMapView
            outages={outages}
            technicians={technicians}
            onAssignTechnician={handleAssignTechnician}
            onUpdateOutage={handleOutageUpdate}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <OutageList
            outages={outages}
            technicians={technicians}
            onUpdateOutage={handleOutageUpdate}
            onAssignTechnician={handleAssignTechnician}
            loading={loading}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <TechnicianManagement
            technicians={technicians}
            outages={outages}
            onUpdateTechnician={async (id, updates) => {
              try {
                await member2Service.updateTechnicianStatus(id, updates.status);
                toast.success('Technician status updated');
                fetchData();
              } catch (error) {
                toast.error('Failed to update technician');
              }
            }}
            loading={loading}
          />
        </TabPanel>
      </Paper>
    </Box>
  );
}