import { dbAll, dbGet, dbRun } from '../config/database.js';

export const getAllGuests = async (req, res) => {
  const { search } = req.query;
  let sql = 'SELECT * FROM guests';
  const params = [];

  if (search) {
    sql += ' WHERE name LIKE ? OR email LIKE ? OR phone LIKE ? OR id_number LIKE ?';
    const wildcard = `%${search}%`;
    params.push(wildcard, wildcard, wildcard, wildcard);
  }

  sql += ' ORDER BY name ASC';

  try {
    const guests = await dbAll(sql, params);
    res.json(guests);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving guest records.' });
  }
};

export const getGuestById = async (req, res) => {
  const { id } = req.params;

  try {
    const guest = await dbGet('SELECT * FROM guests WHERE id = ?', [id]);
    if (!guest) {
      return res.status(404).json({ message: 'Guest profile not found.' });
    }

    // Include booking history for this guest
    const bookings = await dbAll(`
      SELECT b.*, r.room_number, r.type as room_type 
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      WHERE b.guest_id = ?
      ORDER BY b.check_in_date DESC
    `, [id]);

    res.json({ ...guest, bookings });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving guest profile.' });
  }
};

export const createGuest = async (req, res) => {
  const { name, email, phone, id_type, id_number, notes } = req.body;

  if (!name || !phone || !id_type || !id_number) {
    return res.status(400).json({ message: 'Name, phone, ID type, and ID number are required.' });
  }

  try {
    const result = await dbRun(
      'INSERT INTO guests (name, email, phone, id_type, id_number, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email || null, phone, id_type, id_number, notes || null]
    );

    res.status(201).json({
      message: 'Guest profile created successfully.',
      guest: { id: result.id, name, email, phone, id_type, id_number, notes }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating guest profile.' });
  }
};

export const updateGuest = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, id_type, id_number, notes } = req.body;

  if (!name || !phone || !id_type || !id_number) {
    return res.status(400).json({ message: 'Required fields are missing.' });
  }

  try {
    const guest = await dbGet('SELECT id FROM guests WHERE id = ?', [id]);
    if (!guest) {
      return res.status(404).json({ message: 'Guest profile not found.' });
    }

    await dbRun(
      'UPDATE guests SET name = ?, email = ?, phone = ?, id_type = ?, id_number = ?, notes = ? WHERE id = ?',
      [name, email || null, phone, id_type, id_number, notes || null, id]
    );

    res.json({ message: 'Guest profile updated successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating guest profile.' });
  }
};

export const deleteGuest = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if guest has active bookings
    const activeBooking = await dbGet(
      "SELECT id FROM bookings WHERE guest_id = ? AND status IN ('Pending', 'Confirmed', 'Checked-in')",
      [id]
    );

    if (activeBooking) {
      return res.status(400).json({ message: 'Cannot delete guest with active or future reservations.' });
    }

    const result = await dbRun('DELETE FROM guests WHERE id = ?', [id]);
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Guest profile not found.' });
    }

    res.json({ message: 'Guest profile deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting guest profile.' });
  }
};
