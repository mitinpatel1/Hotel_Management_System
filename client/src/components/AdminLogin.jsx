import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Hotel, Eye, EyeOff, ShieldAlert } from 'lucide-react';

const AdminLogin = () => {
  const { login, error } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setSubmitting(true);
    try {
      const user = await login(username, password);
      if (user.role !== 'admin') {
        localStorage.removeItem('hms_token');
        window.location.reload();
        setLocalError('Yeh page sirf Admin ke liye hai.');
      }
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const displayError = localError || error;

  return (
    <div className="login-wrapper">
      <div className="login-card" style={{ maxWidth: '400px', width: '100%' }}>

        <div className="login-logo">
          <Hotel />
          <h1>Grand Horizon</h1>
          <p>Admin Control Panel</p>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '0.5rem', marginBottom: '1.5rem',
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '8px', padding: '0.6rem 1rem',
          color: '#ef4444', fontSize: '0.82rem', fontWeight: '600'
        }}>
          <ShieldAlert size={16} />
          Yeh page sirf Admin ke liye hai
        </div>

        {displayError && (
          <div className="alert-error" style={{ marginBottom: '1rem' }}>{displayError}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label>Admin Username</label>
            <input
              type="text" className="form-control"
              placeholder="admin username"
              value={username} onChange={e => setUsername(e.target.value)}
              disabled={submitting} required autoFocus
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'} className="form-control"
                placeholder="admin password"
                value={password} onChange={e => setPassword(e.target.value)}
                disabled={submitting} required style={{ paddingRight: '2.75rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                style={{
                  position: 'absolute', right: '0.75rem', top: '50%',
                  transform: 'translateY(-50%)', background: 'none',
                  border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                  padding: 0, display: 'flex', alignItems: 'center'
                }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit" className="btn btn-primary"
            style={{
              width: '100%', justifyContent: 'center', padding: '0.85rem',
              background: '#ef4444', borderColor: '#ef4444'
            }}
            disabled={submitting}
          >
            {submitting ? 'Verifying...' : 'Admin Sign In'}
          </button>
        </form>

        <p style={{
          textAlign: 'center', marginTop: '1.25rem',
          fontSize: '0.75rem', color: 'var(--text-muted)'
        }}>
          Staff member ho?{' '}
          <a href="/" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
            Main page pe jao
          </a>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
