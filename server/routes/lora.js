import express from 'express';
const router = express.Router();
import loraService from '../services/loraServices.js';


router.post('/update-spot', async (req, res) => {
    try {
        const updatedSpot = await loraService.updateParkingSpot(req.body.data ?? req.body);
        return res.status(200).json(updatedSpot);
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