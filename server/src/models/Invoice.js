import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  unit_price: { type: Number, required: true },
  amount: { type: Number, required: true }
}, { _id: true });

const invoiceSchema = new mongoose.Schema({
  booking_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  items: [invoiceItemSchema],
  subtotal: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  payment_status: {
    type: String,
    enum: ['Unpaid', 'Partially_Paid', 'Paid'],
    default: 'Unpaid'
  },
  payment_method: { type: String, default: null }
}, { timestamps: true });

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;
