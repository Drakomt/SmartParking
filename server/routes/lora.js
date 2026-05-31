import express from 'express';
const router = express.Router();
import loraService from '../services/loraServices.js';


router.post('/status', async (req, res) => {
    return await loraService.getStatus(req, res);
});

export default router;