import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';
import { useApp } from '../contexts/AppContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Calendar, UserPlus, BookOpen, Check, LogOut, XCircle, Search, CreditCard } from 'lucide-react';

const Bookings = ({ setView, setSelectedBooking }) => {
  const { refreshBookings, triggerRefreshBookings, triggerRefreshRooms, showNotification } = useApp();
  const { user } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [guests, setGuests] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [quickAddGuest, setQuickAddGuest] = useState(false);

  // Form states (Booking)
  const [selectedGuestId, setSelectedGuestId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [deposit, setDeposit] = useState('0');

  // Form states (Quick Guest Add)
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestIdType, setGuestIdType] = useState('Passport');
  const [guestIdNumber, setGuestIdNumber] = useState('');

  useEffect(() => {
    fetchBookings();
  }, [refreshBookings, statusFilter]);

  useEffect(() => {
    if (showCreateModal) {
      loadFormData();
    }
  }, [showCreateModal]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const url = statusFilter ? `/bookings?status=${statusFilter}` : '/bookings';
      const data = await api(url);
      setBookings(data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadFormData = async () => {
    try {
      const [guestsData, roomsData] = await Promise.all([
        api('/guests'),
        api('/rooms?status=Available')
      ]);
      setGuests(guestsData);
      setAvailableRooms(roomsData);
    } catch (err) {
      console.error('Error loading form options:', err);
    }
  };

  const handleQuickAddGuestSubmit = async (e) => {
    e.preventDefault();
    if (!guestName || !guestPhone || !guestIdNumber) {
      showNotification('Please fill in required guest fields.', 'error');
      return;
    }

    try {
      const result = await api('/guests', {
        method: 'POST',
        body: JSON.stringify({
          name: guestName,
          email: guestEmail,
          phone: guestPhone,
          id_type: guestIdType,
          id_number: guestIdNumber
        })
      });
      showNotification(`Guest profile for ${guestName} created.`);
      
      // Reload guests, select new guest, switch back to booking form
      const updatedGuests = await api('/guests');
      setGuests(updatedGuests);
      setSelectedGuestId(result.guest.id.toString());
      setQuickAddGuest(false);

      // Reset guest form
      setGuestName('');
      setGuestEmail('');
      setGuestPhone('');
      setGuestIdNumber('');
    } catch (err) {
      showNotification(err.message || 'Error creating guest.', 'error');
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGuestId || !selectedRoomId || !checkInDate || !checkOutDate) {
      showNotification('Please fill in all booking fields.', 'error');
      return;
    }

    try {
      await api('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          guest_id: parseInt(selectedGuestId),
          room_id: parseInt(selectedRoomId),
          check_in_date: checkInDate,
          check_out_date: checkOutDate,
          deposit: parseFloat(deposit || 0)
        })
      });

      showNotification('Booking reserved successfully.');
      setShowCreateModal(false);
      triggerRefreshBookings();
      triggerRefreshRooms();
    } catch (err) {
      showNotification(err.message || 'Booking submission failed.', 'error');
    }
  };

  const handleCheckIn = async (bookingId) => {
    if (!window.confirm('Confirm check-in for this guest? Room status will update to Occupied.')) return;
    try {
      await api(`/bookings/${bookingId}/check-in`, { method: 'POST' });
      showNotification('Guest checked in successfully.');
      triggerRefreshBookings();
      triggerRefreshRooms();
    } catch (err) {
      showNotification(err.message || 'Check-in failed.', 'error');
    }
  };

  const handleCheckOut = async (booking) => {
    if (!window.confirm('Check-out guest? Room status will update to Dirty.')) return;
    try {
      const res = await api(`/bookings/${booking.id}/check-out`, { method: 'POST' });
      showNotification('Guest checked out. Room is now Dirty.');
      triggerRefreshBookings();
      triggerRefreshRooms();
      
      // Prompt user to view receipt/bill
      if (window.confirm('Would you like to open the Billing & Invoice page for this booking?')) {
        setSelectedBooking(booking);
        setView('billing');
      }
    } catch (err) {
      showNotification(err.message || 'Check-out failed.', 'error');
    }
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await api(`/bookings/${bookingId}/cancel`, { method: 'POST' });
      showNotification('Booking cancelled.');
      triggerRefreshBookings();
      triggerRefreshRooms();
    } catch (err) {
      showNotification(err.message || 'Cancellation failed.', 'error');
    }
  };

  const handleViewInvoice = (booking) => {
    setSelectedBooking(booking);
    setView('billing');
  };

  return (
    <div>
      {/* Filters & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div className="filter-bar">
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Bookings</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Checked-in">Checked-In</option>
            <option value="Checked-out">Checked-Out</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {user.role !== 'housekeeper' && (
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Calendar size={16} /> New Booking
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Loading bookings...</div>
      ) : bookings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          No reservations found.
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="hms-table">
            <thead>
              <tr>
                <th>Guest Details</th>
                <th>Room</th>
                <th>Stay Period</th>
                <th>Status</th>
                <th>Rate & Deposit</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(booking => (
                <tr key={booking.id}>
                  <td>
                    <div style={{ fontWeight: '600' }}>{booking.guest_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {booking.guest_phone} {booking.guest_email && `| ${booking.guest_email}`}
                    </div>
                  </td>
                  <td>
                    <div>Room {booking.room_number}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{booking.room_type}</div>
                  </td>
                  <td>
                    <div>{booking.check_in_date} to {booking.check_out_date}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {booking.actual_check_in && `In: ${booking.actual_check_in.split(' ')[1] || booking.actual_check_in}`}
                      {booking.actual_check_out && ` / Out: ${booking.actual_check_out.split(' ')[1] || booking.actual_check_out}`}
                    </div>
                  </td>
                  <td>
                    <span className={`pill ${
                      booking.status === 'Confirmed' ? 'success' :
                      booking.status === 'Checked-in' ? 'info' :
                      booking.status === 'Checked-out' ? 'neutral' : 'danger'
                    }`}>
                      {booking.status}
                    </span>
                  </td>
                  <td>
                    <div>${booking.room_rate}/night</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Dep: ${booking.deposit}</div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                      {booking.status === 'Confirmed' && (
                        <button className="action-btn primary" onClick={() => handleCheckIn(booking.id)} title="Check-in">
                          <Check size={12} /> Check-in
                        </button>
                      )}
                      {booking.status === 'Checked-in' && (
                        <button className="action-btn primary" style={{ backgroundColor: 'var(--status-dirty)' }} onClick={() => handleCheckOut(booking)} title="Check-out">
                          <LogOut size={12} /> Check-out
                        </button>
                      )}
                      {['Confirmed', 'Pending'].includes(booking.status) && (
                        <button className="action-btn secondary" onClick={() => handleCancel(booking.id)} style={{ color: '#ef4444' }} title="Cancel Reservation">
                          <XCircle size={12} /> Cancel
                        </button>
                      )}
                      
                      <button className="action-btn secondary" onClick={() => handleViewInvoice(booking)} title="Invoice / Billing">
                        <CreditCard size={12} /> Invoice
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Booking Form Modal */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-container" style={{ maxWidth: quickAddGuest ? '450px' : '550px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{quickAddGuest ? 'Create Guest Profile' : 'Book a Room'}</h3>
              <button className="modal-close-btn" onClick={() => { setShowCreateModal(false); setQuickAddGuest(false); }}>&times;</button>
            </div>

            {quickAddGuest ? (
              // Inner quick add guest form
              <form onSubmit={handleQuickAddGuestSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone Number *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>ID Type *</label>
                      <select
                        className="form-control"
                        value={guestIdType}
                        onChange={(e) => setGuestIdType(e.target.value)}
                      >
                        <option value="Passport">Passport</option>
                        <option value="Drivers License">Driver's License</option>
                        <option value="National ID">National ID</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>ID Card Number *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={guestIdNumber}
                        onChange={(e) => setGuestIdNumber(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setQuickAddGuest(false)}>Back</button>
                  <button type="submit" className="btn btn-primary">Create Profile</button>
                </div>
              </form>
            ) : (
              // Booking form
              <form onSubmit={handleBookingSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Select Guest *</span>
                      <button
                        type="button"
                        onClick={() => setQuickAddGuest(true)}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-gold)', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                      >
                        <UserPlus size={12} /> New Guest?
                      </button>
                    </label>
                    <select
                      className="form-control"
                      value={selectedGuestId}
                      onChange={(e) => setSelectedGuestId(e.target.value)}
                      required
                    >
                      <option value="">-- Choose Guest --</option>
                      {guests.map(g => (
                        <option key={g.id} value={g.id}>{g.name} ({g.phone})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Select Room *</label>
                    <select
                      className="form-control"
                      value={selectedRoomId}
                      onChange={(e) => setSelectedRoomId(e.target.value)}
                      required
                    >
                      <option value="">-- Choose Room --</option>
                      {availableRooms.map(r => (
                        <option key={r.id} value={r.id}>
                          Room {r.room_number} &mdash; {r.type} (${r.price_per_night}/night)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Check-in Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={checkInDate}
                        onChange={(e) => setCheckInDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Check-out Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={checkOutDate}
                        onChange={(e) => setCheckOutDate(e.target.value)}
                        min={checkInDate || new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Deposit Paid ($)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={deposit}
                      onChange={(e) => setDeposit(e.target.value)}
                      min="0"
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Book Stay</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
