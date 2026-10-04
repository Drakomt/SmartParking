import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import connectDB from './config/db.js';
import { validatePayPalConfig } from './config/paypal.js';
import { validateCheckoutConfig } from './config/checkout.js';
import { createCorsOriginValidator } from './config/cors.js';
import { initializeSocketServer } from './services/socketService.js';
import healthRouter from './routes/health.js';
import loraRouter from './routes/lora.js';
import authRouter from './routes/auth.js';
import parkingRouter from './routes/parking.js';
import dbSetupRouter from './routes/dbSetup.js';
import paypalRouter from './routes/paypal.js';

dotenv.config();

try {
  validatePayPalConfig();
  validateCheckoutConfig();
} catch (error) {
  console.error(`Server configuration error: ${error.message}`);
  process.exit(1);
}

await connectDB();

const app = express();
const port = process.env.PORT || 3000;
app.set('trust proxy', 1);

app.use('/health', healthRouter);

app.use(cors({
  origin: createCorsOriginValidator(),
  credentials: true,
}));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello Smart Parking");
});

app.use("/api/auth", authRouter);
app.use("/api/parking", parkingRouter);
app.use("/api/db", dbSetupRouter);
app.use("/api/paypal", paypalRouter);
app.use("/lora", loraRouter);

const server = createServer(app);
initializeSocketServer(server);

server.listen(port, () => {
  console.log("Server listening to port: " + port);
});

