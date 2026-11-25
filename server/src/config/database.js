import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Room from '../models/Room.js';
import Guest from '../models/Guest.js';
import Booking from '../models/Booking.js';
import Invoice from '../models/Invoice.js';

// Ensure .env is loaded (handles ES Module hoisting issue)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

export const connectDatabase = async () => {
  console.log('Connecting to MongoDB Atlas...');
  
  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  });

  console.log('✅ MongoDB Atlas connected successfully!');
  
  // No auto-seed — admin creates their own account via /register
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    console.log('⚠️  No users found. Please open the app and create your Admin account first.');
  } else {
    console.log(`✅ Database ready. ${userCount} user(s) found.`);
  }
};

// Helper to get a date string relative to today
const formatDate = (daysFromNow) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
};

const seedDatabase = async () => {
  // --- Users ---
  const adminHash = await bcrypt.hash('admin123', 10);
  const recepHash = await bcrypt.hash('recep123', 10);
  const houseHash = await bcrypt.hash('house123', 10);

  const [admin, receptionist, housekeeper] = await User.insertMany([
    { username: 'admin', password_hash: adminHash, email: 'admin@grandhorizon.com', name: 'Admin User', role: 'admin' },
    { username: 'john_r', password_hash: recepHash, email: 'john@grandhorizon.com', name: 'John Smith', role: 'receptionist' },
    { username: 'mary_h', password_hash: houseHash, email: 'mary@grandhorizon.com', name: 'Mary Johnson', role: 'housekeeper' },
  ]);

  // --- Rooms ---
  const roomsData = [
    // Floor 1 - Single Rooms
    { room_number: '101', type: 'Single', floor: 1, price_per_night: 99, status: 'Available', amenities: 'WiFi, TV, AC' },
    { room_number: '102', type: 'Single', floor: 1, price_per_night: 99, status: 'Dirty', amenities: 'WiFi, TV, AC' },
    { room_number: '103', type: 'Single', floor: 1, price_per_night: 99, status: 'Available', amenities: 'WiFi, TV, AC' },
    { room_number: '104', type: 'Single', floor: 1, price_per_night: 149, status: 'Available', amenities: 'WiFi, TV, AC, Mini Fridge' },
    // Floor 2 - Double Rooms
    { room_number: '201', type: 'Double', floor: 2, price_per_night: 179, status: 'Available', amenities: 'WiFi, TV, AC, Mini Fridge, Balcony' },
    { room_number: '202', type: 'Double', floor: 2, price_per_night: 159, status: 'Occupied', amenities: 'WiFi, TV, AC, Mini Fridge' },
    { room_number: '203', type: 'Double', floor: 2, price_per_night: 179, status: 'Available', amenities: 'WiFi, TV, AC, Mini Fridge, Balcony' },
    // Floor 3 - Suites
    { room_number: '301', type: 'Suite', floor: 3, price_per_night: 349, status: 'Occupied', amenities: 'WiFi, Smart TV, AC, Minibar, Jacuzzi, Balcony' },
    { room_number: '302', type: 'Suite', floor: 3, price_per_night: 349, status: 'Available', amenities: 'WiFi, Smart TV, AC, Minibar, Jacuzzi, Balcony' },
    // Floor 4 - Deluxe Rooms
    { room_number: '401', type: 'Deluxe', floor: 4, price_per_night: 249, status: 'Available', amenities: 'WiFi, Smart TV, AC, Minibar, Sea View' },
    { room_number: '402', type: 'Deluxe', floor: 4, price_per_night: 249, status: 'Maintenance', amenities: 'WiFi, Smart TV, AC, Minibar, Sea View' },
    // Floor 5 - Penthouse
    { room_number: '501', type: 'Penthouse', floor: 5, price_per_night: 599, status: 'Available', amenities: 'WiFi, Smart TV, AC, Minibar, Private Pool, Panoramic View, Butler Service' },
  ];
  const rooms = await Room.insertMany(roomsData);
  const roomMap = {};
  rooms.forEach(r => { roomMap[r.room_number] = r; });

  // --- Guests ---
  const [guest1, guest2, guest3] = await Guest.insertMany([
    { name: 'John Doe', email: 'john.doe@email.com', phone: '+1-555-0101', id_type: 'Passport', id_number: 'P123456789', notes: 'VIP guest, prefers high floor' },
    { name: 'Jane Smith', email: 'jane.smith@email.com', phone: '+1-555-0202', id_type: 'Drivers License', id_number: 'DL987654', notes: 'Allergic to feather pillows' },
    { name: 'David Miller', email: 'david.m@email.com', phone: '+1-555-0303', id_type: 'National ID', id_number: 'NID112233', notes: '' },
  ]);

  // --- Bookings + Invoices ---

  // Booking 1: Jane Smith - Room 202 - Checked-in
  const booking1 = await Booking.create({
    guest_id: guest2._id,
    room_id: roomMap['202']._id,
    check_in_date: formatDate(-2),
    check_out_date: formatDate(3),
    actual_check_in: formatDate(-2) + ' 14:15:00',
    room_rate: 159,
    deposit: 100,
    status: 'Checked-in'
  });
  await Invoice.create({
    booking_id: booking1._id,
    items: [
      { description: 'Room Charge (5 nights)', quantity: 5, unit_price: 159, amount: 795 },
      { description: 'Mini bar item - Wine', quantity: 1, unit_price: 25, amount: 25 },
      { description: 'Spa Massage', quantity: 1, unit_price: 120, amount: 120 },
    ],
    subtotal: 940, discount: 50, tax: 94.0, total: 984.0, payment_status: 'Partially_Paid'
  });

  // Booking 2: David Miller - Room 301 - Checked-in
  const booking2 = await Booking.create({
    guest_id: guest3._id,
    room_id: roomMap['301']._id,
    check_in_date: formatDate(-1),
    check_out_date: formatDate(2),
    actual_check_in: formatDate(-1) + ' 15:30:22',
    room_rate: 349,
    deposit: 200,
    status: 'Checked-in'
  });
  await Invoice.create({
    booking_id: booking2._id,
    items: [
      { description: 'Room Charge (3 nights)', quantity: 3, unit_price: 349, amount: 1047 },
      { description: 'Room Service Breakfast', quantity: 2, unit_price: 20, amount: 40 },
    ],
    subtotal: 1087, tax: 108.7, total: 1195.7, payment_status: 'Unpaid'
  });

  // Booking 3: John Doe - Room 104 - Confirmed
  const booking3 = await Booking.create({
    guest_id: guest1._id,
    room_id: roomMap['104']._id,
    check_in_date: formatDate(0),
    check_out_date: formatDate(4),
    room_rate: 149,
    deposit: 0,
    status: 'Confirmed'
  });
  await Invoice.create({
    booking_id: booking3._id,
    items: [
      { description: 'Room Charge (4 nights)', quantity: 4, unit_price: 149, amount: 596 },
    ],
    subtotal: 596, tax: 59.6, total: 655.6, payment_status: 'Unpaid'
  });

  console.log('✅ Database seeded successfully!');
};

export default connectDatabase;
