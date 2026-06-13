import mongoose from 'mongoose';

const citySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  authorizedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  parkingLots: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingLot'
  }]
}, { timestamps: true });

export default mongoose.model('City', citySchema);
