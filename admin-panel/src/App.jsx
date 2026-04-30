import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Layout
import DashboardLayout from './components/common/DashboardLayout';
import PublicLayout from './components/common/PublicLayout';

// Pages
import Dashboard from './pages/Dashboard';
import DashboardPage from './pages/DashboardPage';
import AnalysisPage from './pages/AnalysisPage';
import SafetyPage from './pages/SafetyPage';
import LiveMeterPage from './pages/LiveMeterPage';

import Home from './pages/Homepage';
import MobileAppView from './pages/MobileAppView';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserLoginPage from './pages/UserLoginPage';
import UserRegisterPage from './pages/UserRegisterPage';
import ProfilePage from './pages/ProfilePage';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
  },
});

function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;

  const redirectTo = location.pathname.startsWith('/admin') ? '/admin/login' : '/login';
  return isAuthenticated ? <Outlet /> : <Navigate to={redirectTo} replace />;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <Router>
        <AuthProvider>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />

              {/* Public Modules */}
              <Route path="/Solar Intelligence" element={<AnalysisPage />} />
              <Route path="/Safety Assistant" element={<SafetyPage />} />

              {/* Protected Modules */}
              <Route element={<ProtectedRoute />}>
                <Route path="/Energy Analysis" element={<AnalysisPage />}/>
                <Route path="/Outage Tracking" element={<LiveMeterPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
              
              <Route path="/login" element={<UserLoginPage />} />
              <Route path="/register" element={<UserRegisterPage />} />
              <Route path="/admin/login" element={<LoginPage />} />
              <Route path="/admin/register" element={<RegisterPage />} />
              
              {/* Legacy Route Redirects */}
              <Route path="/user/login" element={<Navigate to="/login" replace />} />
              <Route path="/user/register" element={<Navigate to="/register" replace />} />
            </Route>

            <Route path="/app" element={<MobileAppView />} />

            {/* Dashboard Layout Routes */}
            <Route path="/d" element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="analysis" element={<AnalysisPage />} />
                <Route path="monitoring" element={<LiveMeterPage />} />
                <Route path="solar" element={<AnalysisPage />} />
                <Route path="safety" element={<SafetyPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="homepage" element={<Home/>} />
              </Route>
            </Route>

            {/* Redirect unknown routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </Router>

      <ToastContainer position="top-right" autoClose={3000} />
    </ThemeProvider>
  );
}

export default App;
