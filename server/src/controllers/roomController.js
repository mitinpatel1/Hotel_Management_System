import Room from '../models/Room.js';
import Booking from '../models/Booking.js';
import HousekeepingLog from '../models/HousekeepingLog.js';

export const getAllRooms = async (req, res) => {
  const { status, type, floor } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (type) filter.type = type;
  if (floor) filter.floor = parseInt(floor);

  try {
    const rooms = await Room.find(filter).sort({ room_number: 1 });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving rooms data.' });
  }
};

export const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found.' });
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
    const existing = await Room.findOne({ room_number });
    if (existing) return res.status(400).json({ message: 'Room number already exists.' });

    const room = await Room.create({ room_number, type, floor: parseInt(floor), price_per_night: parseFloat(price_per_night), status, amenities });
    res.status(201).json({ message: 'Room created successfully.', room });
  } catch (error) {
    res.status(500).json({ message: 'Error creating room.' });
  }
};

export const updateRoom = async (req, res) => {
  const { room_number, type, floor, price_per_night, status, amenities } = req.body;

  if (!room_number || !type || !floor || !price_per_night || !status) {
    return res.status(400).json({ message: 'Required fields missing.' });
  }

  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found.' });

    const duplicate = await Room.findOne({ room_number, _id: { $ne: req.params.id } });
    if (duplicate) return res.status(400).json({ message: 'Another room already uses this room number.' });

    await Room.findByIdAndUpdate(req.params.id, { room_number, type, floor: parseInt(floor), price_per_night: parseFloat(price_per_night), status, amenities });
    res.json({ message: 'Room updated successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating room.' });
  }
};

export const updateRoomStatus = async (req, res) => {
  const { status } = req.body;

  if (!status || !['Available', 'Occupied', 'Dirty', 'Maintenance'].includes(status)) {
    return res.status(400).json({ message: 'Valid status is required.' });
  }

  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found.' });

    await Room.findByIdAndUpdate(req.params.id, { status });

    let action = 'Clean';
    if (status === 'Dirty') action = 'Dirty';
    else if (status === 'Maintenance') action = 'Maintenance';
    else if (status === 'Occupied') action = 'Inspect';

    await HousekeepingLog.create({
      room_id: req.params.id,
      staff_id: req.user.id,
      action,
      notes: `Status set to ${status} by user ${req.user.username}`
    });

    res.json({ message: 'Room status updated successfully.', status });
  } catch (error) {
    res.status(500).json({ message: 'Error updating room status.' });
  }
};

export const deleteRoom = async (req, res) => {
  try {
    const activeBooking = await Booking.findOne({
      room_id: req.params.id,
      status: { $in: ['Pending', 'Confirmed', 'Checked-in'] }
    });

    if (activeBooking) {
      return res.status(400).json({ message: 'Cannot delete room with active or future reservations.' });
    }

    const result = await Room.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: 'Room not found.' });

    res.json({ message: 'Room deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting room. It might be referenced by past booking histories.' });
  }
};

export const getHousekeepingLogs = async (req, res) => {
  try {
    const logs = await HousekeepingLog.find()
      .populate('room_id', 'room_number')
      .populate('staff_id', 'name')
      .sort({ timestamp: -1 })
      .limit(50);

    // Format response to match old API shape
    const formatted = logs.map(l => ({
      _id: l._id,
      room_id: l.room_id?._id,
      room_number: l.room_id?.room_number,
      staff_id: l.staff_id?._id,
      staff_name: l.staff_id?.name,
      action: l.action,
      notes: l.notes,
      timestamp: l.timestamp
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving housekeeping logs.' });
  }
};
