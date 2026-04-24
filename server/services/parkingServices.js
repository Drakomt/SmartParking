const parkingData=require('../example.json');
function getParkingsByCity(req,res){
    const city= req.query.city;
    parkingArr=parkingData.data;
    parkingArr.filter(i => {i.city==city});
    res.json(parkingArr)
}
exports.getParkingsByCity = getParkingsByCity;
