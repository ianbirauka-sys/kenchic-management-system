const Product = require('../models/product.model');
const Order = require('../models/order.model');
const { sendSuccess, sendError } = require('../utils/response.utils');

const getChicks = async (req, res) => {
  try {
    const [rows] = await require('../config/db').query(
      "SELECT * FROM products WHERE category = 'chicks' AND is_active = 1"
    );
    return sendSuccess(res, rows);
  } catch (err) {
    return sendError(res, 'Failed to fetch chick catalog', 500);
  }
};

const placeChickOrder = async (req, res) => {
  try {
    const { items, delivery_address, order_type } = req.body;

    if (!items || items.length === 0) {
      return sendError(res, 'Order must have at least one item');
    }

    if (!['delivery', 'pickup'].includes(order_type)) {
      return sendError(res, 'order_type must be delivery or pickup');
    }

    const total_amount = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

    const order_id = await Order.create({
      user_id: req.user.id,
      total_amount,
      delivery_address: order_type === 'pickup' ? null : delivery_address,
      order_type,
    });

    await Order.addItems(order_id, items);

    return sendSuccess(res, { order_id, total_amount }, 'Chick order placed successfully', 201);
  } catch (err) {
    console.error('Farmer order error:', err);
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

const getResources = async (req, res) => {
  // Static resources/guides for now — can be made dynamic later
  const resources = [
    { id: 1, title: 'Broiler Rearing Guide', description: 'Step by step guide on raising broilers', file_url: '/resources/broiler-guide.pdf' },
    { id: 2, title: 'Layer Management Tips', description: 'Best practices for layer flock management', file_url: '/resources/layer-tips.pdf' },
    { id: 3, title: 'Disease Prevention', description: 'Common poultry diseases and how to prevent them', file_url: '/resources/disease-prevention.pdf' },
  ];
  return sendSuccess(res, resources);
};

module.exports = { getChicks, placeChickOrder, getMyOrders, getResources };