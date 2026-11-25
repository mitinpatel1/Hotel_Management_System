import Guest from '../models/Guest.js';
import Booking from '../models/Booking.js';
import Room from '../models/Room.js';

export const getAllGuests = async (req, res) => {
  const { search } = req.query;
  const filter = {};

  if (search) {
    const regex = new RegExp(search, 'i');
    filter.$or = [{ name: regex }, { email: regex }, { phone: regex }, { id_number: regex }];
  }

  try {
    const guests = await Guest.find(filter).sort({ name: 1 });
    res.json(guests);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving guest records.' });
  }
};

export const getGuestById = async (req, res) => {
  try {
    const guest = await Guest.findById(req.params.id);
    if (!guest) return res.status(404).json({ message: 'Guest profile not found.' });

    const bookings = await Booking.find({ guest_id: req.params.id })
      .populate('room_id', 'room_number type')
      .sort({ check_in_date: -1 });

    const bookingsFormatted = bookings.map(b => ({
      ...b.toObject(),
      room_number: b.room_id?.room_number,
      room_type: b.room_id?.type,
    }));

    res.json({ ...guest.toObject(), bookings: bookingsFormatted });
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
    const guest = await Guest.create({ name, email: email || null, phone, id_type, id_number, notes: notes || null });
    res.status(201).json({ message: 'Guest profile created successfully.', guest });
  } catch (error) {
    res.status(500).json({ message: 'Error creating guest profile.' });
  }
};

export const updateGuest = async (req, res) => {
  const { name, email, phone, id_type, id_number, notes } = req.body;

  if (!name || !phone || !id_type || !id_number) {
    return res.status(400).json({ message: 'Required fields are missing.' });
  }

  try {
    const guest = await Guest.findByIdAndUpdate(
      req.params.id,
      { name, email: email || null, phone, id_type, id_number, notes: notes || null },
      { new: true }
    );
    if (!guest) return res.status(404).json({ message: 'Guest profile not found.' });
    res.json({ message: 'Guest profile updated successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating guest profile.' });
  }
};

export const deleteGuest = async (req, res) => {
  try {
    const activeBooking = await Booking.findOne({
      guest_id: req.params.id,
      status: { $in: ['Pending', 'Confirmed', 'Checked-in'] }
    });

    if (activeBooking) {
      return res.status(400).json({ message: 'Cannot delete guest with active or future reservations.' });
    }

    const result = await Guest.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: 'Guest profile not found.' });

    res.json({ message: 'Guest profile deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting guest profile.' });
  }
};
