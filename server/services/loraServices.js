import parkingSpotRepo from '../repositories/parkingSpotRepo.js';
import parkingLotRepo from '../repositories/parkingLotRepo.js';
import { emitParkingSpotUpdate } from './socketService.js';

const updateParkingSpot = async (spotData) => {
    const spotId = spotData?.id || spotData?.spotId;
    const { status } = spotData || {};

    if (!spotId || !status) {
        throw new Error('id and status are required');
    }

    if (!['free', 'occupied'].includes(status)) {
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

    try {
        emitParkingSpotUpdate(parkingLot.city.name, {
            parkingLot: {
                id: parkingLot._id.toString(),
                name: parkingLot.name,
            },
            city: {
                id: parkingLot.city._id.toString(),
                name: parkingLot.city.name,
            },
            spot: {
                id: updatedSpot._id.toString(),
                status: updatedSpot.status,
            },
        });
    } catch (error) {
        console.error('[socket] Failed to emit parking spot update:', error.message);
    }

    return updatedSpot;
};

export default { updateParkingSpot };