import express from 'express';
import { 
  getAllRooms, 
  getRoomById, 
  createRoom, 
  updateRoom, 
  updateRoomStatus, 
  deleteRoom,
  getHousekeepingLogs
} from '../controllers/roomController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// General authenticated routes
router.get('/', authenticateToken, getAllRooms);
router.get('/logs', authenticateToken, getHousekeepingLogs);
router.get('/:id', authenticateToken, getRoomById);

// Staff and cleaning routes
router.patch('/:id/status', authenticateToken, authorizeRoles('admin', 'receptionist', 'housekeeper'), updateRoomStatus);

// Admin-only CRUD routes
router.post('/', authenticateToken, authorizeRoles('admin'), createRoom);
router.put('/:id', authenticateToken, authorizeRoles('admin'), updateRoom);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), deleteRoom);

export default router;
