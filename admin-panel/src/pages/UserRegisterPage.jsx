import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, Phone, ArrowRight, Eye, EyeOff, Activity, Zap, FileText } from 'lucide-react';
import { authAPI } from '../services/api';

export default function UserRegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    account_number: '',
    password: '',
    confirm: ''
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validate = () => {
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) return 'Valid email is required.';
    if (!form.password || form.password.length < 8) return 'Password must be at least 8 characters.';
    if (form.password !== form.confirm) return 'Passwords do not match.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        email: form.email.trim().toLowerCase(),
        password: form.password,
        full_name: form.full_name.trim() || null,
        phone_number: form.phone_number.replace(/\D/g, '') || null,
        default_account_number: form.account_number.trim() || null,
      };

      await authAPI.register(payload);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const setObj = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const inputStyles = {
    width: '100%',
    padding: '16px 16px 16px 46px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '15px',
    outline: 'none',
    transition: 'all 0.3s ease',
  };

  const focusStyles = (e) => {
    e.target.style.borderColor = '#0ea5e9';
    e.target.style.backgroundColor = 'rgba(14, 165, 233, 0.05)';
    e.target.style.boxShadow = '0 0 0 4px rgba(14, 165, 233, 0.1)';
  };

  const blurStyles = (e) => {
    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
    e.target.style.boxShadow = 'none';
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#030712', fontFamily: "'Inter', sans-serif" }}>
      
      {/* Left side - Decorative/Branding */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '60px',
        position: 'relative',
        overflow: 'hidden',
        borderRight: '1px solid rgba(255,255,255,0.05)'
      }}>
        {/* Background Gradients */}
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(14,165,233,0.15) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        
        {/* Abstract grid */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.5 }} />

        <div style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserIcon color="white" size={24} />
            </div>
            <span style={{ color: 'white', fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px' }}>EMSCORE PORTAL</span>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 10, maxWidth: '440px' }}>
          <h1 style={{ color: 'white', fontSize: '48px', fontWeight: '700', lineHeight: '1.1', marginBottom: '24px' }}>
            Start Your <br />
            <span style={{ color: '#0ea5e9' }}>Energy Journey</span>
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '18px', lineHeight: '1.6' }}>
            Create an account to gain deep intelligence into your energy footprint and lower your bills.
          </p>

          <div style={{ display: 'flex', gap: '24px', marginTop: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Zap color="#0ea5e9" size={20} />
              <span style={{ color: '#cbd5e1', fontSize: '14px' }}>Smart App Integration</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Register Form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative'
      }}>
        <div style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 10 }}>
          
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 style={{ color: '#f8fafc', fontSize: '32px', fontWeight: '700', marginBottom: '12px' }}>Create Account</h2>
            <p style={{ color: '#94a3b8', fontSize: '15px' }}>Set up your personal user profile</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {error && (
              <div style={{ padding: '14px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '10px', color: '#f87171', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontWeight: '600' }}>Error:</span> {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <UserIcon color="#64748b" size={18} />
                </div>
                <input type="text" placeholder="Full Name" value={form.full_name} onChange={setObj('full_name')} required style={inputStyles} onFocus={focusStyles} onBlur={blurStyles} />
              </div>
            </div>

            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <Mail color="#64748b" size={18} />
              </div>
              <input type="email" placeholder="Email Address *" value={form.email} onChange={setObj('email')} required style={inputStyles} onFocus={focusStyles} onBlur={blurStyles} />
            </div>
            
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <Phone color="#64748b" size={18} />
              </div>
              <input type="tel" placeholder="Phone Number (optional)" value={form.phone_number} onChange={setObj('phone_number')} style={inputStyles} onFocus={focusStyles} onBlur={blurStyles} />
            </div>

            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <FileText color="#64748b" size={18} />
              </div>
              <input type="text" placeholder="Electricity Account Number" value={form.account_number} onChange={setObj('account_number')} style={inputStyles} onFocus={focusStyles} onBlur={blurStyles} />
            </div>

            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <Lock color="#64748b" size={18} />
              </div>
              <input type={showPass ? "text" : "password"} placeholder="Secure Password *" value={form.password} onChange={setObj('password')} required style={{ ...inputStyles, paddingRight: '46px' }} onFocus={focusStyles} onBlur={blurStyles} />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                {showPass ? <EyeOff color="#64748b" size={18} /> : <Eye color="#64748b" size={18} />}
              </button>
            </div>

            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <Lock color="#64748b" size={18} />
              </div>
              <input type={showPass ? "text" : "password"} placeholder="Confirm Password *" value={form.confirm} onChange={setObj('confirm')} required style={{ ...inputStyles, paddingRight: '46px' }} onFocus={focusStyles} onBlur={blurStyles} />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{
                marginTop: '10px',
                width: '100%',
                padding: '16px',
                backgroundColor: loading ? '#38bdf8' : '#0ea5e9',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 4px 14px 0 rgba(14, 165, 233, 0.39)',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => { if(!loading) e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 6px 20px rgba(14, 165, 233, 0.4)'; }}
              onMouseOut={(e) => { if(!loading) e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 14px rgba(14, 165, 233, 0.39)'; }}
            >
              {loading ? 'Registering...' : 'Complete Account Setup'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '32px', color: '#94a3b8', fontSize: '14px' }}>
            Already registered?{' '}
            <Link to="/login" style={{ color: '#0ea5e9', textDecoration: 'none', fontWeight: '600' }}>Sign in instead</Link>
            <br /><br />
            Administrator? <Link to="/admin/register" style={{ color: '#0ea5e9', textDecoration: 'none', fontWeight: '600' }}>Admin Registration</Link>
          </p>
        </div>
      </div>

    </div>
  );
}
