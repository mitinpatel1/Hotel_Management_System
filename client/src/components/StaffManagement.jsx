import React, { useState, useEffect, useCallback } from 'react';
import { Clock, CheckCircle, XCircle, Users, RefreshCw } from 'lucide-react';
import api from '../utils/api.js';

const roleBadge = (role) => {
  const styles = {
    admin:        { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444', border: 'rgba(239,68,68,0.3)',   label: 'Admin' },
    receptionist: { bg: 'rgba(99,102,241,0.12)',  color: '#6366f1', border: 'rgba(99,102,241,0.3)',  label: 'Receptionist' },
    housekeeper:  { bg: 'rgba(16,185,129,0.12)',  color: '#10b981', border: 'rgba(16,185,129,0.3)', label: 'Housekeeper' }
  };
  const s = styles[role] || styles.receptionist;
  return (
    <span style={{
      background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
      borderRadius: '20px', padding: '0.2rem 0.65rem',
      fontSize: '0.72rem', fontWeight: '600'
    }}>
      {s.label}
    </span>
  );
};

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Abhi';
  if (mins < 60) return `${mins} min pehle`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ghante pehle`;
  return `${Math.floor(hrs / 24)} din pehle`;
};

const StaffManagement = () => {
  // ── Staff list ───────────────────────────────────────────────────────────────
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  // ── Pending requests ─────────────────────────────────────────────────────────
  const [requests, setRequests] = useState([]);
  const [loadingReqs, setLoadingReqs] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [reqMsg, setReqMsg] = useState('');
  const [reqError, setReqError] = useState('');

  // api() automatically picks token from localStorage — no manual token needed
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const data = await api('/auth/users');
      setUsers(data);
    } catch {
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    setLoadingReqs(true);
    try {
      const data = await api('/auth/account-requests');
      setRequests(data);
    } catch {
      setRequests([]);
    } finally {
      setLoadingReqs(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchRequests();
  }, [fetchUsers, fetchRequests]);

  // ── Approve ──────────────────────────────────────────────────────────────────
  const handleApprove = async (id, name) => {
    if (!window.confirm(`"${name}" ka account approve karna chahte ho?`)) return;
    setProcessingId(id);
    setReqMsg(''); setReqError('');
    try {
      const data = await api(`/auth/account-requests/${id}/approve`, { method: 'POST' });
      setReqMsg(data.message);
      fetchRequests();
      fetchUsers();
    } catch (err) {
      setReqError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // ── Reject ───────────────────────────────────────────────────────────────────
  const handleReject = async (id, name) => {
    if (!window.confirm(`"${name}" ki request reject karna chahte ho?`)) return;
    setProcessingId(id);
    setReqMsg(''); setReqError('');
    try {
      const data = await api(`/auth/account-requests/${id}`, { method: 'DELETE' });
      setReqMsg(data.message);
      fetchRequests();
    } catch (err) {
      setReqError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // ── Delete user ───────────────────────────────────────────────────────────────
  const handleDelete = async (id, name) => {
    if (!window.confirm(`"${name}" ko remove karna chahte ho?`)) return;
    setDeletingId(id);
    try {
      await api(`/auth/users/${id}`, { method: 'DELETE' });
      fetchUsers();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── PENDING REQUESTS ──────────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-color)',
        borderRadius: '12px', padding: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={18} style={{ color: '#f59e0b' }} />
            Pending Account Requests
            {requests.length > 0 && (
              <span style={{
                background: '#f59e0b', color: '#fff',
                borderRadius: '20px', padding: '0.1rem 0.55rem',
                fontSize: '0.72rem', fontWeight: '700'
              }}>
                {requests.length}
              </span>
            )}
          </h3>
          <button
            onClick={fetchRequests}
            style={{
              background: 'none', border: '1px solid var(--border-color)',
              borderRadius: '6px', padding: '0.3rem 0.6rem',
              cursor: 'pointer', color: 'var(--text-muted)',
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              fontSize: '0.75rem'
            }}
          >
            <RefreshCw size={13} />
            Refresh
          </button>
        </div>

        {reqMsg && (
          <div style={{
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: '8px', padding: '0.6rem 0.9rem',
            fontSize: '0.82rem', color: '#10b981', marginBottom: '1rem'
          }}>
            {reqMsg}
          </div>
        )}
        {reqError && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '8px', padding: '0.6rem 0.9rem',
            fontSize: '0.82rem', color: '#ef4444', marginBottom: '1rem'
          }}>
            {reqError}
          </div>
        )}

        {loadingReqs ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Load ho raha hai...
          </div>
        ) : requests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Koi pending request nahi hai.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {requests.map(req => (
              <div key={req._id} style={{
                background: 'rgba(245,158,11,0.06)',
                border: '1px solid rgba(245,158,11,0.25)',
                borderRadius: '10px', padding: '1rem',
                display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap'
              }}>
                {/* Avatar */}
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: '#f59e0b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: '700', fontSize: '0.85rem', flexShrink: 0
                }}>
                  {req.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '0.15rem' }}>
                    {req.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    @{req.username} &nbsp;·&nbsp; {req.email}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {timeAgo(req.createdAt)}
                  </div>
                </div>

                {/* Role */}
                <div style={{ flexShrink: 0 }}>
                  {roleBadge(req.role)}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  <button
                    onClick={() => handleApprove(req._id, req.name)}
                    disabled={processingId === req._id}
                    style={{
                      background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)',
                      borderRadius: '7px', padding: '0.4rem 0.9rem',
                      cursor: 'pointer', color: '#10b981',
                      fontSize: '0.78rem', fontWeight: '600',
                      display: 'flex', alignItems: 'center', gap: '0.3rem'
                    }}
                  >
                    <CheckCircle size={14} />
                    {processingId === req._id ? '...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleReject(req._id, req.name)}
                    disabled={processingId === req._id}
                    style={{
                      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                      borderRadius: '7px', padding: '0.4rem 0.9rem',
                      cursor: 'pointer', color: '#ef4444',
                      fontSize: '0.78rem', fontWeight: '600',
                      display: 'flex', alignItems: 'center', gap: '0.3rem'
                    }}
                  >
                    <XCircle size={14} />
                    {processingId === req._id ? '...' : 'Reject'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── STAFF LIST ───────────────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-color)',
        borderRadius: '12px', padding: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={18} style={{ color: 'var(--accent-primary)' }} />
            Staff Members ({users.filter(u => u.role !== 'admin').length})
          </h3>
          <button
            onClick={fetchUsers}
            style={{
              background: 'none', border: '1px solid var(--border-color)',
              borderRadius: '6px', padding: '0.3rem 0.6rem',
              cursor: 'pointer', color: 'var(--text-muted)',
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              fontSize: '0.75rem'
            }}
          >
            <RefreshCw size={13} />
            Refresh
          </button>
        </div>

        {loadingUsers ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Load ho raha hai...
          </div>
        ) : users.filter(u => u.role !== 'admin').length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Koi staff member nahi hai. Requests approve karo upar se.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {users.filter(u => u.role !== 'admin').map(u => (
              <div key={u._id} style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                background: 'var(--bg-secondary)', borderRadius: '10px',
                padding: '0.85rem 1rem',
                border: '1px solid var(--border-color)'
              }}>
                {/* Avatar */}
                <div style={{
                  width: '38px', height: '38px', borderRadius: '50%',
                  background: 'var(--accent-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: '700', fontSize: '0.85rem', flexShrink: 0
                }}>
                  {u.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '0.15rem' }}>
                    {u.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    @{u.username} &nbsp;·&nbsp; {u.email}
                  </div>
                </div>

                {/* Role */}
                <div style={{ flexShrink: 0 }}>
                  {roleBadge(u.role)}
                </div>

                {/* Remove */}
                <button
                  onClick={() => handleDelete(u._id, u.name)}
                  disabled={deletingId === u._id}
                  style={{
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: '6px', padding: '0.35rem 0.75rem',
                    cursor: 'pointer', color: '#ef4444',
                    fontSize: '0.75rem', fontWeight: '600', flexShrink: 0
                  }}
                >
                  {deletingId === u._id ? '...' : 'Remove'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default StaffManagement;
