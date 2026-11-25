import express from 'express';
import {
  login, register, checkSignupStatus,
  getMe, getAllUsers, createUser, deleteUser,
  requestAccount, getPendingRequests, approveRequest, rejectRequest
} from '../controllers/authController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// ─── Public routes ────────────────────────────────────────────────────────────
router.post('/login', login);
router.post('/register', register);                // Admin first-time registration
router.get('/signup-status', checkSignupStatus);
router.post('/request-account', requestAccount);  // Staff signup request (no auth needed)

// ─── Authenticated route ──────────────────────────────────────────────────────
router.get('/me', authenticateToken, getMe);

// ─── Admin-only: Staff management ─────────────────────────────────────────────
router.get('/users', authenticateToken, authorizeRoles('admin'), getAllUsers);
router.post('/users', authenticateToken, authorizeRoles('admin'), createUser);
router.delete('/users/:id', authenticateToken, authorizeRoles('admin'), deleteUser);

// ─── Admin-only: Account requests ─────────────────────────────────────────────
router.get('/account-requests', authenticateToken, authorizeRoles('admin'), getPendingRequests);
router.post('/account-requests/:id/approve', authenticateToken, authorizeRoles('admin'), approveRequest);
router.delete('/account-requests/:id', authenticateToken, authorizeRoles('admin'), rejectRequest);

export default router;
