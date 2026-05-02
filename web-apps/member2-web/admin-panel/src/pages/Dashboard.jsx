import { Box, Grid, Card, Typography } from '@mui/material';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import PeopleOutlineOutlinedIcon from '@mui/icons-material/PeopleOutlineOutlined';
import WorkOutlineOutlinedIcon from '@mui/icons-material/WorkOutlineOutlined';
import AttachMoneyOutlinedIcon from '@mui/icons-material/AttachMoneyOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8003/api';

const MetricCard = ({ title, value, icon, subtext, subicon, subcolor, iconcolor }) => (
    <Card sx={{ p: 3, height: '100%', borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.03)', border: '1px solid #f0f0f0' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography color="text.secondary" variant="body1" fontWeight="600">{title}</Typography>
            <Box sx={{ color: iconcolor }}>
                {icon}
            </Box>
        </Box>
        <Typography variant="h3" fontWeight="700" mb={1}>{value}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', color: subcolor, mt: 1 }}>
            {subicon && <Box sx={{ mr: 0.5, display: 'flex' }}>{subicon}</Box>}
            <Typography variant="body2">{subtext}</Typography>
        </Box>
    </Card>
);

const Dashboard = () => {
    const [metrics, setMetrics] = useState({
        totalUsers: 0,
        activeTechnicians: 0,
        pendingTechnicians: 0,
        activeJobs: 0,
        totalRevenue: 0,
        revenueData: [],
        geoData: []
    });

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await axios.get(`${API_URL}/admin/dashboard`);
                if (res.data.success) {
                    setMetrics(res.data.data); // Replace state entirely with fresh backend arrays
                }
            } catch (error) {
                console.error('Error fetching dashboard', error);
            }
        };

        // Fetch immediately on mount
        fetchDashboard();

        // Poll every 5 seconds for Real-Time Mobile updates
        const intervalId = setInterval(fetchDashboard, 5000);

        // Cleanup interval on unmount
        return () => clearInterval(intervalId);
    }, []);

    return (
        <Box sx={{ p: 1 }}>
            <Typography variant="h4" fontWeight="700" mb={0.5}>Dashboard</Typography>
            <Typography variant="body1" color="text.secondary" mb={4}>Overview of your technician dispatch system</Typography>

            <Grid container spacing={3} mb={4}>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Active Technicians"
                        value={metrics.activeTechnicians}
                        subtext={`${metrics.pendingTechnicians} pending verification`}
                        icon={<PersonOutlineOutlinedIcon />}
                        iconcolor="#0066FF"
                        subcolor="text.secondary"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Total Users"
                        value={metrics.totalUsers}
                        subtext="Active householders"
                        icon={<PeopleOutlineOutlinedIcon />}
                        iconcolor="#00C853"
                        subcolor="text.secondary"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Active Jobs"
                        value={metrics.activeJobs}
                        subtext="1 emergency"
                        subicon={<WarningAmberIcon fontSize="small" />}
                        icon={<WorkOutlineOutlinedIcon />}
                        iconcolor="#FF6D00"
                        subcolor="#FF3B30"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Monthly Revenue"
                        value={`Rs ${metrics.totalRevenue.toLocaleString()}`}
                        subtext="+15.3% from last month"
                        subicon={<TrendingUpIcon fontSize="small" />}
                        icon={<AttachMoneyOutlinedIcon />}
                        iconcolor="#AA00FF"
                        subcolor="#00C853"
                    />
                </Grid>
            </Grid>

            <Grid container spacing={4} sx={{ width: '100%', m: 0 }}>
                <Grid item xs={12} md={6}>
                    <Card sx={{ p: 4, borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.03)', border: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <Typography variant="h6" fontWeight="600" mb={3}>Revenue Trend</Typography>
                        <Box sx={{ height: 350, ml: -2, width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={metrics.revenueData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#eee" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#888' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888' }} dx={-10} />
                                    <Tooltip />
                                    <Line type="linear" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: '#fff', stroke: '#3b82f6', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </Box>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card sx={{ p: 4, borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.03)', border: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <Typography variant="h6" fontWeight="600" mb={3}>Jobs by District</Typography>
                        <Box sx={{ height: 350, width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={metrics.geoData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#eee" />
                                    <XAxis dataKey="district" axisLine={false} tickLine={false} tick={{ fill: '#888' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888' }} />
                                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                                    <Bar dataKey="count" fill="#10b981" radius={[2, 2, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Dashboard;
