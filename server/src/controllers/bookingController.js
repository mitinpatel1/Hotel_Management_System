import Booking from '../models/Booking.js';
import Room from '../models/Room.js';
import Invoice from '../models/Invoice.js';
import HousekeepingLog from '../models/HousekeepingLog.js';

export const getAllBookings = async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status) filter.status = status;

  try {
    const bookings = await Booking.find(filter)
      .populate('guest_id', 'name email phone')
      .populate('room_id', 'room_number type floor')
      .sort({ check_in_date: -1 });

    const formatted = bookings.map(b => ({
      ...b.toObject(),
      guest_name: b.guest_id?.name,
      guest_email: b.guest_id?.email,
      guest_phone: b.guest_id?.phone,
      room_number: b.room_id?.room_number,
      room_type: b.room_id?.type,
      room_floor: b.room_id?.floor,
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving bookings.' });
  }
};

export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('guest_id', 'name email phone')
      .populate('room_id', 'room_number type floor');

    if (!booking) return res.status(404).json({ message: 'Booking not found.' });

    res.json({
      ...booking.toObject(),
      guest_name: booking.guest_id?.name,
      guest_email: booking.guest_id?.email,
      guest_phone: booking.guest_id?.phone,
      room_number: booking.room_id?.room_number,
      room_type: booking.room_id?.type,
      room_floor: booking.room_id?.floor,
    });
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
    const room = await Room.findById(room_id);
    if (!room) return res.status(404).json({ message: 'Room not found.' });

    if (room.status === 'Maintenance') {
      return res.status(400).json({ message: 'Room is currently under maintenance.' });
    }

    // Check date conflicts
    const conflict = await Booking.findOne({
      room_id,
      status: { $nin: ['Cancelled', 'Checked-out'] },
      $or: [
        { check_in_date: { $lte: check_in_date }, check_out_date: { $gt: check_in_date } },
        { check_in_date: { $lt: check_out_date }, check_out_date: { $gte: check_out_date } },
        { check_in_date: { $gte: check_in_date }, check_out_date: { $lte: check_out_date } },
      ]
    });

    if (conflict) {
      return res.status(400).json({ message: 'Room is already booked for the selected dates.' });
    }

    const date1 = new Date(check_in_date);
    const date2 = new Date(check_out_date);
    const totalNights = Math.ceil(Math.abs(date2 - date1) / (1000 * 60 * 60 * 24)) || 1;
    const rate = room.price_per_night;
    const subtotal = rate * totalNights;
    const tax = parseFloat((subtotal * 0.10).toFixed(2));
    const total = subtotal + tax;

    const booking = await Booking.create({
      guest_id, room_id, check_in_date, check_out_date, room_rate: rate, deposit, status: 'Confirmed'
    });

    const invoice = await Invoice.create({
      booking_id: booking._id,
      items: [{ description: `Room Charge (${totalNights} nights)`, quantity: totalNights, unit_price: rate, amount: subtotal }],
      subtotal, tax, total, payment_status: 'Unpaid'
    });

    res.status(201).json({
      message: 'Booking created successfully.',
      bookingId: booking._id,
      total,
      invoiceId: invoice._id
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Error processing booking request.' });
  }
};

export const checkIn = async (req, res) => {
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });

    if (booking.status !== 'Confirmed') {
      return res.status(400).json({ message: `Cannot check-in booking in ${booking.status} status.` });
    }

    await Booking.findByIdAndUpdate(req.params.id, { status: 'Checked-in', actual_check_in: now });
    await Room.findByIdAndUpdate(booking.room_id, { status: 'Occupied' });
    await HousekeepingLog.create({
      room_id: booking.room_id,
      staff_id: req.user.id,
      action: 'Inspect',
      notes: `Guest checked in via booking #${req.params.id}`
    });

    res.json({ message: 'Guest checked in successfully.', check_in_time: now });
  } catch (error) {
    res.status(500).json({ message: 'Error during check-in.' });
  }
};

export const checkOut = async (req, res) => {
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });

    if (booking.status !== 'Checked-in') {
      return res.status(400).json({ message: `Cannot check-out booking in ${booking.status} status.` });
    }

    const invoice = await Invoice.findOne({ booking_id: req.params.id });

    await Booking.findByIdAndUpdate(req.params.id, { status: 'Checked-out', actual_check_out: now });
    await Room.findByIdAndUpdate(booking.room_id, { status: 'Dirty' });
    await HousekeepingLog.create({
      room_id: booking.room_id,
      staff_id: req.user.id,
      action: 'Dirty',
      notes: `Guest checked out from booking #${req.params.id}. Room needs cleaning.`
    });

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
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });

    if (['Checked-out', 'Cancelled'].includes(booking.status)) {
      return res.status(400).json({ message: `Cannot cancel a booking that is ${booking.status}.` });
    }

    await Booking.findByIdAndUpdate(req.params.id, { status: 'Cancelled' });

    if (booking.status === 'Checked-in') {
      await Room.findByIdAndUpdate(booking.room_id, { status: 'Dirty' });
    }

    res.json({ message: 'Booking cancelled successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling booking.' });
  }
};
