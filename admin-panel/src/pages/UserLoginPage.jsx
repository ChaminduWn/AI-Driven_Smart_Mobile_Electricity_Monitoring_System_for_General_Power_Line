import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, User, Activity, ShieldCheck, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function UserLoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      // Wait for AuthContext state to update before navigating, if needed
      // but usually context handles this if ProtectedRoute is used, 
      // navigating to home ensures they see dashboard
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const inputStyles = {
    width: '100%',
    padding: '16px 16px 16px 46px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    color: '#fff',
    fontSize: '15px',
    outline: 'none',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  const focusStyles = (e) => {
    e.target.style.borderColor = '#3b82f6';
    e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.05)';
    e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.15)';
  };

  const blurStyles = (e) => {
    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
    e.target.style.boxShadow = 'none';
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#020617', fontFamily: "'Inter', sans-serif" }}>
      
      {/* Left side - Decorative/Branding with Dynamic Design */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Animated Background Gradients */}
        <div style={{ position: 'absolute', top: '10%', left: '10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)', filter: 'blur(80px)', animation: 'pulse 8s ease-in-out infinite alternate' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '30vw', height: '30vw', background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)', filter: 'blur(80px)', animation: 'pulse 10s ease-in-out infinite alternate-reverse' }} />
        
        {/* Premium Grid */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '64px 64px', opacity: 0.6 }} />

        <div style={{ position: 'relative', zIndex: 10, maxWidth: '480px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(59, 130, 246, 0.4)' }}>
              <Zap color="white" size={28} fill="white" />
            </div>
            <span style={{ color: 'white', fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' }}>EMSCORE</span>
          </div>

          <h1 style={{ color: 'white', fontSize: '56px', fontWeight: '800', lineHeight: '1.1', marginBottom: '24px', letterSpacing: '-1px' }}>
            Smart Energy <br />
            <span style={{ background: 'linear-gradient(135deg, #60a5fa, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Made Simple</span>
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '20px', lineHeight: '1.6', fontWeight: '400' }}>
            Take control of your power consumption with AI-driven insights and real-time monitoring.
          </p>

          <div style={{ display: 'flex', gap: '32px', marginTop: '48px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 24px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '100px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <Activity color="#60a5fa" size={20} />
              <span style={{ color: '#f1f5f9', fontSize: '15px', fontWeight: '500' }}>Live Analytics</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 24px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '100px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <ShieldCheck color="#c084fc" size={20} />
              <span style={{ color: '#f1f5f9', fontSize: '15px', fontWeight: '500' }}>Secure Access</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Super Premium Glassmorphism Login Form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
        zIndex: 20
      }}>
        <div style={{ 
          width: '100%', 
          maxWidth: '440px', 
          backgroundColor: 'rgba(15, 23, 42, 0.6)', 
          backdropFilter: 'blur(20px)', 
          borderRadius: '24px', 
          padding: '48px 40px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}>
          
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ color: '#f8fafc', fontSize: '32px', fontWeight: '700', marginBottom: '12px', letterSpacing: '-0.5px' }}>Welcome back</h2>
            <p style={{ color: '#94a3b8', fontSize: '16px' }}>Sign in to access your intelligence dashboard</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {error && (
              <div style={{ padding: '16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', color: '#fca5a5', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <ShieldCheck color="#ef4444" size={20} />
                <span><strong style={{fontWeight: '600'}}>Sign in failed:</strong> {error}</span>
              </div>
            )}

            <div style={{ position: 'relative', group: 'input' }}>
              <div style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b', transition: 'color 0.3s' }}>
                <Mail size={20} />
              </div>
              <input 
                type="email" 
                placeholder="Email Address" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                style={inputStyles}
                onFocus={focusStyles}
                onBlur={blurStyles}
              />
            </div>

            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b', transition: 'color 0.3s' }}>
                <Lock size={20} />
              </div>
              <input 
                type={showPass ? "text" : "password"} 
                placeholder="Password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                style={{ ...inputStyles, paddingRight: '50px' }}
                onFocus={focusStyles}
                onBlur={blurStyles}
              />
              <button 
                type="button" 
                onClick={() => setShowPass(!showPass)} 
                style={{ position: 'absolute', right: '18px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#64748b', transition: 'color 0.3s' }}
                onMouseOver={(e) => e.currentTarget.style.color = '#f1f5f9'}
                onMouseOut={(e) => e.currentTarget.style.color = '#64748b'}
                aria-label={showPass ? "Hide password" : "Show password"}
              >
                {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" style={{ accentColor: '#3b82f6', width: '16px', height: '16px', borderRadius: '4px', cursor: 'pointer' }} />
                <span style={{ color: '#94a3b8', fontSize: '14px' }}>Remember me</span>
              </label>
              <a href="#" style={{ color: '#60a5fa', fontSize: '14px', textDecoration: 'none', fontWeight: '500', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = '#93c5fd'} onMouseOut={(e) => e.target.style.color = '#60a5fa'}>
                Forgot password?
              </a>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{
                marginTop: '16px',
                width: '100%',
                padding: '16px',
                background: loading ? '#3b82f6' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.4)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseOver={(e) => { 
                if(!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 15px 30px -5px rgba(37, 99, 235, 0.5)';
                }
              }}
              onMouseOut={(e) => { 
                if(!loading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(37, 99, 235, 0.4)';
                }
              }}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              {!loading && <ArrowRight size={20} />}
            </button>
          </form>

          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <p style={{ textAlign: 'center', margin: 0, color: '#94a3b8', fontSize: '15px' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: '600', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = '#93c5fd'} onMouseOut={(e) => e.target.style.color = '#60a5fa'}>
                Request Access
              </Link>
            </p>
            <p style={{ textAlign: 'center', marginTop: '16px', color: '#64748b', fontSize: '14px' }}>
              Administrator?{' '}
              <Link to="/admin/login" style={{ color: '#a855f7', textDecoration: 'none', fontWeight: '600', transition: 'color 0.2s', position: 'relative', zIndex: 100 }} onMouseOver={(e) => e.target.style.color = '#c084fc'} onMouseOut={(e) => e.target.style.color = '#a855f7'}>
                Admin Login
              </Link>
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}

