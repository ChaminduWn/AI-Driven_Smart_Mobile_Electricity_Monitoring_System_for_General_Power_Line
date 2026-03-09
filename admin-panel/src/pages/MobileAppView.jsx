import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function LoginScreen({ onLogin }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#13151D', color: '#fff' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 40, marginBottom: 40 }}>
        <div style={{ width: 70, height: 70, backgroundColor: '#3B82F6', borderRadius: 20, display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="#F97316">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>EnergyIQ</h1>
        <p style={{ color: '#94A3B8', fontSize: 12, marginTop: 4 }}>Track • Analyse • Save</p>
      </div>

      <div style={{ backgroundColor: '#1E2336', borderRadius: 24, padding: 24, flex: 1 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px 0' }}>Welcome back</h2>
        <p style={{ color: '#94A3B8', fontSize: 13, margin: '0 0 24px 0' }}>Sign in to your account</p>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94A3B8', marginBottom: 6 }}>Email</label>
          <input 
            type="email" 
            placeholder="you@example.com" 
            style={{ width: '100%', padding: '14px 16px', borderRadius: 12, backgroundColor: '#262C42', border: '1px solid #333B53', color: '#fff', fontSize: 14, outline: 'none' }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94A3B8', marginBottom: 6 }}>Password</label>
          <input 
            type="password" 
            placeholder="••••••••" 
            style={{ width: '100%', padding: '14px 16px', borderRadius: 12, backgroundColor: '#262C42', border: '1px solid #333B53', color: '#fff', fontSize: 14, outline: 'none' }}
          />
        </div>

        <button 
          onClick={onLogin}
          style={{ width: '100%', padding: '14px', borderRadius: 12, backgroundColor: '#3B82F6', color: '#fff', fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
        >
          <span style={{ fontSize: 16 }}>⚡</span> Sign In
        </button>

        <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0' }}>
          <div style={{ flex: 1, height: 1, backgroundColor: '#333B53' }} />
          <span style={{ padding: '0 12px', fontSize: 11, color: '#64748B', fontWeight: 600 }}>OR</span>
          <div style={{ flex: 1, height: 1, backgroundColor: '#333B53' }} />
        </div>

        <button style={{ width: '100%', padding: '14px', borderRadius: 12, backgroundColor: '#fff', color: '#1E293B', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#4285F4', fontWeight: 'bold' }}>G</span> Continue with Google
        </button>
        
        <p style={{ textAlign: 'center', fontSize: 12, color: '#94A3B8', marginTop: 24 }}>
          Don't have an account? <span style={{ color: '#3B82F6', fontWeight: 600, cursor: 'pointer' }}>Sign up</span>
        </p>
      </div>
    </motion.div>
  );
}

function DashboardScreen() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      style={{ height: '100%', backgroundColor: '#0A0D14', color: '#fff', display: 'flex', flexDirection: 'column' }}
    >
      <div style={{ padding: '24px 20px', flex: 1, overflowY: 'auto', paddingBottom: 100 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Good day, kanishka 👋</h1>
            <p style={{ color: '#64748B', fontSize: 11, marginTop: 4, margin: '4px 0 0 0' }}>ElecSmart Management System</p>
          </div>
          <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#1A1E2D', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <span style={{ color: '#F97316' }}>≡</span>
          </div>
        </div>

        {/* Account Info */}
        <div style={{ backgroundColor: '#1A1E2D', borderRadius: 16, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 20 }}>🏠</span>
          <div>
            <p style={{ color: '#64748B', fontSize: 10, margin: 0 }}>Account</p>
            <p style={{ color: '#fff', fontSize: 14, fontWeight: 600, margin: 0 }}>4199013709</p>
          </div>
        </div>

        {/* Main Bill Card */}
        <div style={{ backgroundColor: '#0F1320', borderRadius: 20, padding: 20, border: '1px solid #1E293B', marginBottom: 16, borderTopColor: '#00E5FF', borderTopWidth: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>February 2026</h2>
            <span style={{ backgroundColor: '#004C5A', color: '#00E5FF', fontSize: 10, fontWeight: 600, padding: '4px 8px', borderRadius: 100 }}>Latest</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <p style={{ color: '#00E5FF', fontSize: 22, fontWeight: 800, margin: '0 0 4px 0' }}>Rs. 529.74</p>
              <p style={{ color: '#64748B', fontSize: 11, margin: 0 }}>Total Charge</p>
            </div>
            <div style={{ width: 1, backgroundColor: '#1E293B' }} />
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: '#FFD600', fontSize: 22, fontWeight: 800, margin: '0 0 4px 0' }}>51 kWh</p>
              <p style={{ color: '#64748B', fontSize: 11, margin: 0 }}>Units Consumed</p>
            </div>
          </div>
          <button style={{ width: '100%', padding: '12px', backgroundColor: '#071824', borderRadius: 12, color: '#00E5FF', fontSize: 13, fontWeight: 600, border: '1px solid #0D2D41', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
            📊 Analyse This Bill →
          </button>
        </div>

        {/* 4 Stats Cards */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
          <div style={{ backgroundColor: '#131520', border: '1px solid #1E293B', borderRadius: 14, padding: "12px 10px", flex: '1 0 22%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ color: '#F97316', fontSize: 16, marginBottom: 8 }}>⚡</span>
            <p style={{ color: '#00E5FF', fontSize: 14, fontWeight: 700, margin: '0 0 2px 0' }}>2</p>
            <p style={{ color: '#64748B', fontSize: 9, margin: 0 }}>Appliances</p>
          </div>
          <div style={{ backgroundColor: '#131520', border: '1px solid #1E293B', borderRadius: 14, padding: "12px 10px", flex: '1 0 22%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ color: '#4ADE80', fontSize: 16, marginBottom: 8 }}>🔋</span>
            <p style={{ color: '#FFD600', fontSize: 14, fontWeight: 700, margin: '0 0 2px 0' }}>5.3</p>
            <p style={{ color: '#64748B', fontSize: 9, margin: 0 }}>Monthly kWh</p>
          </div>
          <div style={{ backgroundColor: '#131520', border: '1px solid #1E293B', borderRadius: 14, padding: "12px 10px", flex: '1 0 22%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ color: '#F59E0B', fontSize: 16, marginBottom: 8 }}>💰</span>
            <p style={{ color: '#4ADE80', fontSize: 14, fontWeight: 700, margin: '0 0 2px 0' }}>Rs. 105</p>
            <p style={{ color: '#64748B', fontSize: 9, margin: 0 }}>Est. Cost</p>
          </div>
          <div style={{ backgroundColor: '#131520', border: '1px solid #1E293B', borderRadius: 14, padding: "12px 10px", flex: '1 0 22%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ color: '#60A5FA', fontSize: 16, marginBottom: 8 }}>📅</span>
            <p style={{ color: '#F87171', fontSize: 14, fontWeight: 700, margin: '0 0 2px 0' }}>4 Rs</p>
            <p style={{ color: '#64748B', fontSize: 9, margin: 0 }}>Daily Avg</p>
          </div>
        </div>

        {/* System Modules */}
        <p style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: 1, marginBottom: 12 }}>• SYSTEM MODULES</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {/* Energy Analysis */}
          <div style={{ backgroundColor: '#131924', border: '1px solid #1E293B', borderRadius: 14, padding: 16, display: 'flex', alignItems: 'center', borderLeft: '3px solid #00E5FF' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#0B2230', display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
              <span style={{ color: '#F97316' }}>⚡</span>
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 2px 0', color: '#fff' }}>Energy Analysis & Bill Management</h3>
              <p style={{ fontSize: 10, color: '#64748B', margin: 0 }}>Track consumption • upload bills • analyse trends</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginLeft: 8 }}>
              <span style={{ color: '#00E5FF', fontSize: 12, fontWeight: 800 }}>Rs. 530</span>
              <span style={{ color: '#64748B', fontSize: 9 }}>latest bill</span>
            </div>
          </div>

          {/* Solar */}
          <div style={{ backgroundColor: '#18171A', border: '1px solid #1E293B', borderRadius: 14, padding: 16, display: 'flex', alignItems: 'center', borderLeft: '3px solid #FFD600' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#211D0B', display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
              <span style={{ color: '#FFD600' }}>☀️</span>
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 2px 0', color: '#fff' }}>Solar Power Recommendation</h3>
              <p style={{ fontSize: 10, color: '#64748B', margin: 0 }}>AI-powered solar sizing • ROI calculator • guide</p>
            </div>
            <span style={{ backgroundColor: '#332700', color: '#FFD600', fontSize: 9, fontWeight: 700, padding: '3px 6px', borderRadius: 6, marginRight: 8 }}>New</span>
          </div>

          {/* Outage */}
          <div style={{ backgroundColor: '#1A1416', border: '1px solid #1E293B', borderRadius: 14, padding: 16, display: 'flex', alignItems: 'center', borderLeft: '3px solid #F97316' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#2E1513', display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
              <span style={{ color: '#F87171' }}>🔴</span>
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 2px 0', color: '#fff' }}>Outage Reporting & Management</h3>
              <p style={{ fontSize: 10, color: '#64748B', margin: 0 }}>Report outages • live status • area fault map</p>
            </div>
            <span style={{ backgroundColor: '#361514', color: '#F87171', fontSize: 9, fontWeight: 700, padding: '3px 6px', borderRadius: 6, marginRight: 8 }}>Live</span>
          </div>

          {/* Safety */}
          <div style={{ backgroundColor: '#131A1E', border: '1px solid #1E293B', borderRadius: 14, padding: 16, display: 'flex', alignItems: 'center', borderLeft: '3px solid #4ADE80' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#0E2820', display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
              <span style={{ color: '#60A5FA' }}>🛡️</span>
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 2px 0', color: '#fff' }}>Safety & Disaster Management</h3>
              <p style={{ fontSize: 10, color: '#64748B', margin: 0 }}>AI assistant • live weather • emergency alerts</p>
            </div>
            <span style={{ backgroundColor: '#0B3322', color: '#4ADE80', fontSize: 9, fontWeight: 700, padding: '3px 6px', borderRadius: 6, marginRight: 8 }}>AI</span>
          </div>
        </div>

        {/* Quick Actions */}
        <p style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: 1, marginBottom: 12 }}>• QUICK ACTIONS</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ backgroundColor: '#131520', border: '1px solid #1E293B', borderRadius: 14, padding: 20, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: 24, marginBottom: 8 }}>📤</span>
            <p style={{ fontSize: 12, fontWeight: 700, margin: 0 }}>Upload Bill</p>
          </div>
          <div style={{ backgroundColor: '#131520', border: '1px solid #1E293B', borderRadius: 14, padding: 20, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: 24, marginBottom: 8 }}>⚡</span>
            <p style={{ fontSize: 12, fontWeight: 700, margin: 0 }}>Appliances</p>
          </div>
          <div style={{ backgroundColor: '#131520', border: '1px solid #1E293B', borderRadius: 14, padding: 20, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: 24, marginBottom: 8 }}>📊</span>
            <p style={{ fontSize: 12, fontWeight: 700, margin: 0 }}>NILM Report</p>
          </div>
          <div style={{ backgroundColor: '#131520', border: '1px solid #1E293B', borderRadius: 14, padding: 20, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: 24, marginBottom: 8 }}>🎯</span>
            <p style={{ fontSize: 12, fontWeight: 700, margin: 0 }}>Budget Plan</p>
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      <div style={{ backgroundColor: '#131520', borderTop: '1px solid #1E293B', display: 'flex', justifyContent: 'space-between', padding: '16px 24px 20px', position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#3B82F6' }}>
          <span style={{ fontSize: 20, marginBottom: 4 }}>🏠</span>
          <span style={{ fontSize: 10, fontWeight: 600 }}>Home</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#64748B' }}>
          <span style={{ fontSize: 20, marginBottom: 4 }}>📄</span>
          <span style={{ fontSize: 10, fontWeight: 600 }}>Bills</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#64748B' }}>
          <span style={{ fontSize: 20, marginBottom: 4 }}>⚡</span>
          <span style={{ fontSize: 10, fontWeight: 600 }}>Devices</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#64748B' }}>
          <span style={{ fontSize: 20, marginBottom: 4 }}>🎯</span>
          <span style={{ fontSize: 10, fontWeight: 600 }}>Track</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#64748B' }}>
          <span style={{ fontSize: 20, marginBottom: 4 }}>🤖</span>
          <span style={{ fontSize: 10, fontWeight: 600 }}>AI</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function MobileAppView() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9', padding: 20 }}>
      {/* Phone Mockup Frame */}
      <div style={{
        width: 375, 
        height: 812, 
        backgroundColor: '#0A0D14', 
        borderRadius: 45, 
        overflow: 'hidden', 
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', 
        position: 'relative', 
        border: '12px solid #000',
        transform: 'scale(0.95)'
      }}>
        {/* Notch */}
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 140, height: 30, backgroundColor: '#000',
          borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
          zIndex: 10
        }} />

        <AnimatePresence mode="wait">
          {!isLoggedIn ? (
             <LoginScreen onLogin={() => setIsLoggedIn(true)} key="login" />
          ) : (
             <DashboardScreen key="dashboard" />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
