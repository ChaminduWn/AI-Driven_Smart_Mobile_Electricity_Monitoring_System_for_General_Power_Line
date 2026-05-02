import React, { useState } from 'react';
import { Box } from '@mui/material';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import ElectricityDashboard from '../components/electricity/ElectricityDashboard';
import ProgressTracker from '../components/electricity/ProgressTracker';
import ApplianceManager from '../components/electricity/ApplianceManager';
import TariffCalculator from '../components/electricity/TariffCalculator';
import NILMDashboard from '../components/electricity/NILMDashboard';
import HouseholdAnalyser from '../components/electricity/HouseholdAnalyzer';
import ConsumptionEstimator from '../components/electricity/ConsumptionEstimator';
import IoTControlPanel from '../components/electricity/IoTControlPanel';



// Navigation Button
const NavButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-6 py-4 font-semibold transition-all border-b-2 ${active
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


    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'grey.900' }}>
      <Header />

      <Box sx={{ flexGrow: 1 }}>
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
              active={activeTab === 'tracker'}
              onClick={() => setActiveTab('tracker')}
            >
              Progress Tracker
            </NavButton>

            <NavButton
              active={activeTab === 'appliances'}
              onClick={() => setActiveTab('appliances')}
            >
              Appliances
            </NavButton>

            <NavButton
              active={activeTab === 'Disaggregation'}
              onClick={() => setActiveTab('Disaggregation')}
            >
              AI Energy Disaggregation
            </NavButton>

            <NavButton
              active={activeTab === 'household'}
              onClick={() => setActiveTab('household')}
            >
              Household Energy Analyzer
            </NavButton>

            <NavButton
              active={activeTab === 'ConsumptionEstimator'}
              onClick={() => setActiveTab('ConsumptionEstimator')}
            >
              Household Consumption Predictor
            </NavButton>

            <NavButton
              active={activeTab === 'calculator'}
              onClick={() => setActiveTab('calculator')}
            >
              Tariff Calculator
            </NavButton>

            <NavButton
              active={activeTab === 'iot-control'}
              onClick={() => setActiveTab('iot-control')}
            >
              IoT Smart Control
            </NavButton>


          </div>
        </nav>

        {/* Content */}
        <main className="p-6">
          {activeTab === 'dashboard' && <ElectricityDashboard />}
          {activeTab === 'calculator' && <TariffCalculator />}
          {activeTab === 'tracker' && <ProgressTracker />}
          {activeTab === 'appliances' && <ApplianceManager />}
          {activeTab === 'Disaggregation' && <NILMDashboard />}
          {activeTab === 'household' && <HouseholdAnalyser />}
          {activeTab === 'ConsumptionEstimator' && <ConsumptionEstimator />}
          {activeTab === 'iot-control' && <IoTControlPanel />}

        </main>
      </Box>
      <Footer />
    </Box>

  );
}