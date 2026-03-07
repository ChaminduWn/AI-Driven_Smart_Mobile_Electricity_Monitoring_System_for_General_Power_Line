import { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography, Card, Chip, Button, InputAdornment, TextField, ToggleButtonGroup, ToggleButton, Grid } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import BlockIcon from '@mui/icons-material/Block';

// Mock Data structure based on Screenshot 2
const mockTechs = [
    { id: 'T001', name: 'Kasun Perera', email: 'kasun.p@email.com', phone: '+94 77 123 4567', district: 'Colombo', joined: '2026-03-01', status: 'pending', docs: ['NIC', 'NVQ'] },
    { id: 'T002', name: 'Nimal Silva', email: 'nimal.s@email.com', phone: '+94 71 234 5678', district: 'Kandy', joined: '2025-11-15', status: 'active', docs: ['NIC', 'NVQ'] },
];
const API_URL = 'http://localhost:8003/api';

const Technicians = () => {
    const [techs, setTechs] = useState([]);
    const [filter, setFilter] = useState('All');

    const handleFilter = (event, newFilter) => {
        if (newFilter !== null) setFilter(newFilter);
    };

    const fetchTechs = async () => {
        try {
            const res = await axios.get(`${API_URL}/admin/technicians`);
            if (res.data.success) {
                const formatted = res.data.data.map(t => ({
                    id: t.id.substring(0, 8).toUpperCase(),
                    rawId: t.id,
                    name: `${t.firstName} ${t.lastName || ''}`.trim(),
                    email: t.email,
                    phone: t.phone,
                    district: t.district,
                    joined: new Date(t.createdAt).toISOString().split('T')[0],
                    status: !t.isAvailable ? 'suspended' : (t.isVerified ? 'active' : 'pending'),
                    docs: ['NIC', 'NVQ']
                }));
                setTechs(formatted);
            }
        } catch (error) {
            console.error('Error fetching technicians:', error);
        }
    };

    useEffect(() => {
        fetchTechs();
        const intervalId = setInterval(fetchTechs, 5000);
        return () => clearInterval(intervalId);
    }, []);

    const handleAction = async (rawId, actionType) => {
        try {
            let payload = {};
            if (actionType === 'approve') payload = { isVerified: true };
            if (actionType === 'reject' || actionType === 'suspend') payload = { isAvailable: false };

            const res = await axios.put(`${API_URL}/admin/technicians/${rawId}/status`, payload);
            if (res.data.success) fetchTechs();
        } catch (error) {
            console.error(`Error updating technician ${actionType}:`, error);
        }
    };

    const pendingCount = techs.filter(t => t.status === 'pending').length;

    return (
        <Box sx={{ maxWidth: 1000 }}>
            {/* Header Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight="700" color="#111827">Technician Management</Typography>
                    <Typography variant="body1" color="text.secondary">KYC verification and account management</Typography>
                </Box>
                {pendingCount > 0 && (
                    <Button variant="contained" sx={{ bgcolor: '#cb1239', '&:hover': { bgcolor: '#be123c' }, borderRadius: 2, px: 3, py: 1, textTransform: 'none', fontWeight: 600 }}>
                        {pendingCount} Pending Review
                    </Button>
                )}
            </Box>

            {/* Filter Bar */}
            <Card sx={{ p: 2, mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 3, border: '1px solid #f0f0f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                <TextField
                    size="small"
                    placeholder="Search by name, email, or ID..."
                    sx={{ width: 400, bgcolor: '#f9fafb', '& fieldset': { border: 'none' }, borderRadius: 2 }}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.disabled' }} /></InputAdornment>
                    }}
                />
                <ToggleButtonGroup
                    value={filter}
                    exclusive
                    onChange={handleFilter}
                    size="small"
                    sx={{ '& .MuiToggleButton-root': { textTransform: 'none', px: 3, fontWeight: 500, border: '1px solid #e5e7eb', color: '#374151' }, '& .Mui-selected': { bgcolor: '#111827 !important', color: '#fff !important' } }}
                >
                    <ToggleButton value="All">All</ToggleButton>
                    <ToggleButton value="Pending">Pending</ToggleButton>
                    <ToggleButton value="Active">Active</ToggleButton>
                    <ToggleButton value="Suspended">Suspended</ToggleButton>
                </ToggleButtonGroup>
            </Card>

            {/* Technician Cards */}
            {techs.filter(t => filter === 'All' || t.status.toLowerCase() === filter.toLowerCase()).map((tech) => (
                <Card key={tech.id} sx={{ mb: 3, p: 3, borderRadius: 3, border: '1px solid #f0f0f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                    <Grid container spacing={3}>
                        {/* Left Details */}
                        <Grid item xs={12} md={7} sx={{ borderRight: '1px solid #f0f0f0', pr: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Typography variant="h6" fontWeight="600" mr={1.5}>{tech.name}</Typography>
                                <Chip
                                    label={tech.status}
                                    size="small"
                                    sx={{
                                        fontWeight: 600,
                                        bgcolor: tech.status === 'active' ? '#111827' : '#e5e7eb',
                                        color: tech.status === 'active' ? '#fff' : '#374151'
                                    }}
                                />
                            </Box>
                            <Typography variant="body2" color="text.secondary" mb={3}>ID: {tech.id}</Typography>

                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary" display="block">Email</Typography>
                                    <Typography variant="body2" fontWeight="600">{tech.email}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary" display="block">Phone</Typography>
                                    <Typography variant="body2" fontWeight="600">{tech.phone}</Typography>
                                </Grid>
                                <Grid item xs={6} sx={{ mt: 1 }}>
                                    <Typography variant="caption" color="text.secondary" display="block">District</Typography>
                                    <Typography variant="body2" fontWeight="600">{tech.district}</Typography>
                                </Grid>
                                <Grid item xs={6} sx={{ mt: 1 }}>
                                    <Typography variant="caption" color="text.secondary" display="block">Joined</Typography>
                                    <Typography variant="body2" fontWeight="600">{tech.joined}</Typography>
                                </Grid>
                            </Grid>
                        </Grid>

                        {/* Right Documents / Actions */}
                        <Grid item xs={12} md={5} sx={{ pl: 3, display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="body2" fontWeight="600" mb={1} color="#374151">Documents</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5, color: '#10b981' }}>
                                <CheckCircleOutlineIcon fontSize="small" sx={{ mr: 1 }} />
                                <Typography variant="body2">NIC Uploaded</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, color: '#10b981' }}>
                                <CheckCircleOutlineIcon fontSize="small" sx={{ mr: 1 }} />
                                <Typography variant="body2">NVQ Certificate</Typography>
                            </Box>

                            <Box sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {tech.status === 'pending' ? (
                                    <>
                                        <Button variant="outlined" fullWidth startIcon={<VisibilityOutlinedIcon />} sx={{ color: '#111827', borderColor: '#e5e7eb', textTransform: 'none', fontWeight: 600, mb: 1 }}>
                                            View Documents
                                        </Button>
                                        <Button onClick={() => handleAction(tech.rawId, 'approve')} variant="contained" fullWidth startIcon={<CheckCircleOutlineIcon />} sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, textTransform: 'none', fontWeight: 600 }}>
                                            Approve
                                        </Button>
                                        <Button onClick={() => handleAction(tech.rawId, 'reject')} variant="contained" fullWidth startIcon={<CancelOutlinedIcon />} sx={{ bgcolor: '#cb1239', '&:hover': { bgcolor: '#be123c' }, textTransform: 'none', fontWeight: 600 }}>
                                            Reject
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button variant="outlined" fullWidth startIcon={<VisibilityOutlinedIcon />} sx={{ color: '#111827', borderColor: '#e5e7eb', textTransform: 'none', fontWeight: 600, mb: 1 }}>
                                            View Details
                                        </Button>
                                        <Button onClick={() => handleAction(tech.rawId, 'suspend')} variant="contained" fullWidth startIcon={<BlockIcon />} sx={{ bgcolor: '#cb1239', '&:hover': { bgcolor: '#be123c' }, textTransform: 'none', fontWeight: 600 }} disabled={tech.status === 'suspended'}>
                                            {tech.status === 'suspended' ? 'Suspended' : 'Suspend Account'}
                                        </Button>
                                    </>
                                )}
                            </Box>
                        </Grid>
                    </Grid>
                </Card>
            ))}
        </Box>
    );
};

export default Technicians;
