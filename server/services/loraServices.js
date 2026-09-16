import parkingSpotRepo from '../repositories/parkingSpotRepo.js';
import parkingLotRepo from '../repositories/parkingLotRepo.js';
import parkingSessionRepo from '../repositories/parkingSessionRepo.js';
import {
    emitParkingSpotUpdate,
    emitParkingSpotUpdateToAuthorizedUsers,
    emitParkingSessionUpdateToAuthorizedUsers,
} from './socketService.js';
import { createCheckoutCredentials } from '../utils/checkoutCredentials.js';
import { isAuthorizedVehicle, normalizeLicensePlate } from '../utils/licensePlate.js';

const generateLicensePlate = async () => {
    const digits = '0123456789';

    const makePlate = () => {
        return Array.from({ length: 8 }, () => digits[Math.floor(Math.random() * digits.length)]).join('');
    };

    let plate = makePlate();
    let existing = await parkingSessionRepo.findByLicensePlate(plate);
    while (existing) {
        plate = makePlate();
        existing = await parkingSessionRepo.findByLicensePlate(plate);
    }

    return plate;
};

const emitUpdate = async (parkingLot, spot, session) => {
    if (!parkingLot || !parkingLot.city) {
        return;
    }

    const payload = {
        parkingLot: {
            id: parkingLot._id.toString(),
            name: parkingLot.name,
        },
        city: {
            id: parkingLot.city._id.toString(),
            name: parkingLot.city.name,
        },
    };

    if (spot) {
        payload.spot = {
            id: spot._id.toString(),
            status: spot.status,
        };
        emitParkingSpotUpdate(parkingLot.city.name, payload);
        await emitParkingSpotUpdateToAuthorizedUsers(parkingLot.city._id, payload);
    }

    if (session) {
        const sessionPayload = {
            ...payload,
            session: {
                id: session._id.toString(),
                carLicensePlate: session.carLicensePlate,
                parkingSpot: session.parkingSpot,
                entryTime: session.entryTime,
                checkoutStatus: session.checkoutStatus,
            },
        };
        await emitParkingSessionUpdateToAuthorizedUsers(parkingLot.city._id, sessionPayload);
    }
};

const updateParkingSpot = async (spotData) => {
    const spotId = spotData?.id || spotData?.spotId;
    const { status } = spotData || {};

    if (!spotId || !status) {
        throw new Error('id and status are required');
    }

    if (!['free', 'occupied', 'block'].includes(status)) {
        throw new Error('Invalid parking spot status');
    }

    const existingSpot = await parkingSpotRepo.findSpotById(spotId);
    if (!existingSpot) {
        throw new Error('Parking spot not found');
    }

    const parkingLot = await parkingLotRepo.findLotById(existingSpot.parkingLot);
    if (!parkingLot || !parkingLot.city) {
        throw new Error('Parking lot city not found');
    }

    const updatedSpot = await parkingSpotRepo.updateSpot(spotId, {
        status,
    });

    await emitUpdate(parkingLot, updatedSpot, null);

    return updatedSpot;
};

export const createParkingSession = async ({ parkingLotId, parkingSpotId, carLicensePlate: providedPlate }) => {
    if (!parkingLotId || !parkingSpotId) {
        throw new Error('parkingLotId and parkingSpotId are required for session creation');
    }

    const parkingLot = await parkingLotRepo.findLotForEntry(parkingLotId);
    if (!parkingLot) {
        throw new Error('Parking lot not found');
    }

    const parkingSpot = await parkingSpotRepo.findSpotById(parkingSpotId);
    if (!parkingSpot) {
        throw new Error('Parking spot not found');
    }

    if (parkingSpot.parkingLot.toString() !== parkingLot._id.toString()) {
        throw new Error('Parking spot does not belong to the provided parking lot');
    }

    if (providedPlate !== undefined && (
        typeof providedPlate !== 'string' || normalizeLicensePlate(providedPlate) === ''
    )) {
        throw new Error('Invalid carLicensePlate');
    }
    const carLicensePlate = providedPlate === undefined
        ? await generateLicensePlate() : normalizeLicensePlate(providedPlate);
    if (providedPlate !== undefined && await parkingSessionRepo.findByLicensePlate(carLicensePlate)) {
        throw new Error('Invalid session: vehicle already has an active parking session');
    }
    const checkoutCredentials = createCheckoutCredentials();
    const session = await parkingSessionRepo.createSession({
        carLicensePlate,
        parkingLot: parkingLot._id,
        parkingSpot: parkingSpot._id,
        checkoutId: checkoutCredentials.checkoutId,
        checkoutTokenHash: checkoutCredentials.checkoutTokenHash,
        checkoutExpiresAt: checkoutCredentials.checkoutExpiresAt,
        checkoutStatus: isAuthorizedVehicle(parkingLot, carLicensePlate) ? 'pass' : 'Payable',
    });

    await emitUpdate(parkingLot, null, session);

    return {
        session: {
            id: session._id.toString(),
            carLicensePlate: session.carLicensePlate,
            parkingLot: session.parkingLot,
            parkingSpot: session.parkingSpot,
            entryTime: session.entryTime,
            checkoutStatus: session.checkoutStatus,
        },
        checkout: {
            checkoutId: checkoutCredentials.checkoutId,
            checkoutToken: checkoutCredentials.checkoutToken,
            expiresAt: checkoutCredentials.checkoutExpiresAt,
        },
    };
};

const removeRandomParkingSession = async ({ parkingLotId } = {}) => {
    let session;

    if (parkingLotId) {
        session = await parkingSessionRepo.findRandomSessionByLot(parkingLotId);
    } else {
        session = await parkingSessionRepo.findRandomSession();
    }

    if (!session) {
        throw new Error('No parking session available to remove');
    }

    const deletedSession = await parkingSessionRepo.deleteSession(session._id);
    const parkingLot = await parkingLotRepo.findLotById(deletedSession.parkingLot);

    await emitUpdate(parkingLot, null, deletedSession);

    return deletedSession;
};

const processMessage = async (message) => {
    if (!message || typeof message !== 'object') {
        throw new Error('Message payload is invalid');
    }

    const type = message.type || 'spot';
    const data = message.data || message;

    if (type === 'session') {
        const action = data.action;
        if (action === 'create') {
            return await createParkingSession({
                parkingLotId: data.parkingLotId,
                parkingSpotId: data.parkingSpotId,
                carLicensePlate: data.carLicensePlate,
            });
        }

        if (action === 'remove') {
            return await removeRandomParkingSession({ parkingLotId: data.parkingLotId });
        }

        throw new Error('Invalid parking session action');
    }

    return await updateParkingSpot(data);
};

const processLoraPayload = async (payload) => {
    if (Array.isArray(payload.messages)) {
        const results = [];
        for (const message of payload.messages) {
            results.push(await processMessage(message));
        }
        return results;
    }
    return await processMessage(payload);
};

export default { processLoraPayload, updateParkingSpot };
