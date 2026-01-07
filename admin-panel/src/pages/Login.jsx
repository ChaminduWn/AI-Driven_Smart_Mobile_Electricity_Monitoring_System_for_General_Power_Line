import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Link,
  Avatar,
  CircularProgress,
  Stack,
  Divider,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

export default function Login() {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: false, password: false });

  const handleLogin = async (e) => {
    e.preventDefault();

    // Basic client-side validation
    const newErrors = {
      email: !credentials.email.trim(),
      password: !credentials.password,
    };
    setErrors(newErrors);

    if (newErrors.email || newErrors.password) return;

    setLoading(true);

    // Simulate auth delay (replace with real auth)
    setTimeout(() => {
      setLoading(false);
      navigate('/member1');
    }, 1500);

    // In real app:
    // try {
    //   await loginAPI(credentials);
    //   navigate('/');
    // } catch (err) {
    //   setLoading(false);
    //   // handle error
    // }
  };

  const handleChange = (field) => (e) => {
    setCredentials({ ...credentials, [field]: e.target.value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: false });
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: 'grey.100',
        background: 'linear-gradient(to bottom, #f8fafc, #e2e8f0)',
      }}
    >
      <Paper
        elevation={8}
        sx={{
          p: 5,
          maxWidth: 420,
          width: '100%',
          borderRadius: 3,
          bgcolor: 'background.paper',
        }}
      >
        <Stack spacing={3} alignItems="center">
          {/* Logo/Avatar */}
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              width: 60,
              height: 60,
              boxShadow: 3,
            }}
          >
            <LockOutlinedIcon fontSize="large" />
          </Avatar>

          <Typography component="h1" variant="h4" fontWeight="600" color="text.primary">
            User Login
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Welcome back! Please login to your account.
          </Typography>
        </Stack>

        <Box component="form" onSubmit={handleLogin} sx={{ mt: 3 }}>
          <Stack spacing={2.5}>
            <TextField
              required
              fullWidth
              label="Email Address"
              type="email"
              autoComplete="email"
              autoFocus
              value={credentials.email}
              onChange={handleChange('email')}
              error={errors.email}
              helperText={errors.email && 'Email is required'}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />

            <TextField
              required
              fullWidth
              label="Password"
              type="password"
              autoComplete="current-password"
              value={credentials.password}
              onChange={handleChange('password')}
              error={errors.password}
              helperText={errors.password && 'Password is required'}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Link href="#" variant="body2" underline="hover" color="primary">
                Forgot password?
              </Link>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                mt: 2,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1.1rem',
                fontWeight: 600,
                boxShadow: 2,
                '&:hover': {
                  boxShadow: 6,
                },
              }}
            >
              {loading ? <CircularProgress size={26} color="inherit" /> : 'Sign In'}
            </Button>
          </Stack>

          <Divider sx={{ my: 4 }}>
            <Typography variant="body2" color="text.secondary">
              or
            </Typography>
          </Divider>

          <Typography variant="body2" color="text.secondary" align="center">
            Don't have an account?{' '}
            <Link href="#" underline="hover" fontWeight="medium">
              Contact administrator
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}