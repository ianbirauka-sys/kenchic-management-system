const Order = require('../models/order.model');
const Stock = require('../models/stock.model');
const Delivery = require('../models/delivery.model');
const db = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response.utils');
const Product = require('../models/product.model');

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.getAll();
    return sendSuccess(res, orders);
  } catch (err) {
    return sendError(res, 'Failed to fetch orders', 500);
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return sendError(res, `Status must be one of: ${validStatuses.join(', ')}`);
    }
    await Order.updateStatus(req.params.id, status);
    return sendSuccess(res, null, 'Order status updated');
  } catch (err) {
    return sendError(res, 'Failed to update order status', 500);
  }
};

const getStock = async (req, res) => {
  try {
    const stock = await Stock.getAll();
    return sendSuccess(res, stock);
  } catch (err) {
    return sendError(res, 'Failed to fetch stock', 500);
  }
};

const updateStock = async (req, res) => {
  try {
    const { quantity } = req.body;
    if (quantity === undefined || quantity < 0) {
      return sendError(res, 'Valid quantity is required');
    }
    await Stock.update(req.params.id, quantity);
    return sendSuccess(res, null, 'Stock updated successfully');
  } catch (err) {
    return sendError(res, 'Failed to update stock', 500);
  }
};

const getDeliveries = async (req, res) => {
  try {
    const deliveries = await Delivery.getAll();
    return sendSuccess(res, deliveries);
  } catch (err) {
    return sendError(res, 'Failed to fetch deliveries', 500);
  }
};

const createDelivery = async (req, res) => {
  try {
    const { order_id, scheduled_date, driver_name } = req.body;
    const id = await Delivery.create({ order_id, scheduled_date, driver_name });
    return sendSuccess(res, { id }, 'Delivery scheduled', 201);
  } catch (err) {
    return sendError(res, 'Failed to schedule delivery', 500);
  }
};

const getReports = async (req, res) => {
  try {
    const [salesByDay] = await db.query(
      `SELECT DATE(created_at) as date, COUNT(*) as total_orders, SUM(total_amount) as revenue
       FROM orders WHERE status != 'cancelled'
       GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 30`
    );

    const [stockLevels] = await db.query(
      'SELECT name, category, stock_quantity FROM products ORDER BY stock_quantity ASC'
    );

    return sendSuccess(res, { salesByDay, stockLevels });
  } catch (err) {
    return sendError(res, 'Failed to fetch reports', 500);
  }
};

const addProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock_quantity } = req.body;
    if (!name || !price || stock_quantity === undefined || !category) {
      return res.status(400).json({ success: false, message: "name, price, category, and stock_quantity are required." });
    }
    const product = await Product.createProduct({ name, description, price, category, stock_quantity });
    return res.status(201).json({ success: true, data: product });
  } catch (err) {
    console.error("addProduct error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getAllOrders, updateOrderStatus, getStock, updateStock, getDeliveries, createDelivery, getReports, addProduct };