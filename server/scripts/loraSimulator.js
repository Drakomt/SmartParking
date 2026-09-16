import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

dotenv.config({
  path: fileURLToPath(new URL('../.env', import.meta.url)),
  quiet: true,
});

const DEFAULT_LOCAL_SERVER_URL = 'http://localhost:3000';
const DEFAULT_PRODUCTION_SERVER_URL = 'https://smartparking-il-api.onrender.com';
const TARGET_ALIASES = {
  local: 'local',
  development: 'local',
  dev: 'local',
  production: 'production',
  prod: 'production',
};

const targetArgument = process.argv.find((argument) => argument.startsWith('--target='));
const requestedTarget = targetArgument?.split('=', 2)[1]
  || process.env.LORA_SIMULATOR_TARGET
  || 'local';
const SIMULATOR_TARGET = TARGET_ALIASES[requestedTarget.toLowerCase()];

const toSimulatorEndpoint = (serverUrl) => {
  let url;
  try {
    url = new URL(serverUrl);
  } catch {
    throw new Error(`Invalid LoRa simulator server URL: ${serverUrl}`);
  }

  const path = url.pathname.replace(/\/+$/, '');
  if (path.endsWith('/lora/update-spot')) {
    url.pathname = path.replace(/\/update-spot$/, '/simulate');
  } else if (!path.endsWith('/lora/simulate')) {
    url.pathname = `${path}/lora/simulate`;
  }
  url.search = '';
  url.hash = '';
  return url.toString();
};

const getTargetConfiguration = () => {
  if (!SIMULATOR_TARGET) {
    throw new Error('Invalid target. Use --target=local or --target=production');
  }

  if (SIMULATOR_TARGET === 'production') {
    return {
      apiKey: process.env.LORA_PRODUCTION_API_KEY || process.env.LORA_API_KEY,
      endpoint: toSimulatorEndpoint(
        process.env.LORA_PRODUCTION_SERVER_URL
          || process.env.LORA_SIMULATOR_ENDPOINT_URL
          || process.env.LORA_ENDPOINT_URL
          || DEFAULT_PRODUCTION_SERVER_URL,
      ),
    };
  }

  return {
    apiKey: process.env.LORA_LOCAL_API_KEY || process.env.LORA_API_KEY,
    endpoint: toSimulatorEndpoint(
      process.env.LORA_LOCAL_SERVER_URL || DEFAULT_LOCAL_SERVER_URL,
    ),
  };
};

let targetConfiguration;
const INTERVAL_MS = Number(process.env.LORA_SIMULATOR_INTERVAL_MS || 1000);

const sendSpotAndSessionUpdate = async () => {
  const response = await fetch(targetConfiguration.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': targetConfiguration.apiKey,
    },
    body: '{}',
  });

  const responseBody = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(responseBody?.message || `Request failed with status ${response.status}`);
  }

  console.log(
    `[lora-simulator] ${responseBody.parkingLot.name} | level ${responseBody.spot.level}, spot ${responseBody.spot.spotNumber}: ${responseBody.spot.previousStatus} -> ${responseBody.spot.status} (${responseBody.action})`,
  );
};

const startSimulator = async () => {
  targetConfiguration = getTargetConfiguration();

  if (!targetConfiguration.apiKey) {
    const keyName = SIMULATOR_TARGET === 'production'
      ? 'LORA_PRODUCTION_API_KEY or LORA_API_KEY'
      : 'LORA_LOCAL_API_KEY or LORA_API_KEY';
    throw new Error(`${keyName} is required to run the LoRa simulator`);
  }

  if (!Number.isFinite(INTERVAL_MS) || INTERVAL_MS < 250) {
    throw new Error('LORA_SIMULATOR_INTERVAL_MS must be a number of at least 250');
  }

  console.log(`[lora-simulator] Mode: ${SIMULATOR_TARGET.toUpperCase()}`);
  console.log(`[lora-simulator] Target: ${targetConfiguration.endpoint}`);
  if (SIMULATOR_TARGET === 'production') {
    console.log('[lora-simulator] WARNING: production parking data will be changed.');
  }
  console.log(`[lora-simulator] Interval: ${INTERVAL_MS}ms. Press Ctrl+C to stop.`);

  const runCycle = async () => {
    try {
      await sendSpotAndSessionUpdate();
    } catch (error) {
      console.error('[lora-simulator] Error sending update:', error.message);
    }
  };

  const scheduleNextCycle = async () => {
    await runCycle();
    setTimeout(scheduleNextCycle, INTERVAL_MS);
  };

  await scheduleNextCycle();
};

startSimulator().catch((error) => {
  console.error('[lora-simulator] Fatal error:', error.message);
  process.exit(1);
});

