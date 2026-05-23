const ParkingLot = require('../models/ParkingLot');

const getParkingLots = async (req, res) => {
  try {
    let query = {};
    if (req.user && req.user.authorizedCity) {
      query.city = req.user.authorizedCity;
    }

    const parkingLots = await ParkingLot.find(query).populate('city', 'name');
    res.json(parkingLots);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};


const createParkingLot = async (req, res) => {
  try {
    const { name, city, address, totalSpots } = req.body;

    const parkingLot = new ParkingLot({
      name,
      city,
      address,
      totalSpots
    });

    const createdParkingLot = await parkingLot.save();
    res.status(201).json(createdParkingLot);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};


const updateParkingLot = async (req, res) => {
  try {
    const { totalSpots, name, address } = req.body;
    
    const parkingLot = await ParkingLot.findById(req.params.id);

    if (!parkingLot) {
      return res.status(404).json({ message: 'Parking Lot not found' });
    }

    if (req.user.authorizedCity && parkingLot.city.toString() !== req.user.authorizedCity.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this parking lot' });
    }

    if (totalSpots !== undefined) parkingLot.totalSpots = totalSpots;
    if (name !== undefined) parkingLot.name = name;
    if (address !== undefined) parkingLot.address = address;

    const updatedParkingLot = await parkingLot.save();
    res.json(updatedParkingLot);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};


const deleteParkingLot = async (req, res) => {
  try {
    const parkingLot = await ParkingLot.findById(req.params.id);

    if (!parkingLot) {
      return res.status(404).json({ message: 'Parking Lot not found' });
    }

    // Check authorization
    if (req.user.authorizedCity && parkingLot.city.toString() !== req.user.authorizedCity.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this parking lot' });
    }

    await parkingLot.deleteOne();
    res.json({ message: 'Parking Lot removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  getParkingLots,
  createParkingLot,
  updateParkingLot,
  deleteParkingLot
};
