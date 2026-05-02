import { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography, Card, Chip, Button, InputAdornment, TextField, Grid } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import BlockIcon from '@mui/icons-material/Block';

// Mock Data structure based on Screenshot 3
const mockUsers = [
    { id: 'U001', name: 'Anura Dissanayake', email: 'anura.d@email.com', phone: '+94 77 111 2222', district: 'Colombo', joined: '2025-09-10', bookings: 15, status: 'active' },
    { id: 'U002', name: 'Sandya Rathnayake', email: 'sandya.r@email.com', phone: '+94 71 222 3333', district: 'Kandy', joined: '2025-10-15', bookings: 8, status: 'active' },
];

const API_URL = 'http://localhost:8003/api';

const Users = () => {
    const [users, setUsers] = useState([]);

    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${API_URL}/admin/users`);
            if (res.data.success) {
                const formatted = res.data.data.map(u => ({
                    id: u.id.substring(0, 8).toUpperCase(),
                    rawId: u.id,
                    name: `${u.firstName} ${u.lastName || ''}`.trim(),
                    email: u.email,
                    phone: u.phone,
                    district: u.district,
                    joined: new Date(u.createdAt).toISOString().split('T')[0],
                    bookings: u.totalBookings || 0,
                    status: u.isAvailable ? 'active' : 'suspended'
                }));
                setUsers(formatted);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    useEffect(() => {
        fetchUsers();
        const intervalId = setInterval(fetchUsers, 5000);
        return () => clearInterval(intervalId);
    }, []);

    const handleSuspend = async (rawId, currentStatus) => {
        try {
            // If active, suspend. If suspended, reactivate (isAvailable = true)
            const newStatus = currentStatus === 'active' ? false : true;
            const res = await axios.put(`${API_URL}/admin/users/${rawId}/suspend`, { isAvailable: newStatus });
            if (res.data.success) fetchUsers();
        } catch (error) {
            console.error('Error suspending user:', error);
        }
    };

    return (
        <Box sx={{ maxWidth: 1000 }}>
            {/* Header Section */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight="700" color="#111827">User Management</Typography>
                <Typography variant="body1" color="text.secondary">Manage householder accounts</Typography>
            </Box>

            {/* Filter Bar */}
            <Card sx={{ p: 2, mb: 4, borderRadius: 3, border: '1px solid #f0f0f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Search by name, email, or ID..."
                    sx={{ bgcolor: '#f9fafb', '& fieldset': { border: 'none' }, borderRadius: 2 }}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.disabled' }} /></InputAdornment>
                    }}
                />
            </Card>

            {/* User Cards */}
            {users.map((user) => (
                <Card key={user.id} sx={{ mb: 3, p: 3, borderRadius: 3, border: '1px solid #f0f0f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>

                        {/* Left Details block */}
                        <Box sx={{ flexGrow: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h5" fontWeight="600" mr={1.5} color="#111827">{user.name}</Typography>
                                <Chip
                                    label={user.status}
                                    size="small"
                                    sx={{
                                        fontWeight: 600,
                                        bgcolor: user.status === 'active' ? '#111827' : '#e5e7eb',
                                        color: user.status === 'active' ? '#fff' : '#374151',
                                        height: 24
                                    }}
                                />
                            </Box>

                            <Grid container spacing={4} mb={3}>
                                <Grid item>
                                    <Typography variant="body2" color="text.secondary" display="block">User ID</Typography>
                                    <Typography variant="body1" fontWeight="600" color="#111827">{user.id}</Typography>
                                </Grid>
                                <Grid item>
                                    <Typography variant="body2" color="text.secondary" display="block">Email</Typography>
                                    <Typography variant="body1" fontWeight="600" color="#111827">{user.email}</Typography>
                                </Grid>
                                <Grid item>
                                    <Typography variant="body2" color="text.secondary" display="block">Phone</Typography>
                                    <Typography variant="body1" fontWeight="600" color="#111827">{user.phone}</Typography>
                                </Grid>
                                <Grid item>
                                    <Typography variant="body2" color="text.secondary" display="block">District</Typography>
                                    <Typography variant="body1" fontWeight="600" color="#111827">{user.district}</Typography>
                                </Grid>
                            </Grid>

                            <Grid container spacing={4}>
                                <Grid item>
                                    <Typography variant="body2" color="text.secondary" display="block">Total Bookings</Typography>
                                    <Typography variant="body1" fontWeight="600" color="#111827">{user.bookings}</Typography>
                                </Grid>
                                <Grid item>
                                    <Typography variant="body2" color="text.secondary" display="block">Member Since</Typography>
                                    <Typography variant="body1" fontWeight="600" color="#111827">{user.joined}</Typography>
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Right Actions Block */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, minWidth: 160 }}>
                            <Button variant="outlined" startIcon={<VisibilityOutlinedIcon />} sx={{ color: '#111827', borderColor: '#e5e7eb', textTransform: 'none', fontWeight: 600, py: 1 }}>
                                View Details
                            </Button>
                            <Button
                                onClick={() => handleSuspend(user.rawId, user.status)}
                                variant="contained"
                                startIcon={<BlockIcon />}
                                sx={{ bgcolor: user.status === 'active' ? '#cb1239' : '#10b981', '&:hover': { bgcolor: user.status === 'active' ? '#be123c' : '#059669' }, textTransform: 'none', fontWeight: 600, py: 1 }}
                            >
                                {user.status === 'active' ? 'Suspend' : 'Reactivate'}
                            </Button>
                        </Box>

                    </Box>
                </Card>
            ))}
        </Box>
    );
};

export default Users;
