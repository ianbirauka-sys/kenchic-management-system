const db = require('../config/db');

const Stock = {
  async getAll() {
    const [rows] = await db.query(
      `SELECT p.id, p.name, p.category, p.stock_quantity, p.price
       FROM products p ORDER BY p.name`
    );
    return rows;
  },

  async update(product_id, quantity) {
    await db.query(
      'UPDATE products SET stock_quantity = ? WHERE id = ?',
      [quantity, product_id]
    );
  },

  async getLowStock(threshold = 10) {
    const [rows] = await db.query(
      'SELECT * FROM products WHERE stock_quantity <= ?',
      [threshold]
    );
    return rows;
  },
};

module.exports = Stock;