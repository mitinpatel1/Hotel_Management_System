import express from 'express';
import { 
  getAllGuests, 
  getGuestById, 
  createGuest, 
  updateGuest, 
  deleteGuest 
} from '../controllers/guestController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, getAllGuests);
router.get('/:id', authenticateToken, getGuestById);
router.post('/', authenticateToken, createGuest);
router.put('/:id', authenticateToken, updateGuest);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), deleteGuest);

export default router;
