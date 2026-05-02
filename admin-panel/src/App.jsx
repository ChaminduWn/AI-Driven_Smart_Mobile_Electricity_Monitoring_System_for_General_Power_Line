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
import SolarPage from './pages/SolarPage';
import NILMPage from './pages/NILMPage';
import AppliancesPage from './pages/AppliancesPage';
import BillsPage from './pages/BillsPage';
import PlansPage from './pages/PlansPage';
import SmartInsightsPage from './pages/SmartInsightsPage';
import TariffPage from './pages/TariffPage';

import Home from './pages/Homepage';
import MobileAppView from './pages/MobileAppView';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserLoginPage from './pages/UserLoginPage';
import UserRegisterPage from './pages/UserRegisterPage';
import ProfilePage from './pages/ProfilePage';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#00E5FF' }, // Cyan
    secondary: { main: '#3B82F6' }, // Blue
    background: {
      default: '#0A0D14', // Base bg
      paper: '#131520', // Card bg
    },
    text: {
      primary: '#ffffff',
      secondary: '#94A3B8',
    },
  },
  typography: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  components: {
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#0A0D14',
          borderRight: '1px solid #1E293B',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#0A0D14',
          borderBottom: '1px solid #1E293B',
          boxShadow: 'none',
        },
      },
    },
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

              {/* Legacy Route Redirects */}
              <Route path="/Solar Intelligence" element={<Navigate to="/d/solar" replace />} />
              <Route path="/Safety Assistant" element={<Navigate to="/d/safety" replace />} />
              <Route path="/Energy Analysis" element={<Navigate to="/d/analysis" replace />} />
              <Route path="/Outage Tracking" element={<Navigate to="/d/monitoring" replace />} />
              <Route path="/profile" element={<Navigate to="/d/profile" replace />} />
              
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
                <Route path="insights" element={<SmartInsightsPage />} />
                <Route path="nilm" element={<NILMPage />} />
                <Route path="monitoring" element={<LiveMeterPage />} />
                <Route path="solar" element={<SolarPage />} />
                <Route path="safety" element={<SafetyPage />} />
                <Route path="appliances" element={<AppliancesPage />} />
                <Route path="bills" element={<BillsPage />} />
                <Route path="plans" element={<PlansPage />} />
                <Route path="tariff" element={<TariffPage />} />
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
