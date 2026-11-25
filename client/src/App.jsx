import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext.jsx';
import { useApp } from './contexts/AppContext.jsx';

// Component imports
import AdminLogin from './components/AdminLogin.jsx';
import StaffLogin from './components/StaffLogin.jsx';
import Dashboard from './components/Dashboard.jsx';
import RoomsGrid from './components/RoomsGrid.jsx';
import Bookings from './components/Bookings.jsx';
import Guests from './components/Guests.jsx';
import Housekeeping from './components/Housekeeping.jsx';
import Billing from './components/Billing.jsx';
import StaffManagement from './components/StaffManagement.jsx';

// Icon imports
import { 
  Hotel, 
  LayoutDashboard, 
  Bed, 
  CalendarCheck, 
  Users2, 
  Sparkles, 
  ReceiptText, 
  LogOut, 
  Sun, 
  Moon, 
  Bell,
  UserCog
} from 'lucide-react';

// ── Loading Screen ──────────────────────────────────────────────────────────
const LoadingScreen = () => (
  <div style={{
    height: '100vh', display: 'flex', flexDirection: 'column',
    justifyContent: 'center', alignItems: 'center',
    background: '#0a0f1d', color: '#f3f4f6', fontFamily: 'sans-serif'
  }}>
    <div style={{ marginBottom: '1rem', fontSize: '1.2rem', fontWeight: 'bold' }}>
      Loading Grand Horizon Portal...
    </div>
    <div style={{ color: '#6b7280' }}>Checking session token security...</div>
  </div>
);

// ── Main Dashboard Shell (shown after login) ────────────────────────────────
const DashboardShell = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, notification } = useApp();
  const [view, setView] = useState('dashboard');
  const [selectedBooking, setSelectedBooking] = useState(null);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'receptionist'] },
    { id: 'rooms', label: 'Rooms Matrix', icon: Bed, roles: ['admin', 'receptionist'] },
    { id: 'bookings', label: 'Bookings Planner', icon: CalendarCheck, roles: ['admin', 'receptionist'] },
    { id: 'guests', label: 'Guest Directory', icon: Users2, roles: ['admin', 'receptionist'] },
    { id: 'housekeeping', label: 'Housekeeping', icon: Sparkles, roles: ['admin', 'receptionist', 'housekeeper'] },
    { id: 'billing', label: 'Billing & POS', icon: ReceiptText, roles: ['admin', 'receptionist'] },
    { id: 'staff', label: 'Staff Management', icon: UserCog, roles: ['admin'] },
  ];

  const authorizedNavItems = navItems.filter(item => item.roles.includes(user.role));
  const activeView = authorizedNavItems.some(item => item.id === view)
    ? view
    : authorizedNavItems[0]?.id || 'housekeeping';

  const headerTitles = {
    dashboard: ['Resort Overview', 'Real-time property metrics, arrivals, and departures.'],
    rooms: ['Room Status Matrix', 'Visual representation of all rooms and immediate statuses.'],
    bookings: ['Reservations Ledger', 'Book stays, execute check-in/outs, and schedule reservations.'],
    guests: ['Guest Database', 'Guest database indexing detailed contact records and histories.'],
    housekeeping: ['Housekeeping Operations', 'Housekeeper console showing rooms requiring cleaning or repair logs.'],
    billing: ['Point of Sale & Billing', 'Invoice audits, posting additional charges, and checkout settlement.'],
    staff: ['Staff Management', 'Staff accounts, invite code, aur permissions manage karo.'],
  };
  const [headerTitle, headerSubtitle] = headerTitles[activeView] || ['Grand Horizon HMS', ''];

  return (
    <div className="app-container">
      {notification && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          background: notification.type === 'success' ? 'var(--status-available-bg)' : 'var(--status-maintenance-bg)',
          color: notification.type === 'success' ? 'var(--status-available)' : '#ef4444',
          border: `1px solid ${notification.type === 'success' ? 'var(--status-available)' : '#ef4444'}`,
          borderRadius: '8px', padding: '1rem 1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          animation: 'modalSlideUp 0.2s ease-out'
        }}>
          <Bell size={18} />
          <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>{notification.message}</span>
        </div>
      )}

      <aside className="sidebar">
        <div className="logo-container">
          <Hotel className="logo-icon" />
          <span className="logo-text">Grand Horizon</span>
        </div>

        <nav className="sidebar-nav">
          {authorizedNavItems.map(item => {
            const IconComp = item.icon;
            return (
              <div
                key={item.id}
                className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                onClick={() => setView(item.id)}
              >
                <IconComp className="nav-icon" />
                <span>{item.label}</span>
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar">
              {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <span className="user-role">{user.role}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={logout}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="main-header">
          <div className="header-title-container">
            <h1 className="header-title">{headerTitle}</h1>
            <span className="header-subtitle">{headerSubtitle}</span>
          </div>
          <div className="header-actions">
            <span className="system-time">🕒 Live</span>
            <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle Theme">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>

        <div className="content-body">
          {activeView === 'dashboard' && <Dashboard setView={setView} setSelectedBooking={setSelectedBooking} />}
          {activeView === 'rooms' && <RoomsGrid />}
          {activeView === 'bookings' && <Bookings setView={setView} setSelectedBooking={setSelectedBooking} />}
          {activeView === 'guests' && <Guests />}
          {activeView === 'housekeeping' && <Housekeeping />}
          {activeView === 'billing' && <Billing selectedBooking={selectedBooking} setSelectedBooking={setSelectedBooking} />}
          {activeView === 'staff' && <StaffManagement />}
        </div>
      </main>
    </div>
  );
};

// ── Route Guards ─────────────────────────────────────────────────────────────
// Admin route — only admin can access, others redirect to /
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return children; // Show admin login
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return <DashboardShell />;
};

// Staff route — receptionist/housekeeper only, admin → /admin
const StaffRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return children; // Show staff login
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  return <DashboardShell />;
};

// ── Main App ─────────────────────────────────────────────────────────────────
function App() {
  return (
    <Routes>
      {/* Staff portal — receptionist & housekeeper */}
      <Route
        path="/"
        element={
          <StaffRoute>
            <StaffLogin />
          </StaffRoute>
        }
      />

      {/* Admin portal — secret URL */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLogin />
          </AdminRoute>
        }
      />

      {/* Catch-all → staff portal */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;


