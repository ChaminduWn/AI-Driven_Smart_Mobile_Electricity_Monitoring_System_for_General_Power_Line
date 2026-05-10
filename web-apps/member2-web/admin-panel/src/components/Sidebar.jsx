import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EngineeringIcon from '@mui/icons-material/Engineering';
import PeopleIcon from '@mui/icons-material/People';
import ConstructionIcon from '@mui/icons-material/Construction';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';

const DRAWER_WIDTH = 260;

const menuItems = [
    { title: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    { title: 'Technicians (KYC)', path: '/technicians', icon: <EngineeringIcon /> },
    { title: 'Users', path: '/users', icon: <PeopleIcon /> },
    { title: 'Services', path: '/services', icon: <ConstructionIcon /> },
    { title: 'Support & QA', path: '/support', icon: <SupportAgentIcon /> },
];

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: DRAWER_WIDTH,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: DRAWER_WIDTH,
                    boxSizing: 'border-box',
                    backgroundColor: 'darkAccent.main',
                    color: '#fff',
                    borderRight: 'none'
                },
            }}
        >
            <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="h6" fontWeight="bold">P</Typography>
                </Box>
                <Typography variant="h6" fontWeight="700" letterSpacing={0.5}>
                    PowerLink Admin
                </Typography>
            </Box>

            <List sx={{ px: 2, pt: 1 }}>
                {menuItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                        <ListItem key={item.title} disablePadding sx={{ mb: 0.5 }}>
                            <ListItemButton
                                onClick={() => navigate(item.path)}
                                sx={{
                                    borderRadius: 2,
                                    mb: 0.5,
                                    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ color: isActive ? 'primary.light' : 'rgba(255,255,255,0.7)', minWidth: 40 }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.title}
                                    slotProps={{
                                        primary: {
                                            fontWeight: isActive ? 600 : 400,
                                            color: isActive ? '#fff' : 'rgba(255,255,255,0.7)'
                                        }
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>
        </Drawer>
    );
};

export default Sidebar;
