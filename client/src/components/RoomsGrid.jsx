import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';
import { useApp } from '../contexts/AppContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Plus, Edit2, Trash, Settings, ShieldCheck, CheckCircle } from 'lucide-react';

const RoomsGrid = () => {
  const { refreshRooms, triggerRefreshRooms, showNotification } = useApp();
  const { user, isAdmin } = useAuth();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [floorFilter, setFloorFilter] = useState('');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [selectedRoom, setSelectedRoom] = useState(null);

  // Form states
  const [roomNumber, setRoomNumber] = useState('');
  const [roomType, setRoomType] = useState('Single');
  const [floor, setFloor] = useState('1');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState('Available');
  const [amenities, setAmenities] = useState('');

  useEffect(() => {
    fetchRooms();
  }, [refreshRooms, statusFilter, typeFilter, floorFilter]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      let query = [];
      if (statusFilter) query.push(`status=${statusFilter}`);
      if (typeFilter) query.push(`type=${typeFilter}`);
      if (floorFilter) query.push(`floor=${floorFilter}`);
      
      const queryString = query.length > 0 ? `?${query.join('&')}` : '';
      const data = await api(`/rooms${queryString}`);
      setRooms(data);
    } catch (err) {
      console.error('Error fetching rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedRoom(null);
    setRoomNumber('');
    setRoomType('Single');
    setFloor('1');
    setPrice('');
    setStatus('Available');
    setAmenities('');
    setShowModal(true);
  };

  const handleOpenEdit = (room) => {
    setModalMode('edit');
    setSelectedRoom(room);
    setRoomNumber(room.room_number);
    setRoomType(room.type);
    setFloor(room.floor.toString());
    setPrice(room.price_per_night.toString());
    setStatus(room.status);
    setAmenities(room.amenities || '');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!roomNumber || !price || !floor) return;

    try {
      if (modalMode === 'create') {
        await api('/rooms', {
          method: 'POST',
          body: JSON.stringify({
            room_number: roomNumber,
            type: roomType,
            floor: parseInt(floor),
            price_per_night: parseFloat(price),
            status,
            amenities
          })
        });
        showNotification(`Room ${roomNumber} created successfully.`);
      } else {
        await api(`/rooms/${selectedRoom.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            room_number: roomNumber,
            type: roomType,
            floor: parseInt(floor),
            price_per_night: parseFloat(price),
            status,
            amenities
          })
        });
        showNotification(`Room ${roomNumber} updated successfully.`);
      }
      setShowModal(false);
      triggerRefreshRooms();
    } catch (err) {
      showNotification(err.message || 'Error saving room details.', 'error');
    }
  };

  const handleDelete = async (room) => {
    if (!window.confirm(`Are you sure you want to delete Room ${room.room_number}?`)) return;

    try {
      await api(`/rooms/${room.id}`, { method: 'DELETE' });
      showNotification(`Room ${room.room_number} deleted successfully.`);
      triggerRefreshRooms();
    } catch (err) {
      showNotification(err.message || 'Failed to delete room.', 'error');
    }
  };

  const handleQuickStatusChange = async (room, nextStatus) => {
    try {
      await api(`/rooms/${room.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus })
      });
      showNotification(`Room ${room.room_number} marked as ${nextStatus}.`);
      triggerRefreshRooms();
    } catch (err) {
      showNotification(err.message || 'Failed to change status.', 'error');
    }
  };

  return (
    <div>
      {/* Title & Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div className="filter-bar">
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Occupied">Occupied</option>
            <option value="Dirty">Dirty</option>
            <option value="Maintenance">Maintenance</option>
          </select>

          <select
            className="filter-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="Single">Single</option>
            <option value="Double">Double</option>
            <option value="Deluxe">Deluxe</option>
            <option value="Suite">Suite</option>
            <option value="Penthouse">Penthouse</option>
          </select>

          <select
            className="filter-select"
            value={floorFilter}
            onChange={(e) => setFloorFilter(e.target.value)}
          >
            <option value="">All Floors</option>
            <option value="1">1st Floor</option>
            <option value="2">2nd Floor</option>
            <option value="3">3rd Floor</option>
            <option value="4">4th Floor</option>
          </select>
        </div>

        {isAdmin && (
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} /> Add Room
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Loading rooms...</div>
      ) : rooms.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          No rooms found matching the selected filters.
        </div>
      ) : (
        <div className="rooms-matrix">
          {rooms.map(room => (
            <div key={room.id} className={`room-card status-${room.status}`}>
              <div className="room-header">
                <span className="room-number-display">{room.room_number}</span>
                <span className={`room-badge ${room.status}`}>{room.status}</span>
              </div>
              <div className="room-type">{room.type} &mdash; Floor {room.floor}</div>
              <div className="room-price">${room.price_per_night} / night</div>
              <div className="room-amenities">
                {room.amenities?.split(',').map((am, i) => (
                  <span key={i} className="amenity-tag">{am.trim()}</span>
                ))}
              </div>

              {/* Status Update Options (available to all staff) */}
              <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  {room.status === 'Dirty' && (
                    <button
                      className="action-btn primary"
                      style={{ background: 'var(--status-available)', color: 'white' }}
                      onClick={() => handleQuickStatusChange(room, 'Available')}
                    >
                      <CheckCircle size={12} /> Clean & Ready
                    </button>
                  )}
                  {room.status === 'Available' && (
                    <button
                      className="action-btn secondary"
                      onClick={() => handleQuickStatusChange(room, 'Dirty')}
                    >
                      Mark Dirty
                    </button>
                  )}
                  {room.status !== 'Maintenance' && room.status !== 'Occupied' && (
                    <button
                      className="action-btn secondary"
                      onClick={() => handleQuickStatusChange(room, 'Maintenance')}
                    >
                      Maintenance
                    </button>
                  )}
                  {room.status === 'Maintenance' && (
                    <button
                      className="action-btn primary"
                      onClick={() => handleQuickStatusChange(room, 'Available')}
                    >
                      Fix & Release
                    </button>
                  )}
                </div>

                {/* Admin specific commands */}
                {isAdmin && (
                  <div style={{ display: 'flex', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', gap: '0.25rem' }}>
                    <button className="action-btn secondary" style={{ flex: 1 }} onClick={() => handleOpenEdit(room)}>
                      <Edit2 size={12} /> Edit
                    </button>
                    <button className="action-btn secondary" style={{ flex: 0.3, color: '#ef4444' }} onClick={() => handleDelete(room)}>
                      <Trash size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Dialog */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-container">
            <div className="modal-header">
              <h3 className="modal-title">{modalMode === 'create' ? 'Add New Room' : `Edit Room ${roomNumber}`}</h3>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Room Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Floor</label>
                    <input
                      type="number"
                      className="form-control"
                      value={floor}
                      onChange={(e) => setFloor(e.target.value)}
                      min="1"
                      max="10"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Room Type</label>
                    <select
                      className="form-control"
                      value={roomType}
                      onChange={(e) => setRoomType(e.target.value)}
                    >
                      <option value="Single">Single</option>
                      <option value="Double">Double</option>
                      <option value="Deluxe">Deluxe</option>
                      <option value="Suite">Suite</option>
                      <option value="Penthouse">Penthouse</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Price Per Night ($)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    className="form-control"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="Available">Available</option>
                    <option value="Occupied">Occupied</option>
                    <option value="Dirty">Dirty</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Amenities (comma separated)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. WiFi, TV, AC, Jacuzzi, Ocean View"
                    value={amenities}
                    onChange={(e) => setAmenities(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Room</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomsGrid;
