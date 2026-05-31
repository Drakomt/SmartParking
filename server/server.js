import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

import loraRouter from './routes/lora.js';
import authRouter from './routes/auth.js';
import parkingRouter from './routes/parking.js';

app.get("/", (req, res) => {
  res.send("Hello Smart Parking");
});

app.use("/api/auth", authRouter);
app.use("/api/parking", parkingRouter);
app.use("/lora", loraRouter);

app.listen(port, () => {
  console.log("Server listening to port: " + port);
});

