import mongoose from 'mongoose';

const guestSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true, default: null },
  phone: { type: String, required: true, trim: true },
  id_type: { type: String, required: true }, // e.g. 'Passport', 'Drivers License', 'National ID'
  id_number: { type: String, required: true },
  notes: { type: String, default: null }
}, { timestamps: true });

const Guest = mongoose.model('Guest', guestSchema);
export default Guest;
