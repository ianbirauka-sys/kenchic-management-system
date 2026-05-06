const express = require('express');
const router = express.Router();
const { getProducts, getProductById, placeOrder, getMyOrders, submitInquiry } = require('../controllers/customer.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

// Public routes (no auth required)
router.post('/inquiries', submitInquiry);

// All customer routes require auth + customer role
router.use(authMiddleware, roleMiddleware('customer'));

// GET /api/customer/products
router.get('/products', getProducts);

// GET /api/customer/products/:id
router.get('/products/:id', getProductById);

// POST /api/customer/orders
router.post('/orders', placeOrder);

// GET /api/customer/orders
router.get('/orders', getMyOrders);

module.exports = router;