import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Technicians from './pages/Technicians';
import Users from './pages/Users';
import Services from './pages/Services';
import Support from './pages/Support';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="technicians" element={<Technicians />} />
        <Route path="users" element={<Users />} />
        <Route path="services" element={<Services />} />
        <Route path="support" element={<Support />} />
      </Route>
    </Routes>
  );
}

export default App;
