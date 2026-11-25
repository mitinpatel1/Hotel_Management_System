import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  room_number: { type: String, required: true, unique: true, trim: true },
  type: {
    type: String,
    required: true,
    enum: ['Single', 'Double', 'Suite', 'Deluxe', 'Penthouse']
  },
  floor: { type: Number, required: true },
  price_per_night: { type: Number, required: true },
  status: {
    type: String,
    required: true,
    enum: ['Available', 'Occupied', 'Dirty', 'Maintenance'],
    default: 'Available'
  },
  amenities: { type: String, default: '' }
}, { timestamps: true });

const Room = mongoose.model('Room', roomSchema);
export default Room;
