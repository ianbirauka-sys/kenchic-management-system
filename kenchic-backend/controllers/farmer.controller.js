const Product = require('../models/product.model');
const Order = require('../models/order.model');
const { sendSuccess, sendError } = require('../utils/response.utils');

const getChicks = async (req, res) => {
  try {
    const [rows] = await require('../config/db').query(
      "SELECT * FROM products WHERE category IN ('chicks','feed') AND is_active = 1"
    );
    return sendSuccess(res, rows);
  } catch (err) {
    return sendError(res, 'Failed to fetch farm catalog', 500);
  }
};

const placeChickOrder = async (req, res) => {
  try {
    const { items, chick_id, quantity, delivery_address, order_type, delivery_type } = req.body;
    let orderItems = [];

    if (Array.isArray(items) && items.length > 0) {
      orderItems = items.map((item) => ({
        product_id: Number(item.product_id),
        quantity: Number(item.quantity),
      }));
    } else if (chick_id && quantity) {
      orderItems = [{
        product_id: Number(chick_id),
        quantity: Number(quantity),
      }];
    }

    if (orderItems.length === 0) {
      return sendError(res, 'Order must have at least one chick item');
    }

    const normalizedItems = orderItems.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: 0,
    }));

    const itemErrors = normalizedItems.find((item) => !item.product_id || item.quantity <= 0);
    if (itemErrors) {
      return sendError(res, 'Each order item must include a valid chick product and quantity');
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
      item.unit_price = Number(product.price || 0);
    }

    const total_amount = normalizedItems.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0
    );

    const order_id = await Order.create({
      user_id: req.user.id,
      total_amount,
      delivery_address: (order_type || delivery_type) === 'pickup' ? null : delivery_address,
      order_type: order_type || delivery_type || 'delivery',
    });

    await Order.addItems(order_id, normalizedItems);

    for (const item of normalizedItems) {
      const product = productMap[item.product_id];
      await Product.updateStock(product.id, product.stock_quantity - item.quantity);
    }

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
    {
      id: 1,
      title: 'Broiler Rearing Guide',
      description: 'Step by step guide on raising broilers',
      details: 'Practical advice for feeding, temperature control and flock management from day-old chicks through market age.',
      highlights: [
        'Maintain brooder temperature at 32–35°C during the first week.',
        'Feed high-quality starter feed for the first 4 weeks, then transition to grower feed.',
        'Keep the broiler house clean and dry to reduce disease risk.',
        'Monitor growth weekly and adjust feed volumes as the flock gains weight.',
      ],
    },
    {
      id: 2,
      title: 'Layer Management Tips',
      description: 'Best practices for layer flock management',
      details: 'Guidance for optimizing egg production, light management, nutrition and comfortable housing for layer birds.',
      highlights: [
        'Provide a balanced layer ration once birds start laying.',
        'Ensure good lighting schedules to support egg production.',
        'Use nest boxes and clean bedding to reduce cracked eggs.',
        'Track egg quality and adjust feed or environment when shell issues appear.',
      ],
    },
    {
      id: 3,
      title: 'Disease Prevention',
      description: 'Common poultry diseases and how to prevent them',
      details: 'Covers vaccinations, hygiene routines and early detection practices to protect your flock from outbreaks.',
      highlights: [
        'Vaccinate against Newcastle disease and Gumboro on schedule.',
        'Practice strict biosecurity by limiting farm visitors.',
        'Monitor flocks for signs of illness and isolate sick birds quickly.',
        'Disinfect equipment and footwear before entering the poultry house.',
      ],
    },
  ];
  return sendSuccess(res, resources);
};

module.exports = { getChicks, placeChickOrder, getMyOrders, getResources };