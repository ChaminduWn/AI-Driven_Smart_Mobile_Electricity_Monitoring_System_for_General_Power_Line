import { Box, Typography, IconButton, Avatar, InputBase, Badge } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';

const Topbar = () => {
    return (
        <Box sx={{
            height: 70,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 4,
            backgroundColor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider'
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', backgroundColor: '#F0F2F5', borderRadius: 2, px: 2, py: 0.5, width: 300 }}>
                <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                <InputBase placeholder="Search users, technicians or jobs..." sx={{ ml: 1, flex: 1, fontSize: '0.875rem' }} />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton>
                    <Badge badgeContent={3} color="error">
                        <NotificationsIcon />
                    </Badge>
                </IconButton>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, ml: 1 }}>
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" fontWeight="600">Admin User</Typography>
                        <Typography variant="caption" color="text.secondary">Super Admin</Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>A</Avatar>
                </Box>
            </Box>
        </Box>
    );
};

export default Topbar;
