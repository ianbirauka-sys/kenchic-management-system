const express = require('express');
const router = express.Router();
const {
  getAllOrders, updateOrderStatus,
  getStock, updateStock,
  getDeliveries, createDelivery,
  getReports,
  addProduct
} = require('../controllers/employee.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

// All employee routes require auth + employee role
router.use(authMiddleware, roleMiddleware('employee'));

// Orders
router.get('/orders', getAllOrders);
router.patch('/orders/:id/status', updateOrderStatus);

// Stock
router.get('/stock', getStock);
router.patch('/stock/:id', updateStock);

// Deliveries
router.get('/deliveries', getDeliveries);
router.post('/deliveries', createDelivery);

// Reports
router.get('/reports', getReports);

// Products
router.post('/products', addProduct);

module.exports = router;