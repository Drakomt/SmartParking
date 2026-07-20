import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import parkingSpotRepo from '../repositories/parkingSpotRepo.js';

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

const sendSpotUpdate = async () => {
  const spots = await parkingSpotRepo.findAllSpots();

  if (!spots.length) {
    console.log('[lora-simulator] No parking spots found. Waiting for data...');
    return;
  }

  const spot = pickRandomSpot(spots);
  const status = getRandomStatus(spot.status);

  const payload = {
    data: {
      id: spot._id.toString(),
      parkingLotId: spot.parkingLot.toString(),
      status,
    },
  };

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

  console.log('[lora-simulator] Sent update:', {
    spotId: spot._id.toString(),
    parkingLotId: spot.parkingLot.toString(),
    status,
  });
};

const startSimulator = async () => {
  await connectDB();

  const runCycle = async () => {
    try {
      await sendSpotUpdate();
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