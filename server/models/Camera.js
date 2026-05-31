import mongoose from 'mongoose';

const cameraSchema = new mongoose.Schema({
  parkingLot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingLot',
    required: true,
  },
  cameraType: {
    type: String,
    enum: ['entry', 'exit'],
    required: true,
  },
  ipAddress: {
    type: String,
    required: true,
  }
}, { timestamps: true });

export default mongoose.model('Camera', cameraSchema);
