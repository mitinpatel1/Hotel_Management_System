import { dbAll, dbGet, dbRun } from '../config/database.js';

export const getAllBookings = async (req, res) => {
  const { status } = req.query;
  let sql = `
    SELECT b.*, g.name as guest_name, g.email as guest_email, g.phone as guest_phone,
           r.room_number, r.type as room_type, r.floor as room_floor
    FROM bookings b
    JOIN guests g ON b.guest_id = g.id
    JOIN rooms r ON b.room_id = r.id
  `;
  const params = [];

  if (status) {
    sql += ' WHERE b.status = ?';
    params.push(status);
  }

  sql += ' ORDER BY b.check_in_date DESC';

  try {
    const bookings = await dbAll(sql, params);
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving bookings.' });
  }
};

export const getBookingById = async (req, res) => {
  const { id } = req.params;
  try {
    const booking = await dbGet(`
      SELECT b.*, g.name as guest_name, g.email as guest_email, g.phone as guest_phone,
             r.room_number, r.type as room_type, r.floor as room_floor
      FROM bookings b
      JOIN guests g ON b.guest_id = g.id
      JOIN rooms r ON b.room_id = r.id
      WHERE b.id = ?
    `, [id]);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving booking details.' });
  }
};

export const createBooking = async (req, res) => {
  const { guest_id, room_id, check_in_date, check_out_date, deposit = 0 } = req.body;

  if (!guest_id || !room_id || !check_in_date || !check_out_date) {
    return res.status(400).json({ message: 'Guest, room, check-in, and check-out dates are required.' });
  }

  try {
    // 1. Verify Room exists and get its rate
    const room = await dbGet('SELECT * FROM rooms WHERE id = ?', [room_id]);
    if (!room) {
      return res.status(404).json({ message: 'Room not found.' });
    }

    if (room.status === 'Maintenance') {
      return res.status(400).json({ message: 'Room is currently under maintenance.' });
    }

    // 2. Check for Date Conflicts
    // Checks if there are any bookings for the same room that overlap with the requested stay
    const conflict = await dbGet(`
      SELECT id FROM bookings 
      WHERE room_id = ? 
        AND status NOT IN ('Cancelled', 'Checked-out')
        AND (
          (check_in_date <= ? AND check_out_date > ?) OR
          (check_in_date < ? AND check_out_date >= ?) OR
          (? <= check_in_date AND ? >= check_out_date)
        )
    `, [room_id, check_in_date, check_in_date, check_out_date, check_out_date, check_in_date, check_out_date]);

    if (conflict) {
      return res.status(400).json({ message: 'Room is already booked for the selected dates.' });
    }

    // 3. Create Booking
    const date1 = new Date(check_in_date);
    const date2 = new Date(check_out_date);
    const diffTime = Math.abs(date2 - date1);
    const totalNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    const rate = room.price_per_night;
    const subtotal = rate * totalNights;
    const tax = parseFloat((subtotal * 0.10).toFixed(2)); // 10% room tax
    const total = subtotal + tax;

    const result = await dbRun(`
      INSERT INTO bookings (guest_id, room_id, check_in_date, check_out_date, room_rate, deposit, status)
      VALUES (?, ?, ?, ?, ?, ?, 'Confirmed')
    `, [guest_id, room_id, check_in_date, check_out_date, rate, deposit]);

    const bookingId = result.id;

    // 4. Automatically create invoice
    const invResult = await dbRun(`
      INSERT INTO invoices (booking_id, subtotal, tax, total, payment_status)
      VALUES (?, ?, ?, ?, 'Unpaid')
    `, [bookingId, subtotal, tax, total]);

    const invoiceId = invResult.id;

    // 5. Add invoice line item for room charges
    await dbRun(`
      INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, amount)
      VALUES (?, ?, ?, ?, ?)
    `, [invoiceId, `Room Charge (${totalNights} nights)`, totalNights, rate, subtotal]);

    res.status(201).json({
      message: 'Booking created successfully.',
      bookingId,
      total,
      invoiceId
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Error processing booking request.' });
  }
};

export const checkIn = async (req, res) => {
  const { id } = req.params;
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  try {
    const booking = await dbGet('SELECT * FROM bookings WHERE id = ?', [id]);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    if (booking.status !== 'Confirmed') {
      return res.status(400).json({ message: `Cannot check-in booking in ${booking.status} status.` });
    }

    // Update booking status
    await dbRun(
      "UPDATE bookings SET status = 'Checked-in', actual_check_in = ? WHERE id = ?",
      [now, id]
    );

    // Update room status
    await dbRun("UPDATE rooms SET status = 'Occupied' WHERE id = ?", [booking.room_id]);

    // Log housekeeping action
    await dbRun(
      'INSERT INTO housekeeping_logs (room_id, staff_id, action, notes) VALUES (?, ?, ?, ?)',
      [booking.room_id, req.user.id, 'Inspect', `Guest checked in via booking #${id}`]
    );

    res.json({ message: 'Guest checked in successfully.', check_in_time: now });
  } catch (error) {
    res.status(500).json({ message: 'Error during check-in.' });
  }
};

export const checkOut = async (req, res) => {
  const { id } = req.params;
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  try {
    const booking = await dbGet('SELECT * FROM bookings WHERE id = ?', [id]);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    if (booking.status !== 'Checked-in') {
      return res.status(400).json({ message: `Cannot check-out booking in ${booking.status} status.` });
    }

    // Check payment status of invoice
    const invoice = await dbGet('SELECT * FROM invoices WHERE booking_id = ?', [id]);
    
    // Update booking status
    await dbRun(
      "UPDATE bookings SET status = 'Checked-out', actual_check_out = ? WHERE id = ?",
      [now, id]
    );

    // Set room status to Dirty upon checkout
    await dbRun("UPDATE rooms SET status = 'Dirty' WHERE id = ?", [booking.room_id]);

    // Log housekeeping action
    await dbRun(
      'INSERT INTO housekeeping_logs (room_id, staff_id, action, notes) VALUES (?, ?, ?, ?)',
      [booking.room_id, req.user.id, 'Dirty', `Guest checked out from booking #${id}. Room needs cleaning.`]
    );

    res.json({ 
      message: 'Guest checked out successfully. Room marked as Dirty.', 
      check_out_time: now,
      invoice_paid: invoice ? invoice.payment_status === 'Paid' : false 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error during check-out.' });
  }
};

export const cancelBooking = async (req, res) => {
  const { id } = req.params;

  try {
    const booking = await dbGet('SELECT * FROM bookings WHERE id = ?', [id]);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    if (['Checked-out', 'Cancelled'].includes(booking.status)) {
      return res.status(400).json({ message: `Cannot cancel a booking that is ${booking.status}.` });
    }

    await dbRun("UPDATE bookings SET status = 'Cancelled' WHERE id = ?", [id]);

    // If guest was checked in, make the room available (or dirty)
    if (booking.status === 'Checked-in') {
      await dbRun("UPDATE rooms SET status = 'Dirty' WHERE id = ?", [booking.room_id]);
    }

    res.json({ message: 'Booking cancelled successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling booking.' });
  }
};
