import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layout
import DashboardLayout from './components/common/DashboardLayout';

// Pages
import Dashboard from './pages/Dashboard';
import Member1Dashboard from './pages/Member1Dashboard';
import Member2Dashboard from './pages/Member2Dashboard';
import Member3Dashboard from './pages/Member3Dashboard';
import Member4Dashboard from './pages/Member4Dashboard';
import Login from './pages/Login';

// Electricity Dashboard Components
import ElectricityDashboard from './components/electricity/ElectricityDashboard';
import ProgressTracker from './components/electricity/ProgressTracker';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// New component for electricity features with tab navigation
function ElectricityPage() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom right, #111827, #1f2937, #111827)' }}>
      {/* Navigation */}
      <nav style={{ backgroundColor: '#1f2937', borderBottom: '1px solid #374151', padding: '1rem' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => setActiveTab('dashboard')}
            style={{
              padding: '0.5rem 1.5rem',
              borderRadius: '0.5rem',
              fontWeight: '600',
              backgroundColor: activeTab === 'dashboard' ? '#2563eb' : 'transparent',
              color: activeTab === 'dashboard' ? '#ffffff' : '#9ca3af',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'dashboard') e.target.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'dashboard') e.target.style.color = '#9ca3af';
            }}
          >
            Electricity Dashboard
          </button>
          <button
            onClick={() => setActiveTab('tracker')}
            style={{
              padding: '0.5rem 1.5rem',
              borderRadius: '0.5rem',
              fontWeight: '600',
              backgroundColor: activeTab === 'tracker' ? '#2563eb' : 'transparent',
              color: activeTab === 'tracker' ? '#ffffff' : '#9ca3af',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'tracker') e.target.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'tracker') e.target.style.color = '#9ca3af';
            }}
          >
            Progress Tracker
          </button>
        </div>
      </nav>

      {/* Content */}
      <div style={{ padding: '1.5rem' }}>
        {activeTab === 'dashboard' && <ElectricityDashboard />}
        {activeTab === 'tracker' && <ProgressTracker />}
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="member1" element={<Member1Dashboard />} />
            <Route path="member2" element={<Member2Dashboard />} />
            <Route path="member3" element={<Member3Dashboard />} />
            <Route path="member4" element={<Member4Dashboard />} />
            <Route path="electricity" element={<ElectricityPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      <ToastContainer position="top-right" autoClose={3000} />
    </ThemeProvider>
  );
}

export default App;