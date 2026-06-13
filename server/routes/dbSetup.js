import express from 'express';
import mongoose from 'mongoose';
import City from '../models/City.js';
import ParkingLot from '../models/ParkingLot.js';
import ParkingSpot from '../models/ParkingSpot.js';
import User from '../models/User.js';
import ParkingSession from '../models/ParkingSession.js';
import Camera from '../models/Camera.js';

const router = express.Router();

// ==========================================
// 1. INITIALIZE DB (Clear data & create collections)
// ==========================================
router.post('/init', async (req, res) => {
  try {
    // Clear all existing data
    await Promise.all([
      City.deleteMany({}),
      ParkingLot.deleteMany({}),
      ParkingSpot.deleteMany({}),
      User.deleteMany({}),
      ParkingSession.deleteMany({}),
      Camera.deleteMany({})
    ]);

    // Explicitly create collections 
    // (Mongoose usually does this automatically on first insert, 
    // but doing it explicitly guarantees they exist even if empty)
    await City.createCollection().catch(() => {});         // Catch ignores error if already exists
    await ParkingLot.createCollection().catch(() => {});
    await ParkingSpot.createCollection().catch(() => {});
    await User.createCollection().catch(() => {});
    await ParkingSession.createCollection().catch(() => {});
    await Camera.createCollection().catch(() => {});

    res.json({ message: 'Database initialized: All existing data cleared and collections ensured.' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error during init', error: error.message });
  }
});

// ==========================================
// 2. SEED DB (Fill with Mock Data)
// ==========================================
router.post('/seed', async (req, res) => {
  try {
    // Make sure we start fresh for the seed
    await Promise.all([
      City.deleteMany({}),
      ParkingLot.deleteMany({}),
      ParkingSpot.deleteMany({}),
      User.deleteMany({}),
      ParkingSession.deleteMany({}),
      Camera.deleteMany({})
    ]);

    // 1. Mock Cities
    const holon = await City.create({ name: 'חולון' });
    const telAviv = await City.create({ name: 'תל אביב' });

    // 2. Mock Admin User
    const adminUser = await User.create({
      fullName: 'Admin Holon',
      email: 'admin@holon.com',
      password: 'password123',
      authorizedCity: holon._id
    });

    holon.authorizedUsers.push(adminUser._id);
    await holon.save();

    // 3. Mock Parking Lots
    const lot1 = await ParkingLot.create({
      name: 'חניון המדיטק',
      city: holon._id,
      address: 'גולדה מאיר 6, חולון',
      totalSpots: 10,  // keeping mock data small for testing
      levels: 2
    });

    const lot2 = await ParkingLot.create({
      name: 'חניון עזריאלי',
      city: telAviv._id,
      address: 'דרך מנחם בגין 132, תל אביב',
      totalSpots: 15,
      levels: 1
    });

    holon.parkingLots.push(lot1._id);
    await holon.save();

    telAviv.parkingLots.push(lot2._id);
    await telAviv.save();

    // 4. Mock Parking Spots for Lot 1 (Mediatheque Holon)
    const spotsToInsert = [];
    for (let i = 1; i <= lot1.totalSpots; i++) {
      const isOccupied = i % 3 === 0; // Make every 3rd spot occupied
      spotsToInsert.push({
        parkingLot: lot1._id,
        level: i <= 5 ? 1 : 2, // First 5 on level 1, next 5 on level 2
        status: isOccupied ? 'occupied' : 'free', 
        currentCarLicensePlate: isOccupied ? `123-45-${i}` : null
      });
    }
    await ParkingSpot.insertMany(spotsToInsert);

    // 5. Mock Parking Spots for Lot 2 (Azrieli Tel Aviv)
    const azrieliSpots = [];
    for (let i = 1; i <= lot2.totalSpots; i++) {
        const isOccupied = i % 2 === 0; // Make every 2nd spot occupied
        azrieliSpots.push({
            parkingLot: lot2._id,
            level: 1,
            status: isOccupied ? 'occupied' : 'free',
            currentCarLicensePlate: isOccupied ? `987-65-${i}` : null
        });
    }
    await ParkingSpot.insertMany(azrieliSpots);

    // 6. Mock Parking Sessions (Optional)
    // We'll create one active session just so you have something to fetch if needed
    await ParkingSession.create({
      carLicensePlate: '123-45-3', // Matches one of the occupied spots
      parkingLot: lot1._id,
      status: 'active'
    });

    res.json({ message: 'Database successfully seeded with mock data!' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error during seed', error: error.message });
  }
});

export default router;
