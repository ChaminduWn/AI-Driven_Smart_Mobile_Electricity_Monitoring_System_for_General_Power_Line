import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Grid, TextField, Button, Alert } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    full_name: '',
    phone_number: '',
    default_account_number: '',
    address: '',
    city: '',
    country: '',
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || '',
        phone_number: user.phone_number || '',
        default_account_number: user.default_account_number || '',
        address: user.address || '',
        city: user.city || '',
        country: user.country || '',
      });
    }
  }, [user]);

  const handleChange = (field) => (event) => {
    setForm({ ...form, [field]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await updateProfile(form);
      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', mt: 4, mb: 6 }}>
      <Typography variant="h4" gutterBottom>
        Profile
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Manage your account details and connected electricity profile.
      </Typography>

      <Paper sx={{ p: 4, mt: 2 }} elevation={2}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Full Name"
                fullWidth
                value={form.full_name}
                onChange={handleChange('full_name')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email"
                fullWidth
                value={user?.email || ''}
                disabled
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Phone Number"
                fullWidth
                value={form.phone_number}
                onChange={handleChange('phone_number')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Account Number"
                fullWidth
                value={form.default_account_number}
                onChange={handleChange('default_account_number')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="City"
                fullWidth
                value={form.city}
                onChange={handleChange('city')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Country"
                fullWidth
                value={form.country}
                onChange={handleChange('country')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Address"
                fullWidth
                multiline
                minRows={3}
                value={form.address}
                onChange={handleChange('address')}
              />
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" color="primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save Profile'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
}
