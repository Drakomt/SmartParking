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
import { buildSpotUpdatePayloads } from './parkingService.js';

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

    if (spot) {
        const { publicPayload, authorizedPayload } = buildSpotUpdatePayloads(parkingLot, spot);
        emitParkingSpotUpdate(parkingLot.city.name, publicPayload);
        await emitParkingSpotUpdateToAuthorizedUsers(parkingLot.city._id, authorizedPayload);
    }

    if (session) {
        const sessionPayload = {
            _id: session._id.toString(),
            carLicensePlate: session.carLicensePlate,
            parkingLot: parkingLot._id.toString(),
            parkingSpot: session.parkingSpot?.toString(),
            entryTime: session.entryTime,
            checkoutStatus: session.checkoutStatus,
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

const removeParkingSession = async ({ parkingLotId, parkingSessionId } = {}) => {
    let session;

    if (parkingSessionId) {
        session = await parkingSessionRepo.findSessionById(parkingSessionId);
        if (!session) {
            throw new Error('Parking session not found');
        }
        if (parkingLotId && session.parkingLot.toString() !== parkingLotId.toString()) {
            throw new Error('Parking session does not belong to the provided parking lot');
        }
    } else if (parkingLotId) {
        session = await parkingSessionRepo.findRandomSessionByLot(parkingLotId);
    } else {
        session = await parkingSessionRepo.findRandomSession();
    }

    if (!session) {
        throw new Error('No parking session available to remove');
    }

    const deletedSession = await parkingSessionRepo.deleteSession(session._id);
    if (!deletedSession) {
        throw new Error('Parking session not found');
    }
    const parkingLot = await parkingLotRepo.findLotById(deletedSession.parkingLot);

    await emitUpdate(parkingLot, null, deletedSession);

    return deletedSession;
};

const pickRandom = (items) => items[Math.floor(Math.random() * items.length)];

const simulateParkingActivity = async () => {
    const parkingLots = (await parkingLotRepo.findAllLotsWithCity()).filter((lot) => lot.city);
    if (!parkingLots.length) {
        throw new Error('No parking lots with a valid city are available');
    }

    const parkingLotIds = parkingLots.map((lot) => lot._id);
    const [spots, sessions] = await Promise.all([
        parkingSpotRepo.findSpotsByLots(parkingLotIds),
        parkingSessionRepo.findSessionsByLots(parkingLotIds),
    ]);
    const actionableSpots = spots.filter(
        (spot) => spot.status === 'free' || spot.status === 'occupied',
    );
    const spotsById = new Map(actionableSpots.map((spot) => [spot._id.toString(), spot]));
    const sessionSpotIds = new Set(sessions.map((session) => session.parkingSpot?.toString()));
    const entryCandidates = actionableSpots.filter(
        (spot) => spot.status === 'free' && !sessionSpotIds.has(spot._id.toString()),
    );
    const exitCandidates = sessions.flatMap((session) => {
        const spot = spotsById.get(session.parkingSpot?.toString());
        if (
            !spot
            || spot.status !== 'occupied'
            || spot.parkingLot.toString() !== session.parkingLot.toString()
        ) {
            return [];
        }
        return [{ session, spot }];
    });

    if (!entryCandidates.length && !exitCandidates.length) {
        throw new Error('No consistent entry or exit candidates are available');
    }

    const action = !entryCandidates.length
        ? 'remove'
        : !exitCandidates.length
            ? 'create'
            : Math.random() < 0.5 ? 'create' : 'remove';
    const candidate = action === 'create'
        ? { spot: pickRandom(entryCandidates), session: null }
        : pickRandom(exitCandidates);
    const { spot, session } = candidate;
    const parkingLot = parkingLots.find(
        (lot) => lot._id.toString() === spot.parkingLot.toString(),
    );
    const nextStatus = action === 'create' ? 'occupied' : 'free';

    if (action === 'create') {
        await createParkingSession({
            parkingLotId: parkingLot._id,
            parkingSpotId: spot._id,
        });
    } else {
        await removeParkingSession({
            parkingLotId: parkingLot._id,
            parkingSessionId: session._id,
        });
    }
    await updateParkingSpot({ id: spot._id, status: nextStatus });

    return {
        action,
        parkingLot: {
            id: parkingLot._id.toString(),
            name: parkingLot.name,
        },
        spot: {
            id: spot._id.toString(),
            level: spot.level,
            spotNumber: spot.spotNumber,
            previousStatus: spot.status,
            status: nextStatus,
        },
    };
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
            return await removeParkingSession({
                parkingLotId: data.parkingLotId,
                parkingSessionId: data.parkingSessionId,
            });
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

export default { processLoraPayload, updateParkingSpot, simulateParkingActivity };
