import React, { useState } from 'react';
import { useAuth } from './contexts/AuthContext.jsx';
import { useApp } from './contexts/AppContext.jsx';

// Component imports
import Login from './components/Login.jsx';
import Dashboard from './components/Dashboard.jsx';
import RoomsGrid from './components/RoomsGrid.jsx';
import Bookings from './components/Bookings.jsx';
import Guests from './components/Guests.jsx';
import Housekeeping from './components/Housekeeping.jsx';
import Billing from './components/Billing.jsx';

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
  Bell 
} from 'lucide-react';

function App() {
  const { user, loading, logout } = useAuth();
  const { theme, toggleTheme, notification } = useApp();
  
  // Single-page application routing state
  const [view, setView] = useState('dashboard');
  const [selectedBooking, setSelectedBooking] = useState(null);

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#0a0f1d',
        color: '#f3f4f6',
        fontFamily: 'sans-serif'
      }}>
        <div style={{ marginBottom: '1rem', fontSize: '1.2rem', fontWeight: 'bold' }}>Loading Grand Horizon Portal...</div>
        <div style={{ color: 'var(--text-muted)' }}>Checking session token security...</div>
      </div>
    );
  }

  // If not logged in, render the login card
  if (!user) {
    return <Login />;
  }

  // Define sidebar navigation items based on role authorization
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'receptionist'] },
    { id: 'rooms', label: 'Rooms Matrix', icon: Bed, roles: ['admin', 'receptionist'] },
    { id: 'bookings', label: 'Bookings Planner', icon: CalendarCheck, roles: ['admin', 'receptionist'] },
    { id: 'guests', label: 'Guest Directory', icon: Users2, roles: ['admin', 'receptionist'] },
    { id: 'housekeeping', label: 'Housekeeping', icon: Sparkles, roles: ['admin', 'receptionist', 'housekeeper'] },
    { id: 'billing', label: 'Billing & POS', icon: ReceiptText, roles: ['admin', 'receptionist'] }
  ];

  // Filter items matching user's permissions
  const authorizedNavItems = navItems.filter(item => item.roles.includes(user.role));

  // Determine active view fallback if unauthorized role lands on restricted tabs
  const activeView = authorizedNavItems.some(item => item.id === view) 
    ? view 
    : authorizedNavItems[0]?.id || 'housekeeping';

  const getHeaderTitle = () => {
    switch (activeView) {
      case 'dashboard': return 'Resort Overview';
      case 'rooms': return 'Room Status Matrix';
      case 'bookings': return 'Reservations Ledger';
      case 'guests': return 'Guest Database';
      case 'housekeeping': return 'Housekeeping Operations';
      case 'billing': return 'Point of Sale & Billing';
      default: return 'Grand Horizon HMS';
    }
  };

  const getHeaderSubtitle = () => {
    switch (activeView) {
      case 'dashboard': return 'Real-time property metrics, arrivals, and departures.';
      case 'rooms': return 'Visual representation of all rooms and immediate statuses.';
      case 'bookings': return 'Book stays, execute check-in/outs, and schedule reservations.';
      case 'guests': return 'Guest database indexing detailed contact records and histories.';
      case 'housekeeping': return 'Housekeeper console showing rooms requiring cleaning or repair logs.';
      case 'billing': return 'Invoice audits, posting additional charges, and checkout settlement.';
      default: return 'Secure Hotel Operations Management';
    }
  };

  return (
    <div className="app-container">
      {/* Toast Notification Banner */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          background: notification.type === 'success' ? 'var(--status-available-bg)' : 'var(--status-maintenance-bg)',
          color: notification.type === 'success' ? 'var(--status-available)' : '#ef4444',
          border: `1px solid ${notification.type === 'success' ? 'var(--status-available)' : '#ef4444'}`,
          borderRadius: '8px',
          padding: '1rem 1.5rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          animation: 'modalSlideUp 0.2s ease-out'
        }}>
          <Bell size={18} />
          <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>{notification.message}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
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

      {/* Main Workspace Frame */}
      <main className="main-content">
        <header className="main-header">
          <div className="header-title-container">
            <h1 className="header-title">{getHeaderTitle()}</h1>
            <span className="header-subtitle">{getHeaderSubtitle()}</span>
          </div>

          <div className="header-actions">
            <span className="system-time">
              🕒 Staging Mode
            </span>
            <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle Theme">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>

        {/* View Switcher */}
        <div className="content-body">
          {activeView === 'dashboard' && (
            <Dashboard 
              setView={setView} 
              setSelectedBooking={setSelectedBooking} 
            />
          )}
          {activeView === 'rooms' && <RoomsGrid />}
          {activeView === 'bookings' && (
            <Bookings 
              setView={setView} 
              setSelectedBooking={setSelectedBooking} 
            />
          )}
          {activeView === 'guests' && <Guests />}
          {activeView === 'housekeeping' && <Housekeeping />}
          {activeView === 'billing' && (
            <Billing 
              selectedBooking={selectedBooking} 
              setSelectedBooking={setSelectedBooking} 
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
