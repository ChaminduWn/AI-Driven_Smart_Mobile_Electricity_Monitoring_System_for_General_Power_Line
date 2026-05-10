import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Avatar,
  CircularProgress,
  Stack,
  Link,
  Alert,
} from '@mui/material';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import apiClient from '../services/final-apiClient';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhoneNumber = (phone) => {
    const cleaned = phone.replace(/[\s-]/g, '');
    return /^\d+$/.test(cleaned);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(form.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (form.password.length > 128) {
      newErrors.password = 'Password cannot exceed 128 characters';
    }

    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (form.phone_number && !validatePhoneNumber(form.phone_number)) {
      newErrors.phone_number = 'Phone number must contain only digits';
    }

    if (form.full_name && form.full_name.length > 255) {
      newErrors.full_name = 'Full name is too long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
    if (apiError) {
      setApiError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        email: form.email.trim(),
        password: form.password,
        full_name: form.full_name.trim() || null,
        phone_number: form.phone_number 
          ? form.phone_number.replace(/[\s-]/g, '') 
          : null,
      };

      const response = await apiClient.post('/api/v1/auth/register', payload);

      const { access_token, user } = response.data;

      if (!access_token) {
        throw new Error('Registration succeeded but authentication failed');
      }

      // Use auth context to store auth data
      await login(access_token, user);

      // Navigate to dashboard
      navigate('/member1');
    } catch (err) {
      console.error('Registration error:', err);

      // Handle Axios error responses
      if (err.response) {
        const status = err.response.status;
        const detail = err.response.data?.detail;
        
        if (status === 400) {
          // Email or phone already exists
          setApiError(detail || 'Email or phone number already registered');
        } else if (status === 422) {
          // Validation error from backend
          if (Array.isArray(detail)) {
            // Pydantic validation errors
            const errorMessages = detail.map(err => 
              `${err.loc[err.loc.length - 1]}: ${err.msg}`
            ).join(', ');
            setApiError(errorMessages);
          } else {
            setApiError(detail || 'Invalid input data');
          }
        } else if (status === 500) {
          setApiError('Server error. Please try again later.');
        } else {
          setApiError(detail || err.response.data?.message || 'Registration failed');
        }
      } else if (err.request) {
        setApiError('Cannot connect to server. Please check your connection.');
      } else {
        setApiError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
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
          maxWidth: 460,
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
            <PersonAddAlt1Icon fontSize="large" />
          </Avatar>

          <Typography component="h1" variant="h4" fontWeight="600" color="text.primary">
            Create Account
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Register to start tracking your electricity usage.
          </Typography>
        </Stack>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <Stack spacing={2.5}>
            {apiError && (
              <Alert severity="error" onClose={() => setApiError('')}>
                {apiError}
              </Alert>
            )}

            <TextField
              fullWidth
              label="Full Name"
              autoComplete="name"
              value={form.full_name}
              onChange={handleChange('full_name')}
              error={Boolean(errors.full_name)}
              helperText={errors.full_name || 'Optional'}
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            <TextField
              required
              fullWidth
              label="Email Address"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange('email')}
              error={Boolean(errors.email)}
              helperText={errors.email}
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            <TextField
              fullWidth
              label="Phone Number"
              type="tel"
              autoComplete="tel"
              value={form.phone_number}
              onChange={handleChange('phone_number')}
              error={Boolean(errors.phone_number)}
              helperText={errors.phone_number || 'Optional - digits only (e.g., 0771234567)'}
              variant="outlined"
              placeholder="0771234567"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            <TextField
              required
              fullWidth
              label="Password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange('password')}
              error={Boolean(errors.password)}
              helperText={errors.password || 'Minimum 8 characters, maximum 128'}
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            <TextField
              required
              fullWidth
              label="Confirm Password"
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={handleChange('confirmPassword')}
              error={Boolean(errors.confirmPassword)}
              helperText={errors.confirmPassword}
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

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
                '&:hover': { boxShadow: 6 },
              }}
            >
              {loading ? <CircularProgress size={26} color="inherit" /> : 'Sign Up'}
            </Button>
          </Stack>

          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
            Already have an account?{' '}
            <Link component={RouterLink} to="/" underline="hover" fontWeight="medium">
              Sign in
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}