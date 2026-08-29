import express from 'express';
import mongoose from 'mongoose';
import City from '../models/City.js';
import ParkingLot from '../models/ParkingLot.js';
import ParkingSpot from '../models/ParkingSpot.js';
import User from '../models/User.js';
import ParkingSession from '../models/ParkingSession.js';
import Camera from '../models/Camera.js';
import ParkingPayment from '../models/ParkingPayment.js';
import PayPalWebhookEvent from '../models/PayPalWebhookEvent.js';

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
        location: { lat: 32.0159, lng: 34.7744 },
      },
      {
        name: 'חניון העירייה',
        address: 'ויצמן 58, חולון',
        totalSpots: 18,
        levels: 2,
        prefix: 'H-C',
        location: { lat: 32.0194, lng: 34.7723 },
      },
      {
        name: 'חניון קניון חולון',
        address: 'שדרות ירושלים 62, חולון',
        totalSpots: 30,
        levels: 3,
        prefix: 'H-MALL',
        location: { lat: 32.0083, lng: 34.7792 },
      },
      {
        name: 'חניון וולפסון',
        address: 'הלוחמים 62, חולון',
        totalSpots: 22,
        levels: 2,
        prefix: 'H-W',
        location: { lat: 32.0351, lng: 34.7649 },
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
        location: { lat: 32.0743, lng: 34.7925 },
      },
      {
        name: 'חניון רוטשילד',
        address: 'שדרות רוטשילד 1, תל אביב',
        totalSpots: 22,
        levels: 2,
        prefix: 'TA-R',
        location: { lat: 32.0637, lng: 34.7691 },
      },
      {
        name: 'חניון דיזנגוף סנטר',
        address: 'דיזנגוף 50, תל אביב',
        totalSpots: 28,
        levels: 3,
        prefix: 'TA-D',
        location: { lat: 32.0754, lng: 34.7753 },
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
        location: { lat: 31.9730, lng: 34.7748 },
      },
      {
        name: 'חניון קניון הזהב',
        address: 'דרך המכבים 58, ראשון לציון',
        totalSpots: 32,
        levels: 3,
        prefix: 'RZ-GOLD',
        location: { lat: 31.9900, lng: 34.7746 },
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
        location: { lat: 32.0836, lng: 34.8009 },
      },
      {
        name: 'חניון אצטדיון',
        address: 'זאב ז׳בוטינסקי 126, רמת גן',
        totalSpots: 34,
        levels: 4,
        prefix: 'RG-S',
        location: { lat: 32.1002, lng: 34.8242 },
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
        location: { lat: 32.0167, lng: 34.7385 },
      },
      {
        name: 'חניון העירייה בת ים',
        address: 'ניסנבאום 25, בת ים',
        totalSpots: 18,
        levels: 2,
        prefix: 'BY-C',
        location: { lat: 32.0138, lng: 34.7528 },
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
        location: { lat: 32.0709, lng: 34.8118 },
      },
      {
        name: 'חניון גבעתיים מערב',
        address: 'ויצמן 12, גבעתיים',
        totalSpots: 20,
        levels: 2,
        prefix: 'GV-W',
        location: { lat: 32.0742, lng: 34.8071 },
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
        location: { lat: 32.8048, lng: 34.9862 },
      },
      {
        name: 'חניון הנמל',
        address: 'שדרות פל-ים 8, חיפה',
        totalSpots: 36,
        levels: 4,
        prefix: 'HF-HR',
        location: { lat: 32.8210, lng: 34.9971 },
      },
      {
        name: 'חניון גרנד קניון',
        address: 'יפה נוף 111, חיפה',
        totalSpots: 30,
        levels: 3,
        prefix: 'HF-GR',
        location: { lat: 32.7907, lng: 35.0076 },
      },
      {
        name: 'חניון בת גלים',
        address: 'שדרות בת גלים 10, חיפה',
        totalSpots: 18,
        levels: 2,
        prefix: 'HF-BG',
        location: { lat: 32.8333, lng: 34.9804 },
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
        location: { lat: 31.2457, lng: 34.7980 },
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
        location: { lat: 32.1465, lng: 34.8391 },
      },
    ],
  },
];

const seedParkingFeesMinor = Object.freeze({
  'H-M': 2000,
  'H-C': 1800,
  'H-MALL': 2200,
  'H-W': 1600,
  'TA-AZ': 3500,
  'TA-R': 3000,
  'TA-D': 3200,
  'RZ-1': 1800,
  'RZ-GOLD': 2200,
  'RG-B': 2800,
  'RG-S': 2200,
  'BY-T': 1800,
  'BY-C': 1600,
  'GV-C': 2200,
  'GV-W': 2000,
  'HF-CN': 2200,
  'HF-HR': 1800,
  'HF-GR': 2000,
  'HF-BG': 1600,
  'BS-M': 1500,
  'RS-H': 2400,
});

