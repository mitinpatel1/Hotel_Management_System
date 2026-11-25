import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password_hash: { type: String, required: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  name: { type: String, required: true, trim: true },
  role: {
    type: String,
    required: true,
    enum: ['admin', 'receptionist', 'housekeeper']
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
