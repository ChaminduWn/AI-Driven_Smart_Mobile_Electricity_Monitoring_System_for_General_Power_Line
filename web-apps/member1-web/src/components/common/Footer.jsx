import React from 'react';
import { Box, Container, Typography, Link, Divider, Stack } from '@mui/material';

const Footer = () => {
    return (
        <Box
            component="footer"
            sx={{
                py: 3,
                px: 2,
                mt: 'auto',
                backgroundColor: (theme) =>
                    theme.palette.mode === 'light'
                        ? theme.palette.grey[200]
                        : theme.palette.grey[900],
            }}
        >
            <Container maxWidth="lg">
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    justifyContent="space-between"
                    alignItems="center"
                >
                    <Typography variant="body2" color="text.secondary">
                        {'Copyright © '}
                        <Link color="inherit" href="#">
                            Smart Energy Monitoring
                        </Link>{' '}
                        {new Date().getFullYear()}
                        {'.'}
                    </Typography>

                    <Stack direction="row" spacing={2}>
                        <Link href="#" variant="body2" color="text.secondary" underline="hover">
                            Privacy Policy
                        </Link>
                        <Link href="#" variant="body2" color="text.secondary" underline="hover">
                            Terms of Use
                        </Link>
                        <Link href="#" variant="body2" color="text.secondary" underline="hover">
                            Contact Us
                        </Link>
                    </Stack>
                </Stack>
            </Container>
        </Box>
    );
};

export default Footer;
