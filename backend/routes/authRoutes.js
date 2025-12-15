const express = require('express');
const router = express.Router();

const login = async (req, res) => {
  res.json({ 
    message: 'Login successful',
    token: 'dummy-token',
    role: 'student'
  });
};

const signup = async (req, res) => {
  res.json({ message: 'Signup successful' });
};

router.post('/login', login);
router.post('/signup', signup);

module.exports = router;