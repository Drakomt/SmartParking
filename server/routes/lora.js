import express from 'express';
const router = express.Router();
import loraService from '../services/loraServices.js';
import { requireLoraApiKey } from '../middleware/loraAuth.js';


router.post('/update-spot', requireLoraApiKey, async (req, res) => {
    try {
        res.setHeader('Cache-Control', 'no-store');
        const payload = req.body;
        const result = await loraService.processLoraPayload(payload);
        return res.status(200).json(result);
    } catch (error) {
        const statusCode = error.message.includes('required') || error.message.includes('Invalid')
            ? 400
            : error.message.includes('not found')
                ? 404
                : 500;

        return res.status(statusCode).json({ message: error.message });
    }
});

router.post('/simulate', requireLoraApiKey, async (req, res) => {
    try {
        res.setHeader('Cache-Control', 'no-store');
        const result = await loraService.simulateParkingActivity();
        return res.status(200).json(result);
    } catch (error) {
        const statusCode = error.message.includes('No consistent') || error.message.includes('No parking lots')
            ? 409
            : error.message.includes('not found')
                ? 404
                : 500;
        return res.status(statusCode).json({ message: error.message });
    }
});

export default router;
