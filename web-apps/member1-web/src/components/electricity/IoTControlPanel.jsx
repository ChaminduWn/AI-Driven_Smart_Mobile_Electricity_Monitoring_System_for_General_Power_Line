import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, CircularProgress, Alert } from '@mui/material';
import { Zap, RefreshCcw, Cpu } from 'lucide-react';
import RelayControl from './RelayControl';

const API_BASE = 'http://localhost:8000/api/v1';

const IoTControlPanel = () => {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedDeviceId, setSelectedDeviceId] = useState(null);

    useEffect(() => {
        fetchDevices();
    }, []);

    const fetchDevices = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE}/iot/devices`);
            if (!response.ok) throw new Error('Failed to fetch devices');
            const data = await response.json();
            setDevices(data.devices || []);
            if (data.devices && data.devices.length > 0 && !selectedDeviceId) {
                setSelectedDeviceId(data.devices[0].device_id);
            }
        } catch (err) {
            console.error('Error fetching devices:', err);
            setError('Could not load IoT devices. Make sure the backend is running and the device is connected.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 3, color: 'white' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
                <Box display="flex" alignItems="center" gap={2}>
                    <Cpu className="w-8 h-8 text-blue-400" />
                    <Typography variant="h4" fontWeight="bold">IoT Smart Control</Typography>
                </Box>
                <button 
                    onClick={fetchDevices}
                    style={{ 
                        background: 'rgba(255,255,255,0.05)', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer'
                    }}
                >
                    <RefreshCcw className="w-4 h-4" />
                    Refresh Devices
                </button>
            </Box>

            {loading && (
                <Box display="flex" justifyContent="center" py={8}>
                    <CircularProgress color="primary" />
                </Box>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 4, bgcolor: 'rgba(211, 47, 47, 0.1)', color: '#ffcdd2' }}>
                    {error}
                </Alert>
            )}

            {!loading && devices.length === 0 && !error && (
                <Paper sx={{ p: 6, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <Zap className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <Typography variant="h6" color="gray.400">No IoT Devices Found</Typography>
                    <Typography variant="body2" color="gray.500">Connect your ESP32 device to the HiveMQ broker to see it here.</Typography>
                </Paper>
            )}

            {devices.length > 0 && (
                <Grid container spacing={4}>
                    <Grid item xs={12} md={4}>
                        <Typography variant="h6" mb={2} color="gray.300">Available Devices</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {devices.map((dev) => (
                                <Box 
                                    key={dev.device_id}
                                    onClick={() => setSelectedDeviceId(dev.device_id)}
                                    sx={{ 
                                        p: 3, 
                                        bgcolor: selectedDeviceId === dev.device_id ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.03)',
                                        border: '1px solid',
                                        borderColor: selectedDeviceId === dev.device_id ? '#3b82f6' : 'rgba(255,255,255,0.08)',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                                        <Typography fontWeight="bold" color="white">{dev.device_id}</Typography>
                                        <Box 
                                            sx={{ 
                                                width: 10, height: 10, borderRadius: '50%', 
                                                bgcolor: dev.online ? '#4caf50' : '#f44336',
                                                boxShadow: dev.online ? '0 0 10px #4caf50' : 'none'
                                            }} 
                                        />
                                    </Box>
                                    <Typography variant="caption" color="gray.400">
                                        {dev.online ? 'Online' : 'Offline'} • Last seen: {dev.last_seen_ago}
                                    </Typography>
                                    {dev.power_w !== undefined && (
                                        <Typography variant="body2" color="blue.300" mt={1}>
                                            Current Load: {dev.power_w}W
                                        </Typography>
                                    )}
                                </Box>
                            ))}
                        </Box>
                    </Grid>

                    <Grid item xs={12} md={8}>
                        {selectedDeviceId ? (
                            <Box>
                                <Typography variant="h6" mb={2} color="gray.300">Device Control</Typography>
                                <Paper sx={{ p: 4, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px' }}>
                                    <RelayControl 
                                        deviceId={selectedDeviceId} 
                                        apiBase={API_BASE}
                                        wsUrl={`ws://localhost:8000/api/v1/iot/ws?device_id=${selectedDeviceId}&token=${localStorage.getItem('token')}`}
                                    />
                                </Paper>
                            </Box>
                        ) : (
                            <Box display="flex" alignItems="center" justifyContent="center" height="100%" sx={{ color: 'gray.600' }}>
                                <Typography>Select a device to see controls</Typography>
                            </Box>
                        )}
                    </Grid>
                </Grid>
            )}
        </Box>
    );
};

export default IoTControlPanel;