const seedLotPricing = Object.freeze({
  'H-M': { isFree: false, freeFirstHours: 0, pricePerMinute: 0.2, fullDayPriceMinor: 2000 },
  'H-C': { isFree: false, freeFirstHours: 1, pricePerMinute: 0.2, fullDayPriceMinor: 1800 },
  'H-MALL': { isFree: false, freeFirstHours: 0, pricePerMinute: 0.25, fullDayPriceMinor: 2200 },
  'H-W': { isFree: true, freeFirstHours: 0, pricePerMinute: 0, fullDayPriceMinor: 0 },
  'TA-AZ': { isFree: false, freeFirstHours: 2, pricePerMinute: 0.35, fullDayPriceMinor: 3500 },
  'TA-R': { isFree: false, freeFirstHours: 1, pricePerMinute: 0.3, fullDayPriceMinor: 3000 },
  'TA-D': { isFree: false, freeFirstHours: 0, pricePerMinute: 0.32, fullDayPriceMinor: 3200 },
  'RZ-1': { isFree: false, freeFirstHours: 0, pricePerMinute: 0.18, fullDayPriceMinor: 1800 },
  'RZ-GOLD': { isFree: false, freeFirstHours: 1, pricePerMinute: 0.25, fullDayPriceMinor: 2200 },
  'RG-B': { isFree: false, freeFirstHours: 2, pricePerMinute: 0.3, fullDayPriceMinor: 2800 },
  'RG-S': { isFree: false, freeFirstHours: 0, pricePerMinute: 0.22, fullDayPriceMinor: 2200 },
  'BY-T': { isFree: false, freeFirstHours: 1, pricePerMinute: 0.2, fullDayPriceMinor: 1800 },
  'BY-C': { isFree: true, freeFirstHours: 0, pricePerMinute: 0, fullDayPriceMinor: 0 },
  'GV-C': { isFree: false, freeFirstHours: 0, pricePerMinute: 0.25, fullDayPriceMinor: 2200 },
  'GV-W': { isFree: false, freeFirstHours: 2, pricePerMinute: 0.2, fullDayPriceMinor: 2000 },
  'HF-CN': { isFree: false, freeFirstHours: 0, pricePerMinute: 0.25, fullDayPriceMinor: 2200 },
  'HF-HR': { isFree: false, freeFirstHours: 1, pricePerMinute: 0.2, fullDayPriceMinor: 1800 },
  'HF-GR': { isFree: false, freeFirstHours: 0, pricePerMinute: 0.2, fullDayPriceMinor: 2000 },
  'HF-BG': { isFree: true, freeFirstHours: 0, pricePerMinute: 0, fullDayPriceMinor: 0 },
  'BS-M': { isFree: false, freeFirstHours: 2, pricePerMinute: 0.15, fullDayPriceMinor: 1500 },
  'RS-H': { isFree: false, freeFirstHours: 1, pricePerMinute: 0.28, fullDayPriceMinor: 2400 },
});

const validateSeedLotPricing = (config) => {
  if (!config) {
    return false;
  }

  const hasFreeLot = Boolean(config.isFree);
  const freeFirstHours = Number(config.freeFirstHours || 0);
  const pricePerMinute = Number(config.pricePerMinute || 0);
  const fullDayPriceMinor = Number(config.fullDayPriceMinor || 0);

  if (hasFreeLot && (freeFirstHours !== 0 || pricePerMinute !== 0 || fullDayPriceMinor !== 0)) {
    return false;
  }

  if (pricePerMinute !== 0 && (pricePerMinute < 0.1 || pricePerMinute > 0.5)) {
    return false;
  }

  if (fullDayPriceMinor < 0 || !Number.isSafeInteger(fullDayPriceMinor)) {
    return false;
  }

  return Number.isFinite(freeFirstHours) && freeFirstHours >= 0;
};

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
      Camera.deleteMany({}),
      ParkingPayment.deleteMany({}),
      PayPalWebhookEvent.deleteMany({}),
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
    await ParkingPayment.createCollection().catch(() => {});
    await PayPalWebhookEvent.createCollection().catch(() => {});

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
      Camera.deleteMany({}),
      ParkingPayment.deleteMany({}),
      PayPalWebhookEvent.deleteMany({}),
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
        const pricingConfig = seedLotPricing[lotSeed.prefix] || {
          isFree: false,
          freeFirstHours: 0,
          pricePerMinute: 0,
          fullDayPriceMinor: 0,
        };

        if (!validateSeedLotPricing(pricingConfig)) {
          throw new Error(`Invalid pricing config for lot seed: ${lotSeed.prefix}`);
        }

        const lot = await ParkingLot.create({
          name: lotSeed.name,
          city: cityDoc._id,
          address: lotSeed.address,
          totalSpots: lotSeed.totalSpots,
          levels: lotSeed.levels,
          location: lotSeed.location,
          ...pricingConfig,
          parkingFeeMinor: seedParkingFeesMinor[lotSeed.prefix] || 0,
          currency: 'ILS',
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
