import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'AzanMalik7860',
  database: process.env.DB_NAME || 'icare_db',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function ensureDatabaseExists() {
  const dbName = process.env.DB_NAME || 'icare_db';
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'AzanMalik7860',
    port: Number(process.env.DB_PORT) || 3306,
  });
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  await connection.end();
}

export async function initDB() {
  await ensureDatabaseExists();
  const connection = await pool.getConnection();
  try {
    // 1. Products table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price VARCHAR(100) NOT NULL,
        sale BOOLEAN DEFAULT FALSE,
        category VARCHAR(100) NOT NULL,
        subCategory VARCHAR(100) DEFAULT '',
        bestSeller BOOLEAN DEFAULT FALSE,
        costPrice VARCHAR(100) DEFAULT '0',
        supplierName VARCHAR(150) DEFAULT '',
        supplierContact VARCHAR(50) DEFAULT '',
        image LONGTEXT,
        images LONGTEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Categories table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        sub_categories JSON NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. Orders table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id BIGINT PRIMARY KEY,
        userName VARCHAR(255) NOT NULL,
        userEmail VARCHAR(255) DEFAULT '',
        userId INT DEFAULT NULL,
        phone VARCHAR(50) DEFAULT '',
        shippingAddress TEXT,
        productName TEXT NOT NULL,
        items JSON,
        price VARCHAR(100) NOT NULL,
        status VARCHAR(50) DEFAULT 'Pending',
        courier VARCHAR(100) DEFAULT '',
        trackingNumber VARCHAR(100) DEFAULT '',
        date VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. Store details table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS store_details (
        id INT PRIMARY KEY DEFAULT 1,
        address VARCHAR(255) NOT NULL,
        hours VARCHAR(100) NOT NULL,
        phone VARCHAR(100) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. Users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'customer',
        phone VARCHAR(50) DEFAULT '',
        address TEXT,
        city VARCHAR(100) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 6. OTP Codes table for Two-Factor Authentication and Password Reset
    await connection.query(`
      CREATE TABLE IF NOT EXISTS otp_codes (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        code VARCHAR(10) NOT NULL,
        action VARCHAR(50) NOT NULL,
        expires_at DATETIME NOT NULL,
        is_used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

        // 7. Expenses table for Smart E-Commerce Accounting (Option 1)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        date VARCHAR(50) NOT NULL,
        category VARCHAR(100) NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        paidFrom VARCHAR(50) NOT NULL DEFAULT 'Cash in Hand',
        supplierName VARCHAR(150) DEFAULT '',
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Seed Store Details if empty
    const [storeRows] = await connection.query('SELECT COUNT(*) as count FROM store_details');
    if (storeRows[0].count === 0) {
      await connection.query(
        'INSERT INTO store_details (id, address, hours, phone) VALUES (1, ?, ?, ?)',
        ['Kohinoor City', '10 AM - 10 PM', '+92 300 1234567']
      );
    }

    // Seed/Update Admin User with admin@icaregadget.store
    const targetAdminEmail = process.env.ADMIN_EMAIL || 'admin@icaregadget.store';
    const [adminRows] = await connection.query('SELECT * FROM users WHERE email = ? OR email = ? OR email = ?', [targetAdminEmail, 'admin@icaregadget.shop', 'admin']);
    if (adminRows.length === 0) {
      await connection.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Admin', targetAdminEmail, 'admin123', 'admin']
      );
    } else {
      // Migrate legacy usernames to admin@icaregadget.store
      await connection.query(
        'UPDATE users SET email = ? WHERE email = ? OR email = ?',
        [targetAdminEmail, 'admin', 'admin@icaregadget.shop']
      );
    }

    // Seed Categories if empty
    const [categoryRows] = await connection.query('SELECT COUNT(*) as count FROM categories');
    if (categoryRows[0].count === 0) {
      const defaultCategories = [
        { name: 'Mobiles', subCategories: ['Samsung', 'Apple', 'Google', 'OnePlus', 'Xiaomi'] },
        { name: 'Audio', subCategories: ['Headphones', 'Earbuds', 'Speakers', 'AirPods'] },
        { name: 'Accessories', subCategories: ['Mobile Accessories', 'Laptop Accessories', 'Chargers', 'Cables', 'Power Banks', 'Screen Protectors'] },
        { name: 'Smart Home', subCategories: [] },
        { name: 'Wearables', subCategories: [] },
      ];
      for (const cat of defaultCategories) {
        await connection.query(
          'INSERT INTO categories (name, sub_categories) VALUES (?, ?)',
          [cat.name, JSON.stringify(cat.subCategories)]
        );
      }
    }
    // Safe column migrations for existing databases
    const safeAddColumn = async (table, colName, colType) => {
      try {
        const [existing] = await connection.query(
          `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
          [table, colName]
        );
        if (existing.length === 0) {
          await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${colName}\` ${colType}`);
        }
      } catch (err) {
        // Silently skip if column exists or fails
      }
    };

    await safeAddColumn('users', 'phone', "VARCHAR(50) DEFAULT ''");
    await safeAddColumn('users', 'address', 'TEXT');
    await safeAddColumn('users', 'city', "VARCHAR(100) DEFAULT ''");
    await safeAddColumn('users', 'google_id', "VARCHAR(100) DEFAULT ''");
    await safeAddColumn('users', 'avatar', "TEXT");
    await safeAddColumn('users', 'auth_provider', "VARCHAR(50) DEFAULT 'local'");

    await safeAddColumn('orders', 'userEmail', "VARCHAR(255) DEFAULT ''");
    await safeAddColumn('orders', 'userId', 'INT DEFAULT NULL');
    await safeAddColumn('orders', 'phone', "VARCHAR(50) DEFAULT ''");
    await safeAddColumn('orders', 'shippingAddress', 'TEXT');
    await safeAddColumn('orders', 'items', 'JSON');
    await safeAddColumn('orders', 'courier', "VARCHAR(100) DEFAULT ''");
    await safeAddColumn('orders', 'trackingNumber', "VARCHAR(100) DEFAULT ''");
    await safeAddColumn('products', 'costPrice', "VARCHAR(100) DEFAULT '0'");
    await safeAddColumn('products', 'supplierName', "VARCHAR(150) DEFAULT ''");
    await safeAddColumn('products', 'supplierContact', "VARCHAR(50) DEFAULT ''");

    console.log('✅ MySQL Database initialized successfully');
  } catch (err) {
    console.error('❌ Failed to initialize database:', err);
    throw err;
  } finally {
    connection.release();
  }
}
