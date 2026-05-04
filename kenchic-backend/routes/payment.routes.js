const express = require('express');
const router = express.Router();
const { initiatePayment, mpesaCallback, checkPaymentStatus } = require('../controllers/payment.controller');
const authMiddleware = require('../middleware/auth.middleware');

// POST /api/payments/initiate  (protected — customer or farmer)
router.post('/initiate', authMiddleware, initiatePayment);

// GET /api/payments/status/:checkout_request_id  (protected)
router.get('/status/:checkout_request_id', authMiddleware, checkPaymentStatus);

// POST /api/payments/callback  (public — called by Safaricom)
router.post('/callback', mpesaCallback);

module.exports = router;
