import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export default function PublicLayout() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      background: '#F8FAFF',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      overflowX: "hidden"
    }}>
      <Navbar />
      <main style={{ flex: 1, paddingTop: isHome ? 0 : '68px' }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
