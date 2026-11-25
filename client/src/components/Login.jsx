import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import {
  Hotel, User, Lock, Mail, UserCircle,
  ShieldCheck, Eye, EyeOff, KeyRound, Briefcase
} from 'lucide-react';
import api from '../utils/api.js';

const Login = () => {
  const { login, register, error } = useAuth();

  // 'login' | 'register'
  const [mode, setMode] = useState('login');
  // null = checking, 'first' = pehla user (admin), 'invite' = invite code se
  const [setupMode, setSetupMode] = useState(null);

  // Shared
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Login fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Register fields
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regRole, setRegRole] = useState('receptionist');
  const [inviteCode, setInviteCode] = useState('');

  // Check if first user or invite-based
  useEffect(() => {
    const checkSetup = async () => {
      try {
        // Send empty body → will get 400 (validation) if no users, 403 if admin exists
        await api('/auth/register', {
          method: 'POST',
          body: JSON.stringify({})
        });
      } catch (err) {
        if (err.status === 403) {
          // Users exist — invite code needed
          setSetupMode('invite');
        } else {
          // 400 / other → no users yet
          setSetupMode('first');
        }
      }
    };
    checkSetup();
  }, []);

  // ── LOGIN ──
  const handleLogin = async (e) => {
    e.preventDefault();
    setLocalError('');
    setSubmitting(true);
    try {
      await login(username, password);
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── REGISTER ──
  const handleRegister = async (e) => {
    e.preventDefault();
    setLocalError('');
    setSuccessMsg('');

    if (!regName || !regUsername || !regEmail || !regPassword || !regConfirm) {
      return setLocalError('Saare fields fill karo.');
    }
    if (regPassword !== regConfirm) {
      return setLocalError('Dono passwords same nahi hain.');
    }
    if (regPassword.length < 6) {
      return setLocalError('Password kam se kam 6 characters ka hona chahiye.');
    }
    if (setupMode === 'invite' && !inviteCode.trim()) {
      return setLocalError('Invite code daalo.');
    }

    setSubmitting(true);
    try {
      await register(regUsername, regPassword, regEmail, regName, regRole, inviteCode);
      setSuccessMsg('Account ban gaya! Logging in...');
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const displayError = localError || error;

  const inputStyle = {
    paddingRight: '2.75rem'
  };

  const eyeBtn = {
    position: 'absolute', right: '0.75rem', top: '50%',
    transform: 'translateY(-50%)', background: 'none',
    border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0,
    display: 'flex', alignItems: 'center'
  };

  return (
    <div className="login-wrapper">
      <div className="login-card" style={{ maxWidth: '430px', width: '100%' }}>

        {/* Logo */}
        <div className="login-logo">
          <Hotel />
          <h1>Grand Horizon</h1>
          <p>Hotel Management System</p>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-secondary)',
          borderRadius: '10px',
          padding: '4px',
          marginBottom: '1.5rem',
          gap: '4px'
        }}>
          <button
            type="button"
            onClick={() => { setMode('login'); setLocalError(''); setSuccessMsg(''); }}
            style={{
              flex: 1, padding: '0.55rem', border: 'none', borderRadius: '8px',
              cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600',
              transition: 'all 0.2s',
              background: mode === 'login' ? 'var(--accent-primary)' : 'transparent',
              color: mode === 'login' ? '#fff' : 'var(--text-muted)',
            }}
          >
            🔑 Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setLocalError(''); setSuccessMsg(''); }}
            style={{
              flex: 1, padding: '0.55rem', border: 'none', borderRadius: '8px',
              cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600',
              transition: 'all 0.2s',
              background: mode === 'register' ? '#f59e0b' : 'transparent',
              color: mode === 'register' ? '#fff' : 'var(--text-muted)',
            }}
          >
            {setupMode === 'first' ? '🛡️ Setup Admin' : '📝 Sign Up'}
          </button>
        </div>

        {/* Alerts */}
        {displayError && (
          <div className="alert-error" style={{ marginBottom: '1rem' }}>⚠️ {displayError}</div>
        )}
        {successMsg && (
          <div style={{
            background: 'rgba(16,185,129,0.1)', color: '#10b981',
            border: '1px solid #10b981', borderRadius: '8px',
            padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem'
          }}>
            ✅ {successMsg}
          </div>
        )}

        {/* ══════════ SIGN IN FORM ══════════ */}
        {mode === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={14} /> Username
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="apna username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lock size={14} /> Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  className="form-control"
                  placeholder="apna password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={submitting}
                  required
                  style={inputStyle}
                />
                <button type="button" style={eyeBtn} onClick={() => setShowPass(p => !p)}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '0.85rem' }}
              disabled={submitting}
            >
              {submitting ? 'Logging in...' : '🔑 Sign In'}
            </button>

            <p style={{
              textAlign: 'center', marginTop: '1rem',
              fontSize: '0.75rem', color: 'var(--text-muted)'
            }}>
              Account nahi hai? <span
                style={{ color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => setMode('register')}
              >Sign Up karo</span>
            </p>
          </form>
        )}

        {/* ══════════ SIGN UP FORM ══════════ */}
        {mode === 'register' && (
          <form onSubmit={handleRegister}>

            {/* Info banner */}
            {setupMode === 'first' ? (
              <div style={{
                background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.25rem',
                fontSize: '0.8rem', color: '#f59e0b',
                display: 'flex', alignItems: 'center', gap: '0.5rem'
              }}>
                <ShieldCheck size={16} />
                <span>Pehla account banaya ja raha hai — yeh <strong>Admin</strong> banega.</span>
              </div>
            ) : (
              <div style={{
                background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.25rem',
                fontSize: '0.8rem', color: '#818cf8',
                display: 'flex', alignItems: 'center', gap: '0.5rem'
              }}>
                <KeyRound size={16} />
                <span>Admin se <strong>Invite Code</strong> maango aur apna role select karo.</span>
              </div>
            )}

            {/* Full Name */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserCircle size={14} /> Full Name
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Jaise: Rahul Patel"
                value={regName}
                onChange={e => setRegName(e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            {/* Username */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={14} /> Username
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="login ke liye"
                value={regUsername}
                onChange={e => setRegUsername(e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            {/* Email */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={14} /> Email
              </label>
              <input
                type="email"
                className="form-control"
                placeholder="apna email"
                value={regEmail}
                onChange={e => setRegEmail(e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            {/* Role selector — only for non-first users */}
            {setupMode === 'invite' && (
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Briefcase size={14} /> Role
                </label>
                <select
                  className="form-control"
                  value={regRole}
                  onChange={e => setRegRole(e.target.value)}
                  disabled={submitting}
                >
                  <option value="receptionist">Receptionist</option>
                  <option value="housekeeper">Housekeeper</option>
                </select>
              </div>
            )}

            {/* Password */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lock size={14} /> Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  className="form-control"
                  placeholder="kam se kam 6 characters"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  disabled={submitting}
                  required
                  style={inputStyle}
                />
                <button type="button" style={eyeBtn} onClick={() => setShowPass(p => !p)}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lock size={14} /> Confirm Password
              </label>
              <input
                type={showPass ? 'text' : 'password'}
                className="form-control"
                placeholder="dobara password"
                value={regConfirm}
                onChange={e => setRegConfirm(e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            {/* Invite Code — only for non-first users */}
            {setupMode === 'invite' && (
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <KeyRound size={14} /> Invite Code
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Admin se maango"
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value)}
                  disabled={submitting}
                  required
                  style={{ letterSpacing: '0.1em', textTransform: 'uppercase' }}
                />
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: '100%', justifyContent: 'center', padding: '0.85rem',
                marginTop: '0.5rem',
                background: setupMode === 'first' ? '#f59e0b' : 'var(--accent-primary)',
                borderColor: setupMode === 'first' ? '#f59e0b' : 'var(--accent-primary)'
              }}
              disabled={submitting}
            >
              {submitting
                ? 'Account ban raha hai...'
                : setupMode === 'first'
                  ? '🛡️ Create Admin Account'
                  : '📝 Create Account'}
            </button>

            <p style={{
              textAlign: 'center', marginTop: '1rem',
              fontSize: '0.75rem', color: 'var(--text-muted)'
            }}>
              Account hai? <span
                style={{ color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => setMode('login')}
              >Sign In karo</span>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
