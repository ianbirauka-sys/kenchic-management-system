const express = require('express');
const router = express.Router();
const { getChicks, placeChickOrder, getMyOrders, getResources } = require('../controllers/farmer.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

// All farmer routes require auth + farmer role
router.use(authMiddleware, roleMiddleware('farmer'));

// GET /api/farmer/chicks
router.get('/chicks', getChicks);

// POST /api/farmer/orders
router.post('/orders', placeChickOrder);

// GET /api/farmer/orders
router.get('/orders', getMyOrders);

// GET /api/farmer/resources
router.get('/resources', getResources);

module.exports = router;