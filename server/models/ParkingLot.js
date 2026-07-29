import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  lat: {
    type: Number,
    required: true,
    min: -90,
    max: 90,
  },
  lng: {
    type: Number,
    required: true,
    min: -180,
    max: 180,
  },
}, { _id: false });

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
  },
  location: {
    type: locationSchema,
    required: false,
  },
}, { timestamps: true });

export default mongoose.model('ParkingLot', parkingLotSchema);
