import express from 'express';
import { 
  getInvoiceByBookingId, 
  addInvoiceItem, 
  processPayment 
} from '../controllers/billingController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.get('/booking/:bookingId', authenticateToken, getInvoiceByBookingId);
router.post('/booking/:bookingId/items', authenticateToken, authorizeRoles('admin', 'receptionist'), addInvoiceItem);
router.post('/booking/:bookingId/pay', authenticateToken, authorizeRoles('admin', 'receptionist'), processPayment);

export default router;
