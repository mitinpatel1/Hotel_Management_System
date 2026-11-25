import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AccountRequest from '../models/AccountRequest.js';

const JWT_SECRET = process.env.JWT_SECRET || 'grand_horizon_secret_key_2026';

// ─── SIGNUP STATUS CHECK ────────────────────────────────────────────────────
export const checkSignupStatus = async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    res.json({
      canSignup: true,
      isFirstUser: userCount === 0,
      requiresInviteCode: userCount > 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Status check failed.' });
  }
};

// ─── REGISTER (Admin first-time only) ───────────────────────────────────────
export const register = async (req, res) => {
  try {
    const { username, password, email, name } = req.body;

    if (!username || !password || !email || !name) {
      return res.status(400).json({ message: 'Saare fields fill karo.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password kam se kam 6 characters ka hona chahiye.' });
    }

    const userCount = await User.countDocuments();
    if (userCount > 0) {
      return res.status(403).json({ message: 'Admin account pehle se ban chuka hai.' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password_hash, email, name, role: 'admin' });

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.status(201).json({
      message: 'Admin account ban gaya!',
      token,
      user: { id: user._id, username: user.username, role: user.role, name: user.name, email: user.email }
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Username ya email already exist karta hai.' });
    }
    console.error('Register error:', error);
    res.status(500).json({ message: 'Account banane mein error aaya.' });
  }
};

// ─── REQUEST ACCOUNT (Staff signup request) ──────────────────────────────────
export const requestAccount = async (req, res) => {
  try {
    const { name, username, email, password, role } = req.body;

    if (!name || !username || !email || !password || !role) {
      return res.status(400).json({ message: 'Saare fields fill karo.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password kam se kam 6 characters ka hona chahiye.' });
    }
    if (!['receptionist', 'housekeeper'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role.' });
    }

    // Check existing User
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Is username ya email se account pehle se exist karta hai.' });
    }

    // Check pending request
    const existingRequest = await AccountRequest.findOne({
      $or: [{ username }, { email }],
      status: 'pending'
    });
    if (existingRequest) {
      return res.status(400).json({ message: 'Is username ya email ki request pehle se pending hai. Admin ka wait karo.' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    await AccountRequest.create({ name, username, email, password_hash, role, status: 'pending' });

    return res.status(201).json({
      message: 'Request bhej di gayi! Admin approve karega tab account banega.'
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Is username ya email ki request already hai.' });
    }
    console.error('Request account error:', error);
    res.status(500).json({ message: 'Request bhejne mein error aaya.' });
  }
};

// ─── GET PENDING REQUESTS (Admin only) ───────────────────────────────────────
export const getPendingRequests = async (req, res) => {
  try {
    const requests = await AccountRequest.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Requests fetch karne mein error aaya.' });
  }
};

// ─── APPROVE REQUEST (Admin only) ────────────────────────────────────────────
export const approveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await AccountRequest.findById(id);

    if (!request) {
      return res.status(404).json({ message: 'Request nahi mili.' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Yeh request pehle se process ho chuki hai.' });
    }

    // Check if user already exists (edge case)
    const existing = await User.findOne({ $or: [{ username: request.username }, { email: request.email }] });
    if (existing) {
      await AccountRequest.findByIdAndUpdate(id, { status: 'approved' });
      return res.status(400).json({ message: 'Is username ya email se user pehle se exist karta hai.' });
    }

    // Create user from request
    const user = await User.create({
      name: request.name,
      username: request.username,
      email: request.email,
      password_hash: request.password_hash,
      role: request.role
    });

    await AccountRequest.findByIdAndUpdate(id, { status: 'approved' });

    res.json({
      message: `${request.name} ka account approve ho gaya!`,
      user: { id: user._id, username: user.username, role: user.role, name: user.name }
    });

  } catch (error) {
    console.error('Approve error:', error);
    res.status(500).json({ message: 'Approve karne mein error aaya.' });
  }
};

// ─── REJECT REQUEST (Admin only) ─────────────────────────────────────────────
export const rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await AccountRequest.findById(id);

    if (!request) {
      return res.status(404).json({ message: 'Request nahi mili.' });
    }

    await AccountRequest.findByIdAndDelete(id);

    res.json({ message: `${request.name} ki request reject kar di gayi.` });

  } catch (error) {
    console.error('Reject error:', error);
    res.status(500).json({ message: 'Reject karne mein error aaya.' });
  }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
export const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
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

// ─── GET ME ───────────────────────────────────────────────────────────────────
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password_hash');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving user details.' });
  }
};

// ─── GET ALL USERS ────────────────────────────────────────────────────────────
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password_hash').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching staff members.' });
  }
};

// ─── CREATE USER (Admin direct) ───────────────────────────────────────────────
export const createUser = async (req, res) => {
  const { username, password, email, name, role } = req.body;

  if (!username || !password || !email || !name || !role) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  if (!['admin', 'receptionist', 'housekeeper'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role assignment.' });
  }

  try {
    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      return res.status(400).json({ message: 'Username or email already exists.' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password_hash, email, name, role });

    res.status(201).json({
      message: 'User created successfully.',
      user: { id: user._id, username, email, name, role }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user.' });
  }
};

// ─── DELETE USER ──────────────────────────────────────────────────────────────
export const deleteUser = async (req, res) => {
  const { id } = req.params;

  if (id === req.user.id.toString()) {
    return res.status(400).json({ message: 'You cannot delete your own admin account.' });
  }

  try {
    const result = await User.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({ message: 'Staff member removed successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing user.' });
  }
};
