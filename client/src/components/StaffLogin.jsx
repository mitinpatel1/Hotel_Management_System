import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import {
  Hotel, User, Lock, Mail, UserCircle,
  Eye, EyeOff, ArrowLeft, ConciergeBell, Sparkles, Send, CheckCircle
} from 'lucide-react';
import api from '../utils/api.js';

const StaffLogin = () => {
  const { login, error } = useAuth();

  const [step, setStep] = useState('select');
  const [selectedRole, setSelectedRole] = useState(null);
  const [mode, setMode] = useState('login');
  const [canSignup, setCanSignup] = useState(false);

  const [showPass, setShowPass] = useState(false);
  const [showRegPass, setShowRegPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Login fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Signup / Request fields
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');

  useEffect(() => {
    const check = async () => {
      try {
        const status = await api('/auth/signup-status');
        // Signup allowed only after admin is created
        setCanSignup(status.requiresInviteCode);
      } catch {
        setCanSignup(true);
      }
    };
    check();
  }, []);

  const resetForm = () => {
    setUsername(''); setPassword('');
    setRegName(''); setRegUsername(''); setRegEmail('');
    setRegPassword(''); setRegConfirm('');
    setLocalError(''); setSuccessMsg('');
    setShowPass(false); setShowRegPass(false);
  };

  const selectRole = (role) => {
    resetForm();
    setSelectedRole(role);
    setMode('login');
    setStep('form');
  };

  const goBack = () => {
    setStep('select');
    setSelectedRole(null);
    resetForm();
  };

  const switchMode = (m) => {
    setMode(m);
    resetForm();
  };

  // ─── LOGIN HANDLER ───────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setLocalError('');
    setSubmitting(true);
    try {
      const user = await login(username, password);
      if (user.role === 'admin') {
        localStorage.removeItem('hms_token');
        window.location.reload();
        setLocalError('Admin ho? Admin portal use karo: /admin');
        return;
      }
      if (user.role !== selectedRole) {
        localStorage.removeItem('hms_token');
        window.location.reload();
        setLocalError(`Yeh account "${selectedRole}" ke liye nahi hai.`);
      }
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── REQUEST ACCOUNT HANDLER ─────────────────────────────────────────────────
  const handleRequest = async (e) => {
    e.preventDefault();
    setLocalError(''); setSuccessMsg('');

    if (!regName || !regUsername || !regEmail || !regPassword || !regConfirm) {
      return setLocalError('Saare fields fill karo.');
    }
    if (regPassword !== regConfirm) {
      return setLocalError('Dono passwords same nahi hain.');
    }
    if (regPassword.length < 6) {
      return setLocalError('Password kam se kam 6 characters ka hona chahiye.');
    }

    setSubmitting(true);
    try {
      const res = await fetch('http://localhost:5500/api/auth/request-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          username: regUsername,
          email: regEmail,
          password: regPassword,
          role: selectedRole
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Request bhejne mein error aaya.');
      setSuccessMsg(data.message);
      resetForm();
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const displayError = localError || error;

  const eyeBtn = {
    position: 'absolute', right: '0.75rem', top: '50%',
    transform: 'translateY(-50%)', background: 'none',
    border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
    padding: 0, display: 'flex', alignItems: 'center'
  };

  const roleConfig = {
    receptionist: {
      label: 'Receptionist',
      icon: ConciergeBell,
      color: '#6366f1',
      colorBg: 'rgba(99,102,241,0.12)',
      colorBorder: 'rgba(99,102,241,0.35)',
      desc: 'Bookings, check-in/out, guest management'
    },
    housekeeper: {
      label: 'Housekeeper',
      icon: Sparkles,
      color: '#10b981',
      colorBg: 'rgba(16,185,129,0.12)',
      colorBorder: 'rgba(16,185,129,0.35)',
      desc: 'Room cleaning, status updates'
    }
  };

  const rc = selectedRole ? roleConfig[selectedRole] : null;

  return (
    <div className="login-wrapper">
      <div className="login-card" style={{ maxWidth: '440px', width: '100%' }}>

        {/* Logo */}
        <div className="login-logo">
          <Hotel />
          <h1>Grand Horizon</h1>
          <p>Staff Portal</p>
        </div>

        {/* ── STEP 1: Role Select ─────────────────────────────────────────── */}
        {step === 'select' && (
          <div>
            <p style={{
              textAlign: 'center', color: 'var(--text-muted)',
              fontSize: '0.875rem', marginBottom: '1.5rem'
            }}>
              Apna role select karo
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {Object.entries(roleConfig).map(([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <button
                    key={key}
                    onClick={() => selectRole(key)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '1rem',
                      padding: '1rem 1.25rem',
                      background: cfg.colorBg,
                      border: `1px solid ${cfg.colorBorder}`,
                      borderRadius: '12px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '10px',
                      background: cfg.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Icon size={22} color="#fff" />
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', color: cfg.color, fontSize: '0.95rem' }}>
                        {cfg.label}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        {cfg.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STEP 2: Login / Signup Form ─────────────────────────────────── */}
        {step === 'form' && rc && (
          <div>
            {/* Back + Role Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <button
                onClick={goBack}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
                  padding: '0.25rem'
                }}
              >
                <ArrowLeft size={18} />
              </button>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                background: rc.colorBg, border: `1px solid ${rc.colorBorder}`,
                borderRadius: '20px', padding: '0.3rem 0.9rem',
                fontSize: '0.78rem', fontWeight: '600', color: rc.color
              }}>
                <rc.icon size={13} />
                {rc.label}
              </div>
            </div>

            {/* Tabs */}
            <div style={{
              display: 'flex', background: 'var(--bg-secondary)',
              borderRadius: '10px', padding: '4px',
              marginBottom: '1.5rem'
            }}>
              {['login', 'signup'].map(m => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  disabled={m === 'signup' && !canSignup}
                  style={{
                    flex: 1, padding: '0.55rem',
                    border: 'none', borderRadius: '8px', cursor: m === 'signup' && !canSignup ? 'not-allowed' : 'pointer',
                    fontWeight: '600', fontSize: '0.875rem',
                    background: mode === m ? 'var(--bg-card)' : 'transparent',
                    color: mode === m ? 'var(--text-primary)' : 'var(--text-muted)',
                    boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
                    transition: 'all 0.2s',
                    opacity: m === 'signup' && !canSignup ? 0.4 : 1
                  }}
                >
                  {m === 'login' ? 'Sign In' : 'Request Account'}
                </button>
              ))}
            </div>

            {/* ─── LOGIN FORM ─── */}
            {mode === 'login' && (
              <form onSubmit={handleLogin}>
                {displayError && (
                  <div className="alert alert-error" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                    {displayError}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Username</label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{
                      position: 'absolute', left: '0.75rem', top: '50%',
                      transform: 'translateY(-50%)', color: 'var(--text-muted)'
                    }} />
                    <input
                      type="text" className="form-control"
                      placeholder="Username daalo"
                      value={username} onChange={e => setUsername(e.target.value)}
                      style={{ paddingLeft: '2.25rem' }}
                      required autoFocus
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{
                      position: 'absolute', left: '0.75rem', top: '50%',
                      transform: 'translateY(-50%)', color: 'var(--text-muted)'
                    }} />
                    <input
                      type={showPass ? 'text' : 'password'} className="form-control"
                      placeholder="Password daalo"
                      value={password} onChange={e => setPassword(e.target.value)}
                      style={{ paddingLeft: '2.25rem', paddingRight: '2.75rem' }}
                      required
                    />
                    <button type="button" style={eyeBtn} onClick={() => setShowPass(p => !p)}>
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit" className="btn btn-primary"
                  style={{ width: '100%', marginTop: '0.5rem' }}
                  disabled={submitting}
                >
                  {submitting ? 'Logging in...' : 'Sign In'}
                </button>
              </form>
            )}

            {/* ─── REQUEST ACCOUNT FORM ─── */}
            {mode === 'signup' && (
              <form onSubmit={handleRequest}>
                {successMsg ? (
                  <div style={{
                    textAlign: 'center', padding: '2rem 1rem',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem'
                  }}>
                    <CheckCircle size={48} color="#10b981" />
                    <p style={{ color: '#10b981', fontWeight: '600', fontSize: '0.95rem', margin: 0 }}>
                      {successMsg}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
                      Admin approve karega tab aap sign in kar sakoge.
                    </p>
                    <button
                      type="button"
                      onClick={() => { setSuccessMsg(''); switchMode('login'); }}
                      className="btn btn-primary"
                      style={{ marginTop: '0.5rem', padding: '0.5rem 1.5rem' }}
                    >
                      Sign In page pe jao
                    </button>
                  </div>
                ) : (
                  <>
                    {displayError && (
                      <div className="alert alert-error" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                        {displayError}
                      </div>
                    )}

                    <div style={{
                      background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                      borderRadius: '8px', padding: '0.65rem 0.9rem',
                      fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.1rem'
                    }}>
                      Request bhejne ke baad admin approve karega. Approve hone ke baad hi sign in ho sakoge.
                    </div>

                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <div style={{ position: 'relative' }}>
                        <UserCircle size={16} style={{
                          position: 'absolute', left: '0.75rem', top: '50%',
                          transform: 'translateY(-50%)', color: 'var(--text-muted)'
                        }} />
                        <input
                          type="text" className="form-control"
                          placeholder="Poora naam"
                          value={regName} onChange={e => setRegName(e.target.value)}
                          style={{ paddingLeft: '2.25rem' }} required autoFocus
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Username</label>
                      <div style={{ position: 'relative' }}>
                        <User size={16} style={{
                          position: 'absolute', left: '0.75rem', top: '50%',
                          transform: 'translateY(-50%)', color: 'var(--text-muted)'
                        }} />
                        <input
                          type="text" className="form-control"
                          placeholder="Username banao"
                          value={regUsername} onChange={e => setRegUsername(e.target.value)}
                          style={{ paddingLeft: '2.25rem' }} required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <div style={{ position: 'relative' }}>
                        <Mail size={16} style={{
                          position: 'absolute', left: '0.75rem', top: '50%',
                          transform: 'translateY(-50%)', color: 'var(--text-muted)'
                        }} />
                        <input
                          type="email" className="form-control"
                          placeholder="Email address"
                          value={regEmail} onChange={e => setRegEmail(e.target.value)}
                          style={{ paddingLeft: '2.25rem' }} required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Password</label>
                      <div style={{ position: 'relative' }}>
                        <Lock size={16} style={{
                          position: 'absolute', left: '0.75rem', top: '50%',
                          transform: 'translateY(-50%)', color: 'var(--text-muted)'
                        }} />
                        <input
                          type={showRegPass ? 'text' : 'password'} className="form-control"
                          placeholder="Password (min 6 chars)"
                          value={regPassword} onChange={e => setRegPassword(e.target.value)}
                          style={{ paddingLeft: '2.25rem', paddingRight: '2.75rem' }} required
                        />
                        <button type="button" style={eyeBtn} onClick={() => setShowRegPass(p => !p)}>
                          {showRegPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Confirm Password</label>
                      <div style={{ position: 'relative' }}>
                        <Lock size={16} style={{
                          position: 'absolute', left: '0.75rem', top: '50%',
                          transform: 'translateY(-50%)', color: 'var(--text-muted)'
                        }} />
                        <input
                          type="password" className="form-control"
                          placeholder="Password dobara daalo"
                          value={regConfirm} onChange={e => setRegConfirm(e.target.value)}
                          style={{ paddingLeft: '2.25rem' }} required
                        />
                      </div>
                    </div>

                    <div style={{
                      background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                      borderRadius: '8px', padding: '0.65rem 0.9rem',
                      fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem'
                    }}>
                      Role: <span style={{ fontWeight: '600', color: rc.color }}>{rc.label}</span>
                    </div>

                    <button
                      type="submit" className="btn btn-primary"
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                      disabled={submitting}
                    >
                      <Send size={15} />
                      {submitting ? 'Bhej rahe hain...' : 'Send Request to Admin'}
                    </button>
                  </>
                )}
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default StaffLogin;
