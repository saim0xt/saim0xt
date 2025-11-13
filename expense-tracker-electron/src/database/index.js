const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const { app } = require('electron');
const fs = require('fs');

class ExpenseDatabase {
  constructor() {
    this.db = null;
    this.isEncrypted = false;
  }

  initialize(userDataPath) {
    const dbPath = path.join(userDataPath || app.getPath('userData'), 'expenses.db');

    // Ensure directory exists
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.db = new Database(dbPath);

    // Enable WAL mode for better performance
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('cache_size = 10000');
    this.db.pragma('temp_store = MEMORY');

    this.createTables();
  }

  createTables() {
    // Categories table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        color TEXT NOT NULL,
        icon TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Expenses table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount REAL NOT NULL,
        category_id INTEGER NOT NULL,
        description TEXT,
        date DATE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
      )
    `);

    // Settings table for app configuration
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better query performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
      CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
      CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at);
    `);

    // Insert default categories if none exist
    this.insertDefaultCategories();
  }

  insertDefaultCategories() {
    const count = this.db.prepare('SELECT COUNT(*) as count FROM categories').get();

    if (count.count === 0) {
      const categories = [
        { name: 'Food & Dining', color: '#FF6B6B', icon: '🍔' },
        { name: 'Transportation', color: '#4ECDC4', icon: '🚗' },
        { name: 'Shopping', color: '#45B7D1', icon: '🛍️' },
        { name: 'Entertainment', color: '#FFA07A', icon: '🎮' },
        { name: 'Bills & Utilities', color: '#98D8C8', icon: '⚡' },
        { name: 'Healthcare', color: '#F7B731', icon: '🏥' },
        { name: 'Education', color: '#5F27CD', icon: '📚' },
        { name: 'Travel', color: '#00D2D3', icon: '✈️' },
        { name: 'Groceries', color: '#26DE81', icon: '🛒' },
        { name: 'Other', color: '#95A5A6', icon: '📌' }
      ];

      const stmt = this.db.prepare('INSERT INTO categories (name, color, icon) VALUES (?, ?, ?)');

      const insertMany = this.db.transaction((cats) => {
        for (const cat of cats) {
          stmt.run(cat.name, cat.color, cat.icon);
        }
      });

      insertMany(categories);
    }
  }

  // Category operations
  getCategories() {
    return this.db.prepare('SELECT * FROM categories ORDER BY name').all();
  }

  addCategory(name, color, icon) {
    const stmt = this.db.prepare('INSERT INTO categories (name, color, icon) VALUES (?, ?, ?)');
    return stmt.run(name, color, icon);
  }

  updateCategory(id, name, color, icon) {
    const stmt = this.db.prepare('UPDATE categories SET name = ?, color = ?, icon = ? WHERE id = ?');
    return stmt.run(name, color, icon, id);
  }

  deleteCategory(id) {
    const stmt = this.db.prepare('DELETE FROM categories WHERE id = ?');
    return stmt.run(id);
  }

  // Expense operations
  addExpense(amount, categoryId, description, date) {
    const stmt = this.db.prepare(`
      INSERT INTO expenses (amount, category_id, description, date)
      VALUES (?, ?, ?, ?)
    `);
    return stmt.run(amount, categoryId, description, date);
  }

  updateExpense(id, amount, categoryId, description, date) {
    const stmt = this.db.prepare(`
      UPDATE expenses
      SET amount = ?, category_id = ?, description = ?, date = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(amount, categoryId, description, date, id);
  }

  deleteExpense(id) {
    const stmt = this.db.prepare('DELETE FROM expenses WHERE id = ?');
    return stmt.run(id);
  }

  getExpenses(limit = 100, offset = 0) {
    return this.db.prepare(`
      SELECT
        e.id,
        e.amount,
        e.description,
        e.date,
        e.created_at,
        e.updated_at,
        c.id as category_id,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      ORDER BY e.date DESC, e.created_at DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);
  }

  getExpensesByDateRange(startDate, endDate) {
    return this.db.prepare(`
      SELECT
        e.id,
        e.amount,
        e.description,
        e.date,
        e.created_at,
        c.id as category_id,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      WHERE e.date BETWEEN ? AND ?
      ORDER BY e.date DESC, e.created_at DESC
    `).all(startDate, endDate);
  }

  getExpensesByCategory(categoryId) {
    return this.db.prepare(`
      SELECT
        e.id,
        e.amount,
        e.description,
        e.date,
        e.created_at,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      WHERE e.category_id = ?
      ORDER BY e.date DESC
    `).all(categoryId);
  }

  searchExpenses(query) {
    return this.db.prepare(`
      SELECT
        e.id,
        e.amount,
        e.description,
        e.date,
        e.created_at,
        c.id as category_id,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      WHERE e.description LIKE ? OR c.name LIKE ?
      ORDER BY e.date DESC
      LIMIT 50
    `).all(`%${query}%`, `%${query}%`);
  }

  // Analytics
  getTotalByCategory(startDate, endDate) {
    return this.db.prepare(`
      SELECT
        c.id,
        c.name,
        c.color,
        c.icon,
        SUM(e.amount) as total,
        COUNT(e.id) as count
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      WHERE e.date BETWEEN ? AND ?
      GROUP BY c.id, c.name, c.color, c.icon
      ORDER BY total DESC
    `).all(startDate, endDate);
  }

  getDailyTotal(startDate, endDate) {
    return this.db.prepare(`
      SELECT
        date,
        SUM(amount) as total,
        COUNT(id) as count
      FROM expenses
      WHERE date BETWEEN ? AND ?
      GROUP BY date
      ORDER BY date ASC
    `).all(startDate, endDate);
  }

  getMonthlyTotal(year) {
    return this.db.prepare(`
      SELECT
        strftime('%m', date) as month,
        SUM(amount) as total,
        COUNT(id) as count
      FROM expenses
      WHERE strftime('%Y', date) = ?
      GROUP BY month
      ORDER BY month ASC
    `).all(year.toString());
  }

  getTotalExpenses(startDate, endDate) {
    const result = this.db.prepare(`
      SELECT
        SUM(amount) as total,
        COUNT(id) as count,
        AVG(amount) as average
      FROM expenses
      WHERE date BETWEEN ? AND ?
    `).get(startDate, endDate);

    return {
      total: result.total || 0,
      count: result.count || 0,
      average: result.average || 0
    };
  }

  // Bulk operations for import
  bulkInsertExpenses(expenses) {
    const stmt = this.db.prepare(`
      INSERT INTO expenses (amount, category_id, description, date)
      VALUES (?, ?, ?, ?)
    `);

    const insertMany = this.db.transaction((items) => {
      for (const item of items) {
        stmt.run(item.amount, item.categoryId, item.description, item.date);
      }
    });

    return insertMany(expenses);
  }

  // Export all data
  exportAllData() {
    const expenses = this.getExpenses(100000); // Get all expenses
    const categories = this.getCategories();

    return {
      expenses,
      categories,
      exportDate: new Date().toISOString()
    };
  }

  // Settings operations
  getSetting(key) {
    const result = this.db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    return result ? result.value : null;
  }

  setSetting(key, value) {
    const stmt = this.db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
    `);
    return stmt.run(key, value, value);
  }

  // Database maintenance
  vacuum() {
    this.db.exec('VACUUM');
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = new ExpenseDatabase();
