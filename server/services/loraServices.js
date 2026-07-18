import parkingSpotRepo from '../repositories/parkingSpotRepo.js';

const updateParkingSpot = async (spotData) => {
    const spotId = spotData?.id || spotData?.spotId;
    const { status } = spotData || {};

    if (!spotId || !status) {
        throw new Error('id and status are required');
    }

    if (!['free', 'occupied'].includes(status)) {
        throw new Error('Invalid parking spot status');
    }


    const updatedSpot = await parkingSpotRepo.updateSpot(spotId, {
        status,
    });

    if (!updatedSpot) {
        throw new Error('Parking spot not found');
    }

    return updatedSpot;
};

export default { updateParkingSpot };