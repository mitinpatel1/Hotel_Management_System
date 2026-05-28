import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbGet, dbRun, dbAll } from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'grand_horizon_secret_key_2026';

export const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    const user = await dbGet('SELECT * FROM users WHERE username = ?', [username]);

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error during login.' });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await dbGet('SELECT id, username, email, name, role, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving user details.' });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await dbAll('SELECT id, username, email, name, role, created_at FROM users');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching staff members.' });
  }
};

export const createUser = async (req, res) => {
  const { username, password, email, name, role } = req.body;

  if (!username || !password || !email || !name || !role) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  if (!['admin', 'receptionist', 'housekeeper'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role assignment.' });
  }

  try {
    const existing = await dbGet('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existing) {
      return res.status(400).json({ message: 'Username or email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await dbRun(
      'INSERT INTO users (username, password_hash, email, name, role) VALUES (?, ?, ?, ?, ?)',
      [username, passwordHash, email, name, role]
    );

    res.status(201).json({
      message: 'User created successfully.',
      user: { id: result.id, username, email, name, role }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user.' });
  }
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;
  
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ message: 'You cannot delete your own admin account.' });
  }

  try {
    const result = await dbRun('DELETE FROM users WHERE id = ?', [id]);
    if (result.changes === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({ message: 'Staff member removed successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing user.' });
  }
};
