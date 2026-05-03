const db = require('../config/db');

const Order = {
  async create({ user_id, total_amount, delivery_address, order_type }) {
    const [result] = await db.query(
      'INSERT INTO orders (user_id, total_amount, delivery_address, order_type, status) VALUES (?, ?, ?, ?, ?)',
      [user_id, total_amount, delivery_address, order_type, 'pending']
    );
    return result.insertId;
  },

  async addItems(order_id, items) {
    for (const item of items) {
      await db.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
        [order_id, item.product_id, item.quantity, item.unit_price]
      );
    }
  },

  async findByUser(user_id) {
    const [rows] = await db.query(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [user_id]
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await db.query('SELECT * FROM orders WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async getAll() {
    const [rows] = await db.query(
      `SELECT o.*, u.name as customer_name, u.email as customer_email
       FROM orders o JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC`
    );
    return rows;
  },

  async updateStatus(id, status) {
    await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
  },
};

module.exports = Order;