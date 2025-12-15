const rateLimit = require('express-rate-limit');

const qrScanLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Too many scan attempts. Please wait.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts. Please try again later.' }
});

module.exports = { qrScanLimiter, authLimiter };