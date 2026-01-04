import React, { useState } from 'react';
import { Typography, Box } from '@mui/material';
import { Zap } from 'lucide-react';

// Electricity components
import ElectricityDashboard from '../components/electricity/ElectricityDashboard';
import ProgressTracker from '../components/electricity/ProgressTracker';
import ApplianceManager from '../components/electricity/ApplianceManager';
import TariffCalculator from '../components/electricity/TariffCalculator';

// Navigation Button
const NavButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-6 py-4 font-semibold transition-all border-b-2 ${
      active
        ? 'text-blue-400 border-blue-500 bg-gray-750'
        : 'text-gray-400 border-transparent hover:text-white hover:border-gray-600'
    }`}
  >
    {children}
  </button>
);

export default function Member1Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <Box>
      {/* Page Title */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Electricity Management System
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Monitor and manage your electricity consumption
        </Typography>
      </Box>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-lg overflow-hidden">
        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3">
            <Zap className="w-8 h-8 text-blue-500" />
            <div>
              <h1 className="text-xl font-bold text-white">
                Smart Energy Monitoring
              </h1>
              <p className="text-sm text-gray-400">
                Track, analyze, and optimize energy usage
              </p>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <nav className="bg-gray-800 border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-6 flex gap-2 overflow-x-auto">
            <NavButton
              active={activeTab === 'dashboard'}
              onClick={() => setActiveTab('dashboard')}
            >
               Dashboard
            </NavButton>

            <NavButton
              active={activeTab === 'calculator'}
              onClick={() => setActiveTab('calculator')}
            >
               Tariff Calculator
            </NavButton>

            <NavButton
              active={activeTab === 'tracker'}
              onClick={() => setActiveTab('tracker')}
            >
              Progress Tracker
            </NavButton>

            <NavButton
              active={activeTab === 'appliances'}
              onClick={() => setActiveTab('appliances')}
            >
              🔌 Appliances
            </NavButton>
          </div>
        </nav>

        {/* Content */}
        <main className="p-6">
          {activeTab === 'dashboard' && <ElectricityDashboard />}
          {activeTab === 'calculator' && <TariffCalculator />}
          {activeTab === 'tracker' && <ProgressTracker />}
          {activeTab === 'appliances' && <ApplianceManager />}
        </main>
      </div>
    </Box>
  );
}