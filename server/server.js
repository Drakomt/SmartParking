const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const parkingRouter = require("./routes/parking");
const loraRouter = require("./routes/lora");
const authRouter = require("./routes/auth");
const parkingLotRouter = require("./routes/parkingLot");

app.get("/", (req, res) => {
  res.send("Hello Smart Parking");
});

app.use("/api/auth", authRouter);
app.use("/api/parkinglots", parkingLotRouter);
app.use("/parking", parkingRouter);
app.use("/lora", loraRouter);

app.listen(port, () => {
  console.log("Server listening to port: " + port);
});

