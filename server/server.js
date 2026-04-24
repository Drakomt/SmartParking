const express= require('express')
const app = express();
const port =3000;
app.use(express.json())

const parkingRouter = require('./routes/parking');
const loraRouter = require('./routes/lora');

app.get('/',(req,res)=>{
    res.send("Hello Smart Parking")
})
app.use("/parking",parkingRouter);
app.use("/lora",loraRouter);

app.listen(port,()=>{
    console.log("Server listening to port: " +port)
})