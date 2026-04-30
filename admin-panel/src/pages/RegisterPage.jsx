import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, ArrowRight, Eye, EyeOff, ShieldAlert, Shield, Server, Terminal, Key } from 'lucide-react';
import { authAPI } from '../services/api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', phone_number: '', admin_code: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (form.admin_code !== 'EMSCORE-ADMIN') {
      setError('Invalid Admin Authorization Passcode.');
      setLoading(false);
      return;
    }
    try {
      await authAPI.register(form);
      navigate('/admin/login');
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const inputStyles = {
    width: '100%',
    padding: '14px 16px 14px 46px',
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '6px',
    color: '#e2e8f0',
    fontSize: '14px',
    fontFamily: "'Inter', monospace",
    outline: 'none',
    transition: 'all 0.2s',
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#020617', fontFamily: "'Inter', sans-serif" }}>
      
      {/* Enterprise Left Panel */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px',
        backgroundColor: '#0f172a',
        borderRight: '1px solid #1e293b',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle tech background */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.03, backgroundImage: 'linear-gradient(#475569 1px, transparent 1px), linear-gradient(90deg, #475569 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        
        <div style={{ position: 'relative', zIndex: 10, maxWidth: '500px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '30px' }}>
            <ShieldAlert color="#38bdf8" size={36} />
            <span style={{ color: '#e2e8f0', fontSize: '28px', fontWeight: '800', letterSpacing: '2px' }}>EMSCORE <span style={{color: '#38bdf8'}}>ADMIN</span></span>
          </div>

          <h1 style={{ color: '#f8fafc', fontSize: '40px', fontWeight: '300', lineHeight: '1.2', marginBottom: '24px', letterSpacing: '-1px' }}>
            Privileged <br/>
            <strong style={{fontWeight: '700'}}>Registration Portal</strong>
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '16px', lineHeight: '1.7', marginBottom: '40px' }}>
            Establish a high-clearance administrative profile. Requires valid Security Passcode for activation.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', backgroundColor: '#1e293b', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
              <Key color="#94a3b8" />
              <div>
                <div style={{ color: '#e2e8f0', fontWeight: '600', fontSize: '14px' }}>Clearance Verification</div>
                <div style={{ color: '#64748b', fontSize: '12px' }}>Passcode required</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', backgroundColor: '#1e293b', borderRadius: '8px', borderLeft: '4px solid #38bdf8' }}>
              <Shield color="#94a3b8" />
              <div>
                <div style={{ color: '#e2e8f0', fontWeight: '600', fontSize: '14px' }}>Role-Based Access Control</div>
                <div style={{ color: '#64748b', fontSize: '12px' }}>Elevated permissions granted</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Register Right Panel */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative'
      }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>
          
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24', borderRadius: '20px', fontSize: '12px', fontWeight: '600', marginBottom: '16px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <ShieldAlert size={14} /> Identity Verification Required
            </div>
            <h2 style={{ color: '#f8fafc', fontSize: '28px', fontWeight: '600', marginBottom: '8px' }}>Admin Provisioning</h2>
            <p style={{ color: '#64748b', fontSize: '14px' }}>Enter your provisioning details below.</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {error && (
              <div style={{ padding: '12px 16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444', color: '#fca5a5', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {error}
              </div>
            )}

            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <User color="#64748b" size={16} />
                </div>
                <input 
                  type="text" 
                  value={form.full_name} 
                  onChange={set('full_name')} 
                  required 
                  style={inputStyles} 
                  onFocus={(e) => { e.target.style.borderColor = '#38bdf8'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#334155'; }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Work Email</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <Mail color="#64748b" size={16} />
                </div>
                <input 
                  type="email" 
                  value={form.email} 
                  onChange={set('email')} 
                  required 
                  style={inputStyles} 
                  onFocus={(e) => { e.target.style.borderColor = '#38bdf8'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#334155'; }}
                />
              </div>
            </div>
            
            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone Number</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <Phone color="#64748b" size={16} />
                </div>
                <input 
                  type="tel" 
                  value={form.phone_number} 
                  onChange={set('phone_number')} 
                  style={inputStyles} 
                  onFocus={(e) => { e.target.style.borderColor = '#38bdf8'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#334155'; }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Access Key (Password)</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <Lock color="#64748b" size={16} />
                </div>
                <input 
                  type={showPass ? "text" : "password"} 
                  value={form.password} 
                  onChange={set('password')} 
                  required 
                  style={{ ...inputStyles, paddingRight: '46px' }} 
                  onFocus={(e) => { e.target.style.borderColor = '#38bdf8'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#334155'; }}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPass(!showPass)} 
                  style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  {showPass ? <EyeOff color="#64748b" size={16} /> : <Eye color="#64748b" size={16} />}
                </button>
              </div>
            </div>

            <div style={{ marginTop: '8px' }}>
              <label style={{ display: 'block', color: '#f59e0b', fontSize: '12px', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Admin Authorization Code *</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <Key color="#f59e0b" size={16} />
                </div>
                <input 
                  type="text" 
                  value={form.admin_code} 
                  onChange={set('admin_code')} 
                  required 
                  style={{ ...inputStyles, borderColor: 'rgba(245, 158, 11, 0.4)' }} 
                  onFocus={(e) => { e.target.style.borderColor = '#f59e0b'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(245, 158, 11, 0.4)'; }}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{
                marginTop: '16px',
                width: '100%',
                padding: '14px',
                backgroundColor: loading ? '#0ea5e9' : '#0284c7',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                letterSpacing: '0.5px',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => { if(!loading) e.target.style.backgroundColor = '#0369a1'; }}
              onMouseOut={(e) => { if(!loading) e.target.style.backgroundColor = '#0284c7'; }}
            >
              {loading ? 'PROVISIONING...' : 'PROVISION PROFILE'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid #1e293b', textAlign: 'center' }}>
            <p style={{ color: '#64748b', fontSize: '13px' }}>
              Already provisioned?{' '}
              <Link to="/admin/login" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: '500' }}>Authenticate</Link>
              <br /><br />
              Standard User? <Link to="/register" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: '500' }}>User Registration</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
