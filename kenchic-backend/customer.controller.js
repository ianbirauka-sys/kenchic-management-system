const Product = require('../models/product.model');
const Order = require('../models/order.model');
const { sendSuccess, sendError } = require('../utils/response.utils');

const getProducts = async (req, res) => {
  try {
    const products = await Product.getAll();
    return sendSuccess(res, products);
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

    if (!items || items.length === 0) {
      return sendError(res, 'Order must have at least one item');
    }

    const total_amount = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

    const order_id = await Order.create({
      user_id: req.user.id,
      total_amount,
      delivery_address,
      order_type: order_type || 'delivery',
    });

    await Order.addItems(order_id, items);

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

module.exports = { getProducts, getProductById, placeOrder, getMyOrders };