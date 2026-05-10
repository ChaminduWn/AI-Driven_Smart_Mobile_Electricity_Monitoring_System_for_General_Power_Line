import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
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
  Alert,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import apiClient from '../services/final-apiClient';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [apiError, setApiError] = useState('');

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setApiError('');

    // Client-side validation
    const newErrors = { email: '', password: '' };
    
    if (!credentials.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(credentials.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!credentials.password) {
      newErrors.password = 'Password is required';
    } else if (credentials.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);

    if (newErrors.email || newErrors.password) {
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.post('/api/v1/auth/login', {
        email: credentials.email.trim(),
        password: credentials.password,
      });

      const { access_token, user } = response.data;

      if (!access_token) {
        throw new Error('Authentication failed. No token received.');
      }

      // Use auth context to store auth data
      await login(access_token, user);

      // Navigate to dashboard
      navigate('/member1');
    } catch (err) {
      console.error('Login error:', err);
      
      // Handle Axios error responses
      if (err.response) {
        const status = err.response.status;
        const detail = err.response.data?.detail || err.response.data?.message;
        
        if (status === 401) {
          setApiError('Invalid email or password');
        } else if (status === 403) {
          setApiError('Account is inactive. Please contact support.');
        } else if (status === 422) {
          setApiError('Invalid input. Please check your credentials.');
        } else {
          setApiError(detail || 'Login failed. Please try again.');
        }
      } else if (err.request) {
        setApiError('Cannot connect to server. Please check your connection.');
      } else {
        setApiError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (e) => {
    setCredentials({ ...credentials, [field]: e.target.value });
    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
    if (apiError) {
      setApiError('');
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
            {apiError && (
              <Alert severity="error" onClose={() => setApiError('')}>
                {apiError}
              </Alert>
            )}

            <TextField
              required
              fullWidth
              label="Email Address"
              type="email"
              autoComplete="email"
              autoFocus
              value={credentials.email}
              onChange={handleChange('email')}
              error={Boolean(errors.email)}
              helperText={errors.email}
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
              error={Boolean(errors.password)}
              helperText={errors.password}
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
            <Link component={RouterLink} to="/register" underline="hover" fontWeight="medium">
              Create one
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}