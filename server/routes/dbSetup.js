import express from 'express';
import mongoose from 'mongoose';
import City from '../models/City.js';
import ParkingLot from '../models/ParkingLot.js';
import ParkingSpot from '../models/ParkingSpot.js';
import User from '../models/User.js';
import ParkingSession from '../models/ParkingSession.js';
import Camera from '../models/Camera.js';

const router = express.Router();

const seedCities = [
  {
    name: 'חולון',
    lots: [
      {
        name: 'חניון המדיטק',
        address: 'גולדה מאיר 6, חולון',
        totalSpots: 50,
        levels: 10,
        prefix: 'H-M',
      },
      {
        name: 'חניון העירייה',
        address: 'ויצמן 58, חולון',
        totalSpots: 18,
        levels: 2,
        prefix: 'H-C',
      },
      {
        name: 'חניון קניון חולון',
        address: 'שדרות ירושלים 62, חולון',
        totalSpots: 30,
        levels: 3,
        prefix: 'H-MALL',
      },
      {
        name: 'חניון וולפסון',
        address: 'הלוחמים 62, חולון',
        totalSpots: 22,
        levels: 2,
        prefix: 'H-W',
      },
    ],
  },
  {
    name: 'תל אביב',
    lots: [
      {
        name: 'חניון עזריאלי',
        address: 'דרך מנחם בגין 132, תל אביב',
        totalSpots: 40,
        levels: 4,
        prefix: 'TA-AZ',
      },
      {
        name: 'חניון רוטשילד',
        address: 'שדרות רוטשילד 1, תל אביב',
        totalSpots: 22,
        levels: 2,
        prefix: 'TA-R',
      },
      {
        name: 'חניון דיזנגוף סנטר',
        address: 'דיזנגוף 50, תל אביב',
        totalSpots: 28,
        levels: 3,
        prefix: 'TA-D',
      },
    ],
  },
  {
    name: 'ראשון לציון',
    lots: [
      {
        name: 'חניון ראשונים',
        address: 'החלמונית 2, ראשון לציון',
        totalSpots: 20,
        levels: 2,
        prefix: 'RZ-1',
      },
      {
        name: 'חניון קניון הזהב',
        address: 'דרך המכבים 58, ראשון לציון',
        totalSpots: 32,
        levels: 3,
        prefix: 'RZ-GOLD',
      },
    ],
  },
  {
    name: 'רמת גן',
    lots: [
      {
        name: 'חניון הבורסה',
        address: 'תובל 11, רמת גן',
        totalSpots: 26,
        levels: 2,
        prefix: 'RG-B',
      },
      {
        name: 'חניון אצטדיון',
        address: 'זאב ז׳בוטינסקי 126, רמת גן',
        totalSpots: 34,
        levels: 4,
        prefix: 'RG-S',
      },
    ],
  },
  {
    name: 'בת ים',
    lots: [
      {
        name: 'חניון הטיילת',
        address: 'דרך בן גוריון 125, בת ים',
        totalSpots: 16,
        levels: 2,
        prefix: 'BY-T',
      },
      {
        name: 'חניון העירייה בת ים',
        address: 'ניסנבאום 25, בת ים',
        totalSpots: 18,
        levels: 2,
        prefix: 'BY-C',
      },
    ],
  },
  {
    name: 'גבעתיים',
    lots: [
      {
        name: 'חניון גבעתיים סנטר',
        address: 'כצנלסון 113, גבעתיים',
        totalSpots: 14,
        levels: 2,
        prefix: 'GV-C',
      },
      {
        name: 'חניון גבעתיים מערב',
        address: 'ויצמן 12, גבעתיים',
        totalSpots: 20,
        levels: 2,
        prefix: 'GV-W',
      },
    ],
  },
  {
    name: 'חיפה',
    lots: [
      {
        name: 'חניון מרכז הכרמל',
        address: 'שדרות הנשיא 124, חיפה',
        totalSpots: 24,
        levels: 3,
        prefix: 'HF-CN',
      },
      {
        name: 'חניון הנמל',
        address: 'שדרות פל-ים 8, חיפה',
        totalSpots: 36,
        levels: 4,
        prefix: 'HF-HR',
      },
      {
        name: 'חניון גרנד קניון',
        address: 'יפה נוף 111, חיפה',
        totalSpots: 30,
        levels: 3,
        prefix: 'HF-GR',
      },
      {
        name: 'חניון בת גלים',
        address: 'שדרות בת גלים 10, חיפה',
        totalSpots: 18,
        levels: 2,
        prefix: 'HF-BG',
      },
    ],
  },
];

