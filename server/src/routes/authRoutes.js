import express from 'express';
import { login, getMe, getAllUsers, createUser, deleteUser } from '../controllers/authController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Public route
router.post('/login', login);

// Authenticated route
router.get('/me', authenticateToken, getMe);

// Admin-only staff management routes
router.get('/users', authenticateToken, authorizeRoles('admin'), getAllUsers);
router.post('/users', authenticateToken, authorizeRoles('admin'), createUser);
router.delete('/users/:id', authenticateToken, authorizeRoles('admin'), deleteUser);

export default router;
