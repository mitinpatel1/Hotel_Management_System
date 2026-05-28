import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Hotel, Shield, User, Lock, Activity } from 'lucide-react';

const Login = () => {
  const { login, error } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return;
    
    setSubmitting(true);
    try {
      await login(username, password);
    } catch (err) {
      // Handled by auth error state
    } finally {
      setSubmitting(false);
    }
  };

  const autofill = (role) => {
    if (role === 'admin') {
      setUsername('admin');
      setPassword('admin123');
    } else if (role === 'receptionist') {
      setUsername('receptionist');
      setPassword('staff123');
    } else if (role === 'housekeeper') {
      setUsername('housekeeper');
      setPassword('maid123');
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-logo">
          <Hotel />
          <h1>Grand Horizon</h1>
          <p>Hotel Management System</p>
        </div>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={14} /> Username
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock size={14} /> Password
            </label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '0.85rem' }}
            disabled={submitting}
          >
            {submitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '1rem' }}>
            💡 Demo Accounts (click to autofill)
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
            <button
              onClick={() => autofill('admin')}
              className="btn btn-secondary"
              style={{ padding: '0.4rem', fontSize: '0.7rem', justifyContent: 'center' }}
            >
              Admin
            </button>
            <button
              onClick={() => autofill('receptionist')}
              className="btn btn-secondary"
              style={{ padding: '0.4rem', fontSize: '0.7rem', justifyContent: 'center' }}
            >
              Receptionist
            </button>
            <button
              onClick={() => autofill('housekeeper')}
              className="btn btn-secondary"
              style={{ padding: '0.4rem', fontSize: '0.7rem', justifyContent: 'center' }}
            >
              Cleaning
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