const createParkingSpots = (parkingLotId, totalSpots, levels, prefix) => {
  const spots = [];
  const maxLevel = Math.min(16, Math.max(1, Math.min(levels, totalSpots)));

  const levelPlan = [];
  for (let level = 1; level <= maxLevel; level += 1) {
    levelPlan.push(level);
  }

  for (let extra = maxLevel; extra < totalSpots; extra += 1) {
    levelPlan.push(Math.floor(Math.random() * maxLevel) + 1);
  }

  while (levelPlan.length > 0) {
    const randomIndex = Math.floor(Math.random() * levelPlan.length);
    const [selectedLevel] = levelPlan.splice(randomIndex, 1);
    const spotIndex = totalSpots - levelPlan.length;

    const status = spotIndex % 4 === 0 ? 'occupied' : 'free';

    let type = 'regular';
    if (spotIndex % 11 === 0) type = 'vip';
    else if (spotIndex % 7 === 0) type = 'dean';
    else if (spotIndex % 5 === 0) type = 'disabled';

    spots.push({
      parkingLot: parkingLotId,
      level: selectedLevel,
      spotNumber: `${prefix}-${String(spotIndex).padStart(2, '0')}`,
      status,
      type,
      currentCarLicensePlate: status === 'occupied' ? `${prefix.replace(/[^A-Z0-9]/gi, '')}-${100 + spotIndex}` : null,
    });
  }

  return spots;
};

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
    const createdCities = {};

    for (const citySeed of seedCities) {
      createdCities[citySeed.name] = await City.create({ name: citySeed.name });
    }

    // 2. Mock Admin User
    const adminUser = await User.create({
      fullName: 'Admin Smart Parking',
      email: 'admin@smartparking.com',
      password: 'password123',
      authorizedCity: createdCities['תל אביב']._id
    });

    createdCities['תל אביב'].authorizedUsers.push(adminUser._id);
    await createdCities['תל אביב'].save();

    // 3. Mock Parking Lots and Spots
    const activeSessions = [];

    for (const citySeed of seedCities) {
      const cityDoc = createdCities[citySeed.name];

      for (const lotSeed of citySeed.lots) {
        const lot = await ParkingLot.create({
          name: lotSeed.name,
          city: cityDoc._id,
          address: lotSeed.address,
          totalSpots: lotSeed.totalSpots,
          levels: lotSeed.levels,
        });

        cityDoc.parkingLots.push(lot._id);

        const spots = createParkingSpots(lot._id, lotSeed.totalSpots, lotSeed.levels, lotSeed.prefix);
        await ParkingSpot.insertMany(spots);

        const firstOccupiedSpot = spots.find((spot) => spot.status === 'occupied');
        if (firstOccupiedSpot) {
          activeSessions.push({
            carLicensePlate: firstOccupiedSpot.currentCarLicensePlate,
            parkingLot: lot._id,
            status: 'active',
          });
        }
      }

      await cityDoc.save();
    }

    // 4. Mock Parking Sessions
    if (activeSessions.length > 0) {
      await ParkingSession.insertMany(activeSessions.slice(0, 6));
    }

    res.json({ message: 'Database successfully seeded with mock data!' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error during seed', error: error.message });
  }
});

export default router;
