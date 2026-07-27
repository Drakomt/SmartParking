import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import parkingSpotRepo from '../repositories/parkingSpotRepo.js';
import parkingSessionRepo from '../repositories/parkingSessionRepo.js';

dotenv.config();

const LORA_ENDPOINT = process.env.LORA_ENDPOINT_URL || 'http://localhost:3000/lora/update-spot';
const INTERVAL_MS = Number(process.env.LORA_SIMULATOR_INTERVAL_MS || 30000);

const pickRandomSpot = (spots) => {
  return spots[Math.floor(Math.random() * spots.length)];
};

const getRandomStatus = (currentStatus) => {
  if (currentStatus === 'free') {
    return 'occupied';
  }

  if (currentStatus === 'occupied') {
    return 'free';
  }

  return Math.random() < 0.5 ? 'free' : 'occupied';
};

const sendSpotAndSessionUpdate = async () => {
  const spots = await parkingSpotRepo.findAllSpots();
  if (!spots.length) {
    console.log('[lora-simulator] No parking spots found. Waiting for data...');
    return;
  }

  const freeSpots = spots.filter((s) => s.status === 'free');
  const occupiedSpots = spots.filter((s) => s.status === 'occupied');
  let action = !freeSpots.length
    ? 'remove'
    : !occupiedSpots.length
    ? 'create'
    : Math.random() < 0.5
    ? 'create'
    : 'remove';

  let spot;
  if (action === 'create') {
    spot = pickRandomSpot(freeSpots);
  } else {
    const session = await parkingSessionRepo.findRandomSession();
    if (!session) {
      action = 'create';
      spot = pickRandomSpot(freeSpots);
    } else {
      const lotId = session.parkingLot.toString();
      const lotOccupiedSpots = occupiedSpots.filter((s) => s.parkingLot.toString() === lotId);
      spot = lotOccupiedSpots.length ? pickRandomSpot(lotOccupiedSpots) : pickRandomSpot(occupiedSpots);
    }
  }

  const status = action === 'create' ? 'occupied' : 'free';

  const messages = [
    {
      type: 'session',
      data: {
        action,
        parkingLotId: spot.parkingLot.toString(),
        parkingSpotId: spot._id.toString(),
      },
    },
    {
      type: 'spot',
      data: {
        id: spot._id.toString(),
        parkingLotId: spot.parkingLot.toString(),
        status,
      },
    },
  ];

  const payload = { messages };

  console.log('[lora-simulator] Sending update messages:', messages);

  const response = await fetch(LORA_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const responseBody = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(responseBody?.message || `Request failed with status ${response.status}`);
  }

  console.log('[lora-simulator] Sent related update payload:', {
    spotId: spot._id.toString(),
    parkingLotId: spot.parkingLot.toString(),
    status,
    sessionAction: action,
  });
};

const startSimulator = async () => {
  await connectDB();

  const runCycle = async () => {
    try {
      await sendSpotAndSessionUpdate();
    } catch (error) {
      console.error('[lora-simulator] Error sending update:', error.message);
    }
  };

  await runCycle();
  setInterval(runCycle, INTERVAL_MS);
};

startSimulator().catch((error) => {
  console.error('[lora-simulator] Fatal error:', error.message);
  process.exit(1);
});

