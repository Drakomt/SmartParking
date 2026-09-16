import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import ParkingLot from '../models/ParkingLot.js';
import ParkingSpot from '../models/ParkingSpot.js';
import ParkingSession from '../models/ParkingSession.js';

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const removedRoles = await User.collection.updateMany(
    { role: { $exists: true } },
    { $unset: { role: '' } },
  );

  const totals = await ParkingSpot.aggregate([
    { $group: { _id: '$parkingLot', totalSpots: { $sum: 1 } } },
  ]);
  await ParkingLot.updateMany({}, { $set: { totalSpots: 0 } });
  if (totals.length) {
    await ParkingLot.bulkWrite(totals.map(({ _id, totalSpots }) => ({
      updateOne: { filter: { _id }, update: { $set: { totalSpots } } },
    })));
  }

  const sessionsWithoutSpot = await ParkingSession.countDocuments({ parkingSpot: null });
  await ParkingSpot.createIndexes();

  console.log(JSON.stringify({
    removedRoles: removedRoles.modifiedCount,
    synchronizedLots: totals.length,
    sessionsWithoutSpot,
  }));
  if (sessionsWithoutSpot > 0) {
    console.warn('Existing sessions without a parkingSpot require manual reconciliation. New LoRa sessions are linked automatically.');
  }
};

run()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
