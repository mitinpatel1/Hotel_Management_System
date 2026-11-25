import mongoose from 'mongoose';

const housekeepingLogSchema = new mongoose.Schema({
  room_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  staff_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  action: {
    type: String,
    required: true,
    enum: ['Clean', 'Dirty', 'Maintenance', 'Inspect']
  },
  notes: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
});

const HousekeepingLog = mongoose.model('HousekeepingLog', housekeepingLogSchema);
export default HousekeepingLog;
