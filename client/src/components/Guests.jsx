import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';
import { useApp } from '../contexts/AppContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { UserPlus, Edit, Trash, Search, Mail, Phone, FileText } from 'lucide-react';

const Guests = () => {
  const { refreshGuests, triggerRefreshGuests, showNotification } = useApp();
  const { isAdmin } = useAuth();

  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedGuest, setSelectedGuest] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [idType, setIdType] = useState('Passport');
  const [idNumber, setIdNumber] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchGuests();
  }, [refreshGuests, searchTerm]);

  const fetchGuests = async () => {
    try {
      setLoading(true);
      const url = searchTerm ? `/guests?search=${encodeURIComponent(searchTerm)}` : '/guests';
      const data = await api(url);
      setGuests(data);
    } catch (err) {
      console.error('Error fetching guests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedGuest(null);
    setName('');
    setEmail('');
    setPhone('');
    setIdType('Passport');
    setIdNumber('');
    setNotes('');
    setShowModal(true);
  };

  const handleOpenEdit = (guest) => {
    setModalMode('edit');
    setSelectedGuest(guest);
    setName(guest.name);
    setEmail(guest.email || '');
    setPhone(guest.phone);
    setIdType(guest.id_type);
    setIdNumber(guest.id_number);
    setNotes(guest.notes || '');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name || !phone || !idNumber) return;

    try {
      if (modalMode === 'create') {
        await api('/guests', {
          method: 'POST',
          body: JSON.stringify({ name, email, phone, id_type: idType, id_number: idNumber, notes })
        });
        showNotification(`Guest profile for ${name} created successfully.`);
      } else {
        await api(`/guests/${selectedGuest.id}`, {
          method: 'PUT',
          body: JSON.stringify({ name, email, phone, id_type: idType, id_number: idNumber, notes })
        });
        showNotification(`Guest profile for ${name} updated successfully.`);
      }
      setShowModal(false);
      triggerRefreshGuests();
    } catch (err) {
      showNotification(err.message || 'Error saving guest details.', 'error');
    }
  };

  const handleDelete = async (guest) => {
    if (!window.confirm(`Are you sure you want to delete the guest profile for ${guest.name}?`)) return;

    try {
      await api(`/guests/${guest.id}`, { method: 'DELETE' });
      showNotification(`Guest profile for ${guest.name} deleted successfully.`);
      triggerRefreshGuests();
    } catch (err) {
      showNotification(err.message || 'Failed to delete guest profile.', 'error');
    }
  };

  return (
    <div>
      {/* Search & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', width: '100%', maxWidth: '400px', position: 'relative' }}>
          <input
            type="text"
            className="search-input"
            placeholder="Search guests by name, phone, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <UserPlus size={16} /> Add Guest
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Loading guest database...</div>
      ) : guests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          No guest records found.
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="hms-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact Info</th>
                <th>Identity Document</th>
                <th>Special Notes</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {guests.map(guest => (
                <tr key={guest.id}>
                  <td style={{ fontWeight: '600' }}>{guest.name}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                      <Phone size={12} color="var(--text-secondary)" /> {guest.phone}
                    </div>
                    {guest.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        <Mail size={12} color="var(--text-muted)" /> {guest.email}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                      <FileText size={12} color="var(--text-secondary)" /> {guest.id_type}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                      No: {guest.id_number}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {guest.notes || <span style={{ color: 'var(--text-muted)' }}>None</span>}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                      <button className="action-btn secondary" onClick={() => handleOpenEdit(guest)}>
                        <Edit size={12} /> Edit
                      </button>
                      {isAdmin && (
                        <button className="action-btn secondary" style={{ color: '#ef4444' }} onClick={() => handleDelete(guest)}>
                          <Trash size={12} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Guest Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-container">
            <div className="modal-header">
              <h3 className="modal-title">{modalMode === 'create' ? 'Add Guest Profile' : `Edit Guest Profile`}</h3>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Phone Number *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Identity Document Type *</label>
                    <select
                      className="form-control"
                      value={idType}
                      onChange={(e) => setIdType(e.target.value)}
                    >
                      <option value="Passport">Passport</option>
                      <option value="Drivers License">Driver's License</option>
                      <option value="National ID">National ID</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>ID Document Number *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Guest Preferences / Remarks</label>
                  <textarea
                    className="form-control"
                    placeholder="e.g. Feather pillow allergy, prefers higher floor, corporate client info..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows="3"
                    style={{ resize: 'vertical' }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Guests;
