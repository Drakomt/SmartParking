const express= require('express')
const app = express();
const port =3000;
app.use(express.json())

app.get('/',(req,res)=>{
    res.send("Hello Smart Parking")
})
app.get('/parking/city',(req,res)=>{
    const city= req.query.city;
    parkingArr=[{parkingName:"aaa", spot:"1",status:"occupied"},{parkingName:"aaa", spot:"2",status:"free"}]
    res.json(parkingArr)
})
app.post('/lora/status',(req,res)=>{
    const {data}= req.body
    //enter to database
    console.log(data);
    res.status(200).json({"messege":"HELLO"})
})

app.listen(port,()=>{
    console.log("Server listening to port: " +port)
})