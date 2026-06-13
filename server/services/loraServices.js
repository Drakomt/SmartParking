const getStatus = async (req, res) => {
    const {data} = req.body;
    //enter to database
    console.log(data);
    res.status(200).json({"message": "HELLO"});
};

export default { getStatus };