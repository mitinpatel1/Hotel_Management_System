import express from 'express';
import { 
  getAllBookings, 
  getBookingById, 
  createBooking, 
  checkIn, 
  checkOut, 
  cancelBooking 
} from '../controllers/bookingController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, getAllBookings);
router.get('/:id', authenticateToken, getBookingById);
router.post('/', authenticateToken, authorizeRoles('admin', 'receptionist'), createBooking);
router.post('/:id/check-in', authenticateToken, authorizeRoles('admin', 'receptionist'), checkIn);
router.post('/:id/check-out', authenticateToken, authorizeRoles('admin', 'receptionist'), checkOut);
router.post('/:id/cancel', authenticateToken, authorizeRoles('admin', 'receptionist'), cancelBooking);

export default router;
