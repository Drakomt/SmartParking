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
        totalSpots: 160,
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
  {
    name: 'באר שבע',
    lots: [
      {
        name: 'חניון באר שבע מרכז',
        address: 'שדרות הנשיא 1, באר שבע',
        totalSpots: 40,
        levels: 3,
        prefix: 'BS-M',
      },
    ],
  },
  {
    name: 'רמת השרון',
    lots: [
      {
        name: 'חניון רמת השרון',
        address: 'רחוב הגליל 10, רמת השרון',
        totalSpots: 30,
        levels: 2,
        prefix: 'RS-H',
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
    levelPlan.push((extra % maxLevel) + 1);
  }

  const levelCounters = {};

  while (levelPlan.length > 0) {
    const randomIndex = Math.floor(Math.random() * levelPlan.length);
    const [selectedLevel] = levelPlan.splice(randomIndex, 1);

    const currentCount = (levelCounters[selectedLevel] || 0) + 1;
    levelCounters[selectedLevel] = currentCount;

    
    const status = Math.random() < 0.4 ? 'occupied' : 'free';

    const rand = Math.random();
    
    let type = 'regular';
    
          
    if (rand < 0.10) {
      type = 'dean';          
    } else if (rand < 0.20) {
      type = 'disabled';     
    }
  

    // spot name: level + spotIndexInLevel (padded to 2 digits), e.g. level 3 spot 4 -> "304", level 10 spot 12 -> "1012"
    const spotNumber = `${selectedLevel}${String(currentCount).padStart(2, '0')}`;

    spots.push({
      parkingLot: parkingLotId,
      level: selectedLevel,
      spotNumber,
      status,
      type,
      // keep spot's currentCarLicensePlate null as requested
      currentCarLicensePlate: null,
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

    // 2. Mock Users
    const usersToCreate = [
      {
        fullName: 'central',
        email: 'central@smartparking.com',
        password: 'central',
        authorizedCities: [
          createdCities['תל אביב']._id,
          createdCities['חולון']._id,
          createdCities['רמת גן']._id,
          createdCities['ראשון לציון']._id,
          createdCities['גבעתיים']._id,
          createdCities['בת ים']._id,
        ],
      },
      {
        fullName: 'sharon',
        email: 'sharon@smartparking.com',
        password: 'sharon',
        authorizedCities: [createdCities['רמת השרון']._id],
      },
      {
        fullName: 'south',
        email: 'south@smartparking.com',
        password: 'south',
        authorizedCities: [createdCities['באר שבע']._id],
      },
      {
        fullName: 'north',
        email: 'north@smartparking.com',
        password: 'north',
        authorizedCities: [createdCities['חיפה']._id],
      },
    ];

    const createdUsers = [];
    for (const userData of usersToCreate) {
      const user = await User.create(userData);
      createdUsers.push(user);
    }

    const cityById = new Map(Object.values(createdCities).map((cityDoc) => [cityDoc._id.toString(), cityDoc]));

    for (const user of createdUsers) {
      for (const cityId of user.authorizedCities || []) {
        const cityDoc = cityById.get(cityId.toString());
        if (cityDoc && !cityDoc.authorizedUsers.some((authorizedUserId) => authorizedUserId.toString() === user._id.toString())) {
          cityDoc.authorizedUsers.push(user._id);
          await cityDoc.save();
        }
      }
    }

    // 3. Mock Parking Lots and Spots
    // We'll create parking sessions equal to the number of occupied spots per lot.
    let plateCounter = 10000000; // start to generate 8-digit numeric plates
    const sessionsToInsert = [];

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

        // count occupied spots in this lot and create that many active sessions
        const occupiedCount = spots.filter((s) => s.status === 'occupied').length;
        for (let k = 0; k < occupiedCount; k += 1) {
          const plate = String(plateCounter).padStart(8, '0');
          plateCounter += 1;
          sessionsToInsert.push({
            carLicensePlate: plate,
            parkingLot: lot._id,
            parkingSpot: null,
          });
        }
      }

      await cityDoc.save();
    }

    // 4. Mock Parking Sessions: insert all generated active sessions
    if (sessionsToInsert.length > 0) {
      await ParkingSession.insertMany(sessionsToInsert);
    }

    res.json({ message: 'Database successfully seeded with mock data!' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error during seed', error: error.message });
  }
});

export default router;
