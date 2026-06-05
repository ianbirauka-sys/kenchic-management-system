const Product = require('../models/product.model');
const Order = require('../models/order.model');
const { sendSuccess, sendError } = require('../utils/response.utils');

const getProducts = async (req, res) => {
  try {
    const products = await Product.getAll();
    const visibleProducts = products.filter((product) => product.category !== 'feed');
    return sendSuccess(res, visibleProducts);
  } catch (err) {
    return sendError(res, 'Failed to fetch products', 500);
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return sendError(res, 'Product not found', 404);
    return sendSuccess(res, product);
  } catch (err) {
    return sendError(res, 'Failed to fetch product', 500);
  }
};

const placeOrder = async (req, res) => {
  try {
    const { items, delivery_address, order_type } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return sendError(res, 'Order must have at least one item');
    }

    const normalizedItems = items.map((item) => ({
      product_id: Number(item.product_id),
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
    }));

    const invalidItem = normalizedItems.find((item) => !item.product_id || item.quantity <= 0 || item.unit_price <= 0);
    if (invalidItem) {
      return sendError(res, 'Each order item must include a valid product, quantity and unit price');
    }

    const productMap = {};
    for (const item of normalizedItems) {
      const product = await Product.findById(item.product_id);
      if (!product) {
        return sendError(res, `Product not found: ${item.product_id}`, 404);
      }
      if (product.stock_quantity < item.quantity) {
        return sendError(res, `Insufficient stock for ${product.name}`, 400);
      }
      productMap[item.product_id] = product;
    }

    const total_amount = normalizedItems.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0
    );

    const order_id = await Order.create({
      user_id: req.user.id,
      total_amount,
      delivery_address,
      order_type: order_type || 'delivery',
    });

    await Order.addItems(order_id, normalizedItems);

    for (const item of normalizedItems) {
      const product = productMap[item.product_id];
      await Product.updateStock(product.id, product.stock_quantity - item.quantity);
    }

    return sendSuccess(res, { order_id, total_amount }, 'Order placed successfully', 201);
  } catch (err) {
    console.error('Place order error:', err);
    return sendError(res, 'Failed to place order', 500);
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.findByUser(req.user.id);
    return sendSuccess(res, orders);
  } catch (err) {
    return sendError(res, 'Failed to fetch orders', 500);
  }
};

const submitInquiry = async (req, res) => {
  try {
    const { name, email, phone, inquiry_type, order_id, message } = req.body;
    if (!name || !email || !message || !inquiry_type) {
      return res.status(400).json({ success: false, message: "name, email, inquiry_type, and message are required." });
    }
    // Store in DB — requires an `inquiries` table (schema below)
    const db = require("../config/db");
    const [result] = await db.execute(
      `INSERT INTO inquiries (name, email, phone, inquiry_type, order_id, message, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'open', NOW())`,
      [name, email, phone || null, inquiry_type, order_id || null, message]
    );
    return res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (err) {
    console.error("submitInquiry error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getProducts, getProductById, placeOrder, getMyOrders, submitInquiry };