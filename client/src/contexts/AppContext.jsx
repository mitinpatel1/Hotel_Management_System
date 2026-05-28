import React, { createContext, useState, useEffect, useContext } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('hms_theme') || 'dark';
  });
  
  const [notification, setNotification] = useState(null);
  
  // Incremented counters to trigger useEffect triggers in sub-components
  const [refreshRooms, setRefreshRooms] = useState(0);
  const [refreshBookings, setRefreshBookings] = useState(0);
  const [refreshGuests, setRefreshGuests] = useState(0);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('hms_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const triggerRefreshRooms = () => setRefreshRooms(c => c + 1);
  const triggerRefreshBookings = () => setRefreshBookings(c => c + 1);
  const triggerRefreshGuests = () => setRefreshGuests(c => c + 1);

  const value = {
    theme,
    toggleTheme,
    notification,
    showNotification,
    refreshRooms,
    triggerRefreshRooms,
    refreshBookings,
    triggerRefreshBookings,
    refreshGuests,
    triggerRefreshGuests
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => useContext(AppContext);
