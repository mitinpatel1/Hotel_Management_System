import { dbAll, dbGet, dbRun } from '../config/database.js';

export const getAllRooms = async (req, res) => {
  const { status, type, floor } = req.query;
  let sql = 'SELECT * FROM rooms WHERE 1=1';
  const params = [];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }
  if (floor) {
    sql += ' AND floor = ?';
    params.push(parseInt(floor));
  }

  sql += ' ORDER BY CAST(room_number AS INTEGER)';

  try {
    const rooms = await dbAll(sql, params);
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving rooms data.' });
  }
};

export const getRoomById = async (req, res) => {
  const { id } = req.params;
  try {
    const room = await dbGet('SELECT * FROM rooms WHERE id = ?', [id]);
    if (!room) {
      return res.status(404).json({ message: 'Room not found.' });
    }
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving room details.' });
  }
};

export const createRoom = async (req, res) => {
  const { room_number, type, floor, price_per_night, status = 'Available', amenities } = req.body;

  if (!room_number || !type || !floor || !price_per_night) {
    return res.status(400).json({ message: 'Room number, type, floor, and price per night are required.' });
  }

  try {
    const existing = await dbGet('SELECT id FROM rooms WHERE room_number = ?', [room_number]);
    if (existing) {
      return res.status(400).json({ message: 'Room number already exists.' });
    }

    const result = await dbRun(
      'INSERT INTO rooms (room_number, type, floor, price_per_night, status, amenities) VALUES (?, ?, ?, ?, ?, ?)',
      [room_number, type, parseInt(floor), parseFloat(price_per_night), status, amenities]
    );

    res.status(201).json({
      message: 'Room created successfully.',
      room: { id: result.id, room_number, type, floor, price_per_night, status, amenities }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating room.' });
  }
};

export const updateRoom = async (req, res) => {
  const { id } = req.params;
  const { room_number, type, floor, price_per_night, status, amenities } = req.body;

  if (!room_number || !type || !floor || !price_per_night || !status) {
    return res.status(400).json({ message: 'Required fields missing.' });
  }

  try {
    const room = await dbGet('SELECT id FROM rooms WHERE id = ?', [id]);
    if (!room) {
      return res.status(404).json({ message: 'Room not found.' });
    }

    // Check duplicate room number
    const duplicate = await dbGet('SELECT id FROM rooms WHERE room_number = ? AND id != ?', [room_number, id]);
    if (duplicate) {
      return res.status(400).json({ message: 'Another room already uses this room number.' });
    }

    await dbRun(
      'UPDATE rooms SET room_number = ?, type = ?, floor = ?, price_per_night = ?, status = ?, amenities = ? WHERE id = ?',
      [room_number, type, parseInt(floor), parseFloat(price_per_night), status, amenities, id]
    );

    res.json({ message: 'Room updated successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating room.' });
  }
};

export const updateRoomStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['Available', 'Occupied', 'Dirty', 'Maintenance'].includes(status)) {
    return res.status(400).json({ message: 'Valid status is required.' });
  }

  try {
    const room = await dbGet('SELECT id FROM rooms WHERE id = ?', [id]);
    if (!room) {
      return res.status(404).json({ message: 'Room not found.' });
    }

    await dbRun('UPDATE rooms SET status = ? WHERE id = ?', [status, id]);
    
    // Log housekeeping action
    const staffId = req.user.id;
    let action = 'Clean';
    if (status === 'Dirty') action = 'Dirty';
    else if (status === 'Maintenance') action = 'Maintenance';
    else if (status === 'Occupied') action = 'Inspect'; // Log check in visual

    await dbRun(
      'INSERT INTO housekeeping_logs (room_id, staff_id, action, notes) VALUES (?, ?, ?, ?)',
      [id, staffId, action, `Status set to ${status} by user ${req.user.username}`]
    );

    res.json({ message: 'Room status updated successfully.', status });
  } catch (error) {
    res.status(500).json({ message: 'Error updating room status.' });
  }
};

export const deleteRoom = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if room is linked to non-cancelled bookings
    const activeBooking = await dbGet(
      "SELECT id FROM bookings WHERE room_id = ? AND status IN ('Pending', 'Confirmed', 'Checked-in')", 
      [id]
    );
    
    if (activeBooking) {
      return res.status(400).json({ message: 'Cannot delete room with active or future reservations.' });
    }

    const result = await dbRun('DELETE FROM rooms WHERE id = ?', [id]);
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Room not found.' });
    }

    res.json({ message: 'Room deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting room. It might be referenced by past booking histories.' });
  }
};

export const getHousekeepingLogs = async (req, res) => {
  try {
    const logs = await dbAll(`
      SELECT l.*, r.room_number, u.name as staff_name 
      FROM housekeeping_logs l
      JOIN rooms r ON l.room_id = r.id
      LEFT JOIN users u ON l.staff_id = u.id
      ORDER BY l.timestamp DESC LIMIT 50
    `);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving housekeeping logs.' });
  }
};
