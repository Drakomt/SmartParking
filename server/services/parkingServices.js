const parkingData = require("../db.json");
function getLotsByCity(req, res) {
  const city = req.query.city;
  let lotsArr = parkingData;

  lotsArr = lotsArr.filter((i) => i.city === city);

  if (lotsArr.length === 0) {
    res
      .status(404)
      .json({ message: "No parking lots found in the specified city" });
    return;
  }

  res.status(200).json(lotsArr);
}

function getParkingsByName(req, res) {
  const name = req.query.name;
  let parking = parkingData;

  parking = parking.find((i) => i.name === name);

  if (!parking) {
    res.status(404).json({ message: "Parking not found" });
    return;
  }

  res.status(200).json(parking);
}

exports.getLotsByCity = getLotsByCity;
exports.getParkingsByName = getParkingsByName;
