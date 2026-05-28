import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';
import { useApp } from '../contexts/AppContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { 
  Building, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowDownLeft, 
  ArrowUpRight,
  ClipboardList,
  CalendarDays
} from 'lucide-react';

const Dashboard = ({ setView, setSelectedBooking }) => {
  const { refreshRooms, refreshBookings } = useApp();
  const { user } = useAuth();
  
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [roomsData, bookingsData, logsData] = await Promise.all([
          api('/rooms'),
          api('/bookings'),
          api('/rooms/logs')
        ]);
        setRooms(roomsData);
        setBookings(bookingsData);
        setLogs(logsData);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [refreshRooms, refreshBookings]);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>Loading Dashboard metrics...</div>;
  }

  // Calculate Metrics
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter(r => r.status === 'Occupied').length;
  const dirtyRooms = rooms.filter(r => r.status === 'Dirty').length;
  const maintenanceRooms = rooms.filter(r => r.status === 'Maintenance').length;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  const todayStr = new Date().toISOString().split('T')[0];
  
  const arrivalsToday = bookings.filter(b => b.check_in_date === todayStr && b.status === 'Confirmed');
  const departuresToday = bookings.filter(b => b.check_out_date === todayStr && b.status === 'Checked-in');
  const activeGuests = bookings.filter(b => b.status === 'Checked-in').length;

  const handleBookingClick = (booking) => {
    setSelectedBooking(booking);
    setView('billing');
  };

  return (
    <div>
      {/* Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-info">
            <span className="metric-label">Occupancy Rate</span>
            <span className="metric-value">{occupancyRate}%</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {occupiedRooms} of {totalRooms} rooms occupied
            </span>
          </div>
          <div className="metric-icon-box gold">
            <Building size={24} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <span className="metric-label">Active Guests</span>
            <span className="metric-value">{activeGuests}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Currently checked in
            </span>
          </div>
          <div className="metric-icon-box blue">
            <Users size={24} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <span className="metric-label">Arrivals Today</span>
            <span className="metric-value">{arrivalsToday.length}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Awaiting check-in today
            </span>
          </div>
          <div className="metric-icon-box green">
            <ArrowDownLeft size={24} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <span className="metric-label">Clean Services Alert</span>
            <span className="metric-value">{dirtyRooms}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Rooms marked as Dirty
            </span>
          </div>
          <div className="metric-icon-box orange">
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      <div className="dashboard-split">
        {/* Main section: Today's Schedule */}
        <div className="dashboard-card">
          <div className="card-header-flex">
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CalendarDays size={18} color="var(--accent-gold)" /> Today's Expected Arrivals
            </h2>
            <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }} onClick={() => setView('bookings')}>
              Manage Bookings
            </button>
          </div>

          {arrivalsToday.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              No arrivals scheduled for today.
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="hms-table">
                <thead>
                  <tr>
                    <th>Guest</th>
                    <th>Room</th>
                    <th>Dates</th>
                    <th>Payment</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {arrivalsToday.map(b => (
                    <tr key={b.id}>
                      <td style={{ fontWeight: '600' }}>{b.guest_name}</td>
                      <td>Room {b.room_number} ({b.room_type})</td>
                      <td>{b.check_in_date} to {b.check_out_date}</td>
                      <td>
                        <span className={`pill ${b.payment_status === 'Paid' ? 'success' : 'neutral'}`}>
                          {b.payment_status || 'Unpaid'}
                        </span>
                      </td>
                      <td>
                        <button className="action-btn primary" onClick={() => setView('bookings')}>
                          Check-in Panel
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sidebar section: Recent Housekeeping Feed */}
        <div className="dashboard-card">
          <div className="card-header-flex">
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ClipboardList size={18} color="var(--accent-gold)" /> Housekeeping logs
            </h2>
            {user.role !== 'housekeeper' && (
              <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }} onClick={() => setView('rooms')}>
                Room Panel
              </button>
            )}
          </div>

          {logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              No housekeeping logs registered yet.
            </div>
          ) : (
            <div className="logs-list">
              {logs.slice(0, 5).map(log => (
                <div className="log-item" key={log.id}>
                  <div className="log-meta">
                    <span className="log-title">Room {log.room_number} &mdash; {log.action}</span>
                    <span className="log-notes">{log.notes}</span>
                    <span className="log-time">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <span className={`pill ${
                    log.action === 'Clean' ? 'success' :
                    log.action === 'Dirty' ? 'warning' :
                    log.action === 'Maintenance' ? 'danger' : 'info'
                  }`}>
                    {log.action}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
