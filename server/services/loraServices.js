function getStatus(req,res){
    const {data}= req.body
    //enter to database
    console.log(data);
    res.status(200).json({"messege":"HELLO"})
}

exports.getStatus=getStatus;