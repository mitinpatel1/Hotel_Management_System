import mongoose from 'mongoose';

const accountRequestSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  username: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  password_hash: { type: String, required: true },
  role: {
    type: String,
    required: true,
    enum: ['receptionist', 'housekeeper'],
    default: 'receptionist'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  rejectionReason: { type: String, default: '' }
}, { timestamps: true });

const AccountRequest = mongoose.model('AccountRequest', accountRequestSchema);
export default AccountRequest;
