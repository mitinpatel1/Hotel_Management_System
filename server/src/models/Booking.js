import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  guest_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Guest', required: true },
  room_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  check_in_date: { type: String, required: true },   // YYYY-MM-DD
  check_out_date: { type: String, required: true },  // YYYY-MM-DD
  actual_check_in: { type: String, default: null },
  actual_check_out: { type: String, default: null },
  room_rate: { type: Number, required: true },
  deposit: { type: Number, default: 0 },
  status: {
    type: String,
    required: true,
    enum: ['Pending', 'Confirmed', 'Checked-in', 'Checked-out', 'Cancelled'],
    default: 'Confirmed'
  }
}, { timestamps: true });

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
