import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layout
import DashboardLayout from './components/common/DashboardLayout';
import PublicLayout from './components/common/PublicLayout';

// Pages
import Dashboard from './pages/Dashboard';
import Member1Dashboard from './pages/Member1Dashboard';
import Member2Dashboard from './pages/Member2Dashboard';
import Member3Dashboard from './pages/Member3Dashboard';
import Member4Dashboard from './pages/Member4Dashboard';
import Login from './pages/Login';

import Home from './pages//Homepage';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <Router>
        <Routes>
          
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />

            {/* Direct member route */}
            <Route path="/Energy Analysis" element={<Member1Dashboard />}/>
            <Route path="/Outage Tracking" element={<Member2Dashboard />} />
            <Route path="/Solar Intelligence" element={<Member3Dashboard />} />
            <Route path="/Safety Assistant" element={<Member4Dashboard />} />
          </Route>

          {/* Dashboard Layout Routes */}
          <Route path="/d" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="member1" element={<Member1Dashboard />} />
            <Route path="member2" element={<Member2Dashboard />} />
            <Route path="solar-recommendations" element={<Member3Dashboard />} />
            <Route path="member4" element={<Member4Dashboard />} />
            <Route path="electricity" element={<Member1Dashboard />} />
            <Route path="homepage" element={<Home/>} />
          </Route>

          {/* Redirect unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>

      <ToastContainer position="top-right" autoClose={3000} />
    </ThemeProvider>
  );
}

export default App;