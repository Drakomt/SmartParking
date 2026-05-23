const express = require('express');
const router = express.Router();
const authService = require('../services/authService');

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const userData = await authService.loginUser(email, password);
    res.json(userData);
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
});

router.post('/register', async (req, res) => {
  try {
    const userData = await authService.registerUser(req.body);
    res.status(201).json(userData);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;

