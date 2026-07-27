import express from 'express';
const router = express.Router();
import loraService from '../services/loraServices.js';


router.post('/update-spot', async (req, res) => {
    try {
        const payload = req.body.data ?? req.body;
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

export default router;