import { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography, Card, Chip, Button, Switch, Divider } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

const mockServices = [
    { id: 'SC001', category: 'Installation', name: 'Wiring Installation', basePrice: 5000, active: true },
    { id: 'SC002', category: 'Installation', name: 'Light Fixture Installation', basePrice: 2500, active: true },
    { id: 'SC003', category: 'Installation', name: 'Fan Installation', basePrice: 2000, active: true },
    { id: 'SC004', category: 'Repair', name: 'Circuit Breaker Repair', basePrice: 3500, active: true },
];

const ServiceRow = ({ service, onToggle }) => (
    <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        p: 2.5,
        mb: 2,
        bgcolor: '#f9fafb',
        borderRadius: 3
    }}>
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="body1" fontWeight="600" color="#111827" mr={1.5}>{service.name}</Typography>
                <Chip
                    label={service.active ? 'Active' : 'Inactive'}
                    size="small"
                    sx={{
                        fontWeight: 600,
                        bgcolor: service.active ? '#111827' : '#e5e7eb',
                        color: service.active ? '#fff' : '#374151',
                        height: 22,
                        fontSize: '0.7rem'
                    }}
                />
            </Box>
            <Typography variant="body2" color="text.secondary">Service ID: {service.id}</Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body1" fontWeight="700" color="#111827">LKR {service.basePrice.toLocaleString()}</Typography>
                <Typography variant="caption" color="text.secondary">Base price</Typography>
            </Box>

            <Button
                variant="outlined"
                startIcon={<EditOutlinedIcon />}
                sx={{ color: '#111827', borderColor: '#e5e7eb', textTransform: 'none', fontWeight: 600, bgcolor: '#fff' }}
            >
                Edit
            </Button>

            <Switch
                checked={service.active}
                onChange={() => onToggle(service.rawId, service.active)}
                sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': { color: '#111827', '&:hover': { backgroundColor: 'rgba(17,24,39,0.08)' } },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#111827' },
                }}
            />
        </Box>
    </Box>
);

const API_URL = 'http://localhost:8003/api';

const Services = () => {
    const [services, setServices] = useState([]);

    const fetchServices = async () => {
        try {
            const res = await axios.get(`${API_URL}/admin/services`);
            if (res.data.success) {
                const formatted = res.data.data.map(s => ({
                    id: s.serviceId,
                    rawId: s.id,
                    category: s.category,
                    name: s.name,
                    basePrice: s.basePrice,
                    active: s.isActive
                }));
                // If the DB is empty, maybe fallback to mockServices for demo purposes?
                setServices(formatted.length > 0 ? formatted : mockServices);
            }
        } catch (error) {
            console.error('Error fetching services:', error);
            setServices(mockServices); // Fallback so UI doesn't break
        }
    };

    useEffect(() => {
        fetchServices();
        const intervalId = setInterval(fetchServices, 5000);
        return () => clearInterval(intervalId);
    }, []);

    const handleToggle = async (rawId, currentStatus) => {
        try {
            if (!rawId) return; // Prevent mock updates tracking failure
            const res = await axios.put(`${API_URL}/admin/services/${rawId}`, { isActive: !currentStatus });
            if (res.data.success) fetchServices();
        } catch (error) {
            console.error('Error toggling service:', error);
        }
    };

    const categories = [...new Set(services.map(s => s.category))];

    return (
        <Box sx={{ maxWidth: 1000 }}>
            {/* Header Section */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight="700" color="#111827">Service Configuration</Typography>
                <Typography variant="body1" color="text.secondary">Manage service categories and district-based pricing</Typography>
            </Box>

            {/* Main Outer Card */}
            <Card sx={{ p: 4, borderRadius: 3, border: '1px solid #f0f0f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>

                {/* Inner Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" fontWeight="700" color="#111827">Service Categories & Pricing</Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        sx={{ bgcolor: '#111827', '&:hover': { bgcolor: '#1f2937' }, textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 3 }}
                    >
                        Add New Service
                    </Button>
                </Box>

                <Divider sx={{ mb: 4, borderColor: '#f0f0f0' }} />

                {/* Categories Iteration */}
                {categories.map((category) => (
                    <Box key={category} sx={{ mb: 4 }}>
                        <Typography variant="h6" fontWeight="700" color="#111827" mb={2}>{category}</Typography>
                        {services.filter(s => s.category === category).map(service => (
                            <ServiceRow key={service.id} service={service} onToggle={handleToggle} />
                        ))}
                    </Box>
                ))}

            </Card>
        </Box>
    );
};

export default Services;
