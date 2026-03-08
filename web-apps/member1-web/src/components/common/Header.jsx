import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Avatar,
    Box,
    Tooltip,
    Menu,
    MenuItem,
    ListItemIcon,
    Divider,
} from '@mui/material';
import {
    Logout as LogoutIcon,
    Person as PersonIcon,
    Settings as SettingsIcon,
} from '@mui/icons-material';
import { Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        handleClose();
        logout();
        navigate('/');
    };

    return (
        <AppBar position="sticky" elevation={1} sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>
            <Toolbar>
                <Box display="flex" alignItems="center" sx={{ flexGrow: 1 }}>
                    <Zap className="w-8 h-8 text-blue-500 mr-2" />
                    <Box>
                        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                            Smart Energy Monitoring
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Analyze and optimize your energy usage
                        </Typography>
                    </Box>
                </Box>

                <Box display="flex" alignItems="center" gap={1}>
                    <Tooltip title="Account settings">
                        <IconButton
                            onClick={handleClick}
                            size="small"
                            sx={{ ml: 2 }}
                            aria-controls={open ? 'account-menu' : undefined}
                            aria-haspopup="true"
                            aria-expanded={open ? 'true' : undefined}
                        >
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                                {user?.fullName?.charAt(0) || <PersonIcon />}
                            </Avatar>
                        </IconButton>
                    </Tooltip>
                </Box>
            </Toolbar>

            <Menu
                anchorEl={anchorEl}
                id="account-menu"
                open={open}
                onClose={handleClose}
                onClick={handleClose}
                PaperProps={{
                    elevation: 0,
                    sx: {
                        overflow: 'visible',
                        filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                        mt: 1.5,
                        '& .MuiAvatar-root': {
                            width: 32,
                            height: 32,
                            ml: -0.5,
                            mr: 1,
                        },
                        '&:before': {
                            content: '""',
                            display: 'block',
                            position: 'absolute',
                            top: 0,
                            right: 14,
                            width: 10,
                            height: 10,
                            bgcolor: 'background.paper',
                            transform: 'translateY(-50%) rotate(45deg)',
                            zIndex: 0,
                        },
                    },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <MenuItem disabled>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {user?.fullName || 'User'}
                    </Typography>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleClose}>
                    <ListItemIcon>
                        <PersonIcon fontSize="small" />
                    </ListItemIcon>
                    Profile
                </MenuItem>
                <MenuItem onClick={handleClose}>
                    <ListItemIcon>
                        <SettingsIcon fontSize="small" />
                    </ListItemIcon>
                    Settings
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                    <ListItemIcon>
                        <LogoutIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    Logout
                </MenuItem>
            </Menu>
        </AppBar>
    );
};

export default Header;
