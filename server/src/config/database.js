import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store database in the backend directory
const dbPath = path.resolve(__dirname, '../../hms.db');
const db = new sqlite3.Database(dbPath);

// Promisified Database wrappers for clean async/await code
export const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

export const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Initialize schema and seed data
export const initDatabase = async () => {
  console.log('Initializing SQLite database at:', dbPath);
  
  // Enable foreign keys
  await dbRun('PRAGMA foreign_keys = ON');

  // Users Table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'receptionist', 'housekeeper')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Rooms Table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_number TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('Single', 'Double', 'Suite', 'Deluxe', 'Penthouse')),
      floor INTEGER NOT NULL,
      price_per_night REAL NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('Available', 'Occupied', 'Dirty', 'Maintenance')),
      amenities TEXT, -- Comma-separated list or JSON array
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Guests Table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS guests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT NOT NULL,
      id_type TEXT NOT NULL, -- e.g., 'Passport', 'Drivers License', 'National ID'
      id_number TEXT NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Bookings Table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guest_id INTEGER NOT NULL,
      room_id INTEGER NOT NULL,
      check_in_date TEXT NOT NULL, -- YYYY-MM-DD
      check_out_date TEXT NOT NULL, -- YYYY-MM-DD
      actual_check_in TEXT, -- YYYY-MM-DD HH:MM:SS or ISO
      actual_check_out TEXT, -- YYYY-MM-DD HH:MM:SS or ISO
      room_rate REAL NOT NULL,
      deposit REAL DEFAULT 0,
      status TEXT NOT NULL CHECK(status IN ('Pending', 'Confirmed', 'Checked-in', 'Checked-out', 'Cancelled')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE CASCADE,
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE RESTRICT
    )
  `);

  // Invoices Table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL UNIQUE,
      subtotal REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      total REAL DEFAULT 0,
      payment_status TEXT NOT NULL CHECK(payment_status IN ('Unpaid', 'Partially_Paid', 'Paid')),
      payment_method TEXT, -- 'Cash', 'Credit Card', 'Debit Card', 'Bank Transfer'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
    )
  `);

  // Invoice Items Table (for additional charges like room service, mini-bar, etc.)
  await dbRun(`
    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      unit_price REAL NOT NULL,
      amount REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    )
  `);

  // Housekeeping & Maintenance Logs
  await dbRun(`
    CREATE TABLE IF NOT EXISTS housekeeping_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      staff_id INTEGER,
      action TEXT NOT NULL CHECK(action IN ('Clean', 'Inspect', 'Dirty', 'Maintenance')),
      notes TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
      FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Seed default data if users table is empty
  const userCount = await dbGet('SELECT COUNT(*) as count FROM users');
  if (userCount.count === 0) {
    console.log('Seeding default users and rooms...');
    
    // Hash default passwords
    const adminPassHash = await bcrypt.hash('admin123', 10);
    const staffPassHash = await bcrypt.hash('staff123', 10);
    const maidPassHash = await bcrypt.hash('maid123', 10);

    // Insert Default Staff
    await dbRun(`
      INSERT INTO users (username, password_hash, email, name, role) VALUES 
      ('admin', ?, 'admin@grandhorizon.com', 'Grand Horizon Admin', 'admin'),
      ('receptionist', ?, 'frontdesk@grandhorizon.com', 'Sarah Jenkins', 'receptionist'),
      ('housekeeper', ?, 'cleaning@grandhorizon.com', 'Maria Gomez', 'housekeeper')
    `, [adminPassHash, staffPassHash, maidPassHash]);

    // Insert Rooms (15 elegant hotel rooms)
    const initialRooms = [
      // Floor 1 (Standard & Doubles)
      { num: '101', type: 'Single', floor: 1, price: 99, status: 'Available', amenities: 'WiFi, TV, AC, Minibar' },
      { num: '102', type: 'Single', floor: 1, price: 99, status: 'Available', amenities: 'WiFi, TV, AC' },
      { num: '103', type: 'Double', floor: 1, price: 149, status: 'Dirty', amenities: 'WiFi, TV, AC, Balcony' },
      { num: '104', type: 'Double', floor: 1, price: 149, status: 'Available', amenities: 'WiFi, TV, AC, Balcony, Minibar' },
      { num: '105', type: 'Double', floor: 1, price: 149, status: 'Available', amenities: 'WiFi, TV, AC' },
      
      // Floor 2 (Deluxe & Double)
      { num: '201', type: 'Double', floor: 2, price: 159, status: 'Occupied', amenities: 'WiFi, TV, AC, Balcony' },
      { num: '202', type: 'Deluxe', floor: 2, price: 219, status: 'Available', amenities: 'WiFi, TV, Smart TV, AC, Safe, Coffee Maker' },
      { num: '203', type: 'Deluxe', floor: 2, price: 219, status: 'Available', amenities: 'WiFi, TV, Smart TV, AC, Safe, Coffee Maker, Balcony' },
      { num: '204', type: 'Deluxe', floor: 2, price: 219, status: 'Maintenance', amenities: 'WiFi, TV, AC, Safe' },
      { num: '205', type: 'Deluxe', floor: 2, price: 219, status: 'Available', amenities: 'WiFi, TV, AC, Safe, City View' },

      // Floor 3 & 4 (Suites & Penthouse)
      { num: '301', type: 'Suite', floor: 3, price: 349, status: 'Occupied', amenities: 'WiFi, Smart TV, AC, Kitchenette, Jacuzzi, Balcony' },
      { num: '302', type: 'Suite', floor: 3, price: 349, status: 'Available', amenities: 'WiFi, Smart TV, AC, Kitchenette, Balcony' },
      { num: '303', type: 'Suite', floor: 3, price: 349, status: 'Available', amenities: 'WiFi, Smart TV, AC, Jacuzzi, Ocean View' },
      { num: '401', type: 'Penthouse', floor: 4, price: 699, status: 'Available', amenities: 'WiFi, Smart TV, AC, Master Bedroom, Private Pool, Skyline View, Butler Service' },
      { num: '402', type: 'Penthouse', floor: 4, price: 699, status: 'Available', amenities: 'WiFi, Smart TV, AC, Private Terrace, Jacuzzi, Bar Area' }
    ];

    for (const r of initialRooms) {
      await dbRun(
        'INSERT INTO rooms (room_number, type, floor, price_per_night, status, amenities) VALUES (?, ?, ?, ?, ?, ?)',
        [r.num, r.type, r.floor, r.price, r.status, r.amenities]
      );
    }

    // Insert Sample Guests
    const guests = [
      { name: 'John Doe', email: 'john.doe@gmail.com', phone: '+1-555-0199', id_type: 'Passport', id_number: 'US1234567', notes: 'Prefers high floor' },
      { name: 'Alice Smith', email: 'alice.smith@yahoo.com', phone: '+1-555-0145', id_type: 'Drivers License', id_number: 'DL887654', notes: 'Allergic to feathers' },
      { name: 'David Miller', email: 'david.miller@outlook.com', phone: '+44-7700-900077', id_type: 'National ID', id_number: 'NID09811', notes: 'Corporate guest' }
    ];

    for (const g of guests) {
      await dbRun(
        'INSERT INTO guests (name, email, phone, id_type, id_number, notes) VALUES (?, ?, ?, ?, ?, ?)',
        [g.name, g.email, g.phone, g.id_type, g.id_number, g.notes]
      );
    }

    // Insert Sample Active Bookings & Invoices
    const today = new Date();
    const formatDate = (dateOffset) => {
      const d = new Date(today);
      d.setDate(today.getDate() + dateOffset);
      return d.toISOString().split('T')[0];
    };

    // Booking 1: Occupied in 201 (Alice Smith)
    // Guest ID 2, Room ID 6 (Room 201)
    await dbRun(`
      INSERT INTO bookings (guest_id, room_id, check_in_date, check_out_date, actual_check_in, room_rate, deposit, status)
      VALUES (2, 6, ?, ?, ?, 159, 100, 'Checked-in')
    `, [formatDate(-2), formatDate(3), formatDate(-2) + ' 14:15:00']);

    // Invoice for Booking 1
    const booking1 = await dbGet("SELECT id FROM bookings WHERE guest_id = 2 AND room_id = 6");
    await dbRun(`
      INSERT INTO invoices (booking_id, subtotal, discount, tax, total, payment_status)
      VALUES (?, 795, 50, 74.5, 819.5, 'Partially_Paid')
    `, [booking1.id]);
    
    const invoice1 = await dbGet("SELECT id FROM invoices WHERE booking_id = ?", [booking1.id]);
    await dbRun(`
      INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, amount) VALUES 
      (?, 'Room Charge (5 nights)', 5, 159, 795),
      (?, 'Mini bar item - Wine', 1, 25, 25),
      (?, 'Spa Massage', 1, 120, 120)
    `, [invoice1.id, invoice1.id, invoice1.id]);
    
    // Update invoice total
    await dbRun(`
      UPDATE invoices SET subtotal = 940, tax = 94.0, total = 984.0 WHERE id = ?
    `, [invoice1.id]);

    // Booking 2: Occupied in 301 (David Miller)
    // Guest ID 3, Room ID 11 (Room 301)
    await dbRun(`
      INSERT INTO bookings (guest_id, room_id, check_in_date, check_out_date, actual_check_in, room_rate, deposit, status)
      VALUES (3, 11, ?, ?, ?, 349, 200, 'Checked-in')
    `, [formatDate(-1), formatDate(2), formatDate(-1) + ' 15:30:22']);

    const booking2 = await dbGet("SELECT id FROM bookings WHERE guest_id = 3 AND room_id = 11");
    await dbRun(`
      INSERT INTO invoices (booking_id, subtotal, discount, tax, total, payment_status)
      VALUES (?, 1047, 0, 104.7, 1151.7, 'Unpaid')
    `, [booking2.id]);
    const invoice2 = await dbGet("SELECT id FROM invoices WHERE booking_id = ?", [booking2.id]);
    await dbRun(`
      INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, amount) VALUES 
      (?, 'Room Charge (3 nights)', 3, 349, 1047),
      (?, 'Room Service Breakfast', 2, 20, 40)
    `, [invoice2.id, invoice2.id]);
    
    await dbRun(`
      UPDATE invoices SET subtotal = 1087, tax = 108.7, total = 1195.7 WHERE id = ?
    `, [invoice2.id]);

    // Booking 3: Reserved (Pending arrival today) Room 104 (John Doe)
    // Guest ID 1, Room ID 4 (Room 104)
    await dbRun(`
      INSERT INTO bookings (guest_id, room_id, check_in_date, check_out_date, room_rate, deposit, status)
      VALUES (1, 4, ?, ?, 149, 0, 'Confirmed')
    `, [formatDate(0), formatDate(4)]);
    
    const booking3 = await dbGet("SELECT id FROM bookings WHERE guest_id = 1 AND room_id = 4");
    await dbRun(`
      INSERT INTO invoices (booking_id, subtotal, tax, total, payment_status)
      VALUES (?, 596, 59.6, 655.6, 'Unpaid')
    `, [booking3.id]);
    const invoice3 = await dbGet("SELECT id FROM invoices WHERE booking_id = ?", [booking3.id]);
    await dbRun(`
      INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, amount) VALUES 
      (?, 'Room Charge (4 nights)', 4, 149, 596)
    `, [invoice3.id]);

    console.log('Database seeded successfully!');
  }
};

export default db;
