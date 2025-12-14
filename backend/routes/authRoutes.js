// backend/routes/authRoutes.js
const express = require('express');
const { signup, login } = require('../controllers/authController');

const router = express.Router();

/* SIGNUP */
router.post('/signup', signup);

/* LOGIN */
router.post('/login', login);

module.exports = router;

