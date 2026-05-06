const db = require('../config/db');

const Product = {
  async getAll() {
    const [rows] = await db.query('SELECT * FROM products WHERE is_active = 1');
    return rows;
  },

  async findById(id) {
    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async create({ name, description, price, category, stock_quantity, image_url }) {
    const [result] = await db.query(
      'INSERT INTO products (name, description, price, category, stock_quantity, image_url) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description, price, category, stock_quantity, image_url]
    );
    return result.insertId;
  },

  async updateStock(id, quantity) {
    await db.query('UPDATE products SET stock_quantity = ? WHERE id = ?', [quantity, id]);
  },

  async createProduct({ name, description, price, category, stock_quantity }) {
    const [result] = await db.execute(
      `INSERT INTO products (name, description, price, category, stock_quantity, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [name, description || null, price, category, stock_quantity]
    );
    const [rows] = await db.execute("SELECT * FROM products WHERE id = ?", [result.insertId]);
    return rows[0];
  },
};

module.exports = Product;