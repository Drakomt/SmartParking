import mongoose from 'mongoose';

const parkingLotSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  city: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  totalSpots: {
    type: Number,
    required: true,
    min: 0,
  },
  levels: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  }
}, { timestamps: true });

export default mongoose.model('ParkingLot', parkingLotSchema);
