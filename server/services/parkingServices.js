function getCity(req,res){
    const city= req.query.city;
    parkingArr=[{parkingName:"aaa", spot:"1",status:"occupied"},{parkingName:"aaa", spot:"2",status:"free"}]
    res.json(parkingArr)
}
exports.getCity=getCity;
