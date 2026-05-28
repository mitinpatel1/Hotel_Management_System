import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';
import { useApp } from '../contexts/AppContext.jsx';
import { ClipboardCheck, Sparkles, AlertCircle, Wrench, RefreshCw } from 'lucide-react';

const Housekeeping = () => {
  const { refreshRooms, triggerRefreshRooms, showNotification } = useApp();
  const [dirtyRooms, setDirtyRooms] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHousekeepingData();
  }, [refreshRooms]);

  const fetchHousekeepingData = async () => {
    try {
      setLoading(true);
      const [roomsData, logsData] = await Promise.all([
        api('/rooms'),
        api('/rooms/logs')
      ]);

      // Filter rooms that need cleaning or maintenance
      const itemsToClean = roomsData.filter(r => r.status === 'Dirty' || r.status === 'Maintenance');
      setDirtyRooms(itemsToClean);
      setLogs(logsData);
    } catch (err) {
      console.error('Error fetching housekeeping data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCleanRoom = async (room) => {
    try {
      await api(`/rooms/${room.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'Available' })
      });
      showNotification(`Room ${room.room_number} is clean and available for check-in.`);
      triggerRefreshRooms();
    } catch (err) {
      showNotification(err.message || 'Error updating cleaning status.', 'error');
    }
  };

  const handleMaintenanceRoom = async (room) => {
    try {
      await api(`/rooms/${room.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'Maintenance' })
      });
      showNotification(`Room ${room.room_number} set to Maintenance status.`);
      triggerRefreshRooms();
    } catch (err) {
      showNotification(err.message || 'Error updating room status.', 'error');
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
      {/* Active Cleaning Queue */}
      <div className="dashboard-card" style={{ padding: '2rem' }}>
        <div className="card-header-flex">
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Sparkles size={20} color="var(--accent-gold)" /> Housekeeping Cleaning Queue
          </h2>
          <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }} onClick={fetchHousekeepingData}>
            <RefreshCw size={12} /> Sync Queue
          </button>
        </div>

        {loading ? (
          <div>Loading cleaning records...</div>
        ) : dirtyRooms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-secondary)' }}>
            ✨ All rooms are fully cleaned and ready for guests!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {dirtyRooms.map(room => (
              <div 
                key={room.id} 
                className={`log-item`} 
                style={{ 
                  background: 'var(--bg-primary)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '8px', 
                  padding: '1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: '700', fontFamily: 'var(--font-serif)' }}>Room {room.room_number}</span>
                    <span className={`pill ${room.status === 'Dirty' ? 'warning' : 'danger'}`}>{room.status}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Type: {room.type} &mdash; Floor {room.floor}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                    Amenities: {room.amenities}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {room.status === 'Dirty' && (
                    <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={() => handleCleanRoom(room)}>
                      <Sparkles size={14} /> Mark Clean
                    </button>
                  )}
                  {room.status === 'Dirty' && (
                    <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={() => handleMaintenanceRoom(room)}>
                      <Wrench size={14} /> Send to Repair
                    </button>
                  )}
                  {room.status === 'Maintenance' && (
                    <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={() => handleCleanRoom(room)}>
                      <Sparkles size={14} /> Resolve & Clean
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Housekeeping Activity Timeline */}
      <div className="dashboard-card" style={{ padding: '2rem' }}>
        <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
          <ClipboardCheck size={20} color="var(--accent-gold)" /> Housekeeping logs
        </h2>

        {loading ? (
          <div>Loading logs...</div>
        ) : logs.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>No logs logged.</div>
        ) : (
          <div className="logs-list" style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
            {logs.map(log => (
              <div className="log-item" key={log.id}>
                <div className="log-meta">
                  <span className="log-title" style={{ fontWeight: '600' }}>Room {log.room_number} &mdash; {log.action}</span>
                  <span className="log-notes" style={{ margin: '0.1rem 0' }}>{log.notes}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>By: {log.staff_name || 'System'}</span>
                  <span className="log-time">{new Date(log.timestamp).toLocaleString()}</span>
                </div>
                <span className={`pill ${
                  log.action === 'Clean' ? 'success' :
                  log.action === 'Dirty' ? 'warning' :
                  log.action === 'Maintenance' ? 'danger' : 'info'
                }`} style={{ alignSelf: 'flex-start' }}>
                  {log.action}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Housekeeping;
