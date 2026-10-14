import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, initDB } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper to format products for frontend
function formatProduct(p) {
  let images = [];
  try {
    images = typeof p.images === 'string' ? JSON.parse(p.images) : (p.images || []);
  } catch (e) {
    images = p.images ? [p.images] : [];
  }
  return {
    ...p,
    id: Number(p.id),
    sale: Boolean(p.sale),
    bestSeller: Boolean(p.bestSeller),
    images: images,
    image: p.image || (images.length > 0 ? images[0] : '')
  };
}

// ==================== PRODUCTS ====================
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products ORDER BY id DESC');
    res.json(rows.map(formatProduct));
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { name, price, category, subCategory = '', sale = false, bestSeller = false, image = '', images = [], description = '' } = req.body;
    const imagesJson = JSON.stringify(images);
    const mainImg = image || (images.length > 0 ? images[0] : '');
    
    const [result] = await pool.query(
      `INSERT INTO products (name, price, category, subCategory, sale, bestSeller, image, images, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, price, category, subCategory, sale ? 1 : 0, bestSeller ? 1 : 0, mainImg, imagesJson, description]
    );

    const [newProduct] = await pool.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
    res.status(201).json(formatProduct(newProduct[0]));
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { name, price, category, subCategory = '', sale = false, bestSeller = false, image = '', images = [], description = '' } = req.body;
    const imagesJson = JSON.stringify(images);
    const mainImg = image || (images.length > 0 ? images[0] : '');

    await pool.query(
      `UPDATE products 
       SET name = ?, price = ?, category = ?, subCategory = ?, sale = ?, bestSeller = ?, image = ?, images = ?, description = ?
       WHERE id = ?`,
      [name, price, category, subCategory, sale ? 1 : 0, bestSeller ? 1 : 0, mainImg, imagesJson, description, id]
    );

    const [updated] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    if (updated.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(formatProduct(updated[0]));
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await pool.query('DELETE FROM products WHERE id = ?', [id]);
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// ==================== CATEGORIES ====================
app.get('/api/categories', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories');
    const categoriesMap = {};
    for (const row of rows) {
      let subs = [];
      try {
        subs = typeof row.sub_categories === 'string' ? JSON.parse(row.sub_categories) : row.sub_categories;
      } catch (e) {
        subs = [];
      }
      categoriesMap[row.name] = subs || [];
    }
    res.json(categoriesMap);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name === 'Uncategorized') {
      return res.status(400).json({ error: 'Invalid category name' });
    }
    await pool.query(
      'INSERT IGNORE INTO categories (name, sub_categories) VALUES (?, ?)',
      [name, JSON.stringify([])]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    console.error('Error adding category:', err);
    res.status(500).json({ error: 'Failed to add category' });
  }
});

app.delete('/api/categories/:name', async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);
    await pool.query('DELETE FROM categories WHERE name = ?', [name]);
    // Set affected products category to Uncategorized
    await pool.query("UPDATE products SET category = 'Uncategorized', subCategory = '' WHERE category = ?", [name]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

app.post('/api/categories/:name/subcategories', async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);
    const { subCategory } = req.body;
    if (!subCategory) return res.status(400).json({ error: 'Subcategory required' });

    const [rows] = await pool.query('SELECT * FROM categories WHERE name = ?', [name]);
    if (rows.length === 0) return res.status(404).json({ error: 'Category not found' });

    let subs = typeof rows[0].sub_categories === 'string' ? JSON.parse(rows[0].sub_categories) : (rows[0].sub_categories || []);
    if (!subs.includes(subCategory)) {
      subs.push(subCategory);
      await pool.query('UPDATE categories SET sub_categories = ? WHERE name = ?', [JSON.stringify(subs), name]);
    }
    res.json({ success: true, subCategories: subs });
  } catch (err) {
    console.error('Error adding subcategory:', err);
    res.status(500).json({ error: 'Failed to add subcategory' });
  }
});

app.delete('/api/categories/:name/subcategories/:subName', async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);
    const subName = decodeURIComponent(req.params.subName);

    const [rows] = await pool.query('SELECT * FROM categories WHERE name = ?', [name]);
    if (rows.length === 0) return res.status(404).json({ error: 'Category not found' });

    let subs = typeof rows[0].sub_categories === 'string' ? JSON.parse(rows[0].sub_categories) : (rows[0].sub_categories || []);
    subs = subs.filter(s => s !== subName);

    await pool.query('UPDATE categories SET sub_categories = ? WHERE name = ?', [JSON.stringify(subs), name]);
    // Clear subcategory for products with this subcategory
    await pool.query("UPDATE products SET subCategory = '' WHERE category = ? AND subCategory = ?", [name, subName]);
    res.json({ success: true, subCategories: subs });
  } catch (err) {
    console.error('Error removing subcategory:', err);
    res.status(500).json({ error: 'Failed to remove subcategory' });
  }
});

// ==================== STORE DETAILS ====================
app.get('/api/store-details', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT address, hours, phone FROM store_details WHERE id = 1');
    if (rows.length === 0) {
      return res.json({ address: 'Kohinoor City', hours: '10 AM - 10 PM', phone: '+92 300 1234567' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching store details:', err);
    res.status(500).json({ error: 'Failed to fetch store details' });
  }
});

app.put('/api/store-details', async (req, res) => {
  try {
    const { address, hours, phone } = req.body;
    await pool.query(
      'UPDATE store_details SET address = ?, hours = ?, phone = ? WHERE id = 1',
      [address, hours, phone]
    );
    res.json({ address, hours, phone });
  } catch (err) {
    console.error('Error updating store details:', err);
    res.status(500).json({ error: 'Failed to update store details' });
  }
});

// ==================== ORDERS ====================
app.get('/api/orders', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM orders ORDER BY id DESC');
    res.json(rows.map(o => ({
      ...o,
      id: Number(o.id)
    })));
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { id, userName, productName, price, status = 'Pending', date } = req.body;
    const orderId = id || Date.now();
    const orderDate = date || new Date().toLocaleDateString();

    await pool.query(
      'INSERT INTO orders (id, userName, productName, price, status, date) VALUES (?, ?, ?, ?, ?, ?)',
      [orderId, userName, productName, price, status, orderDate]
    );

    const [order] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    res.status(201).json(order[0]);
  } catch (err) {
    console.error('Error placing order:', err);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const id = req.params.id;
    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    res.json({ success: true, id, status });
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// ==================== AUTH ====================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [users] = await pool.query('SELECT id, name, email, role FROM users WHERE email = ? AND password = ?', [email, password]);
    if (users.length > 0) {
      return res.json({ success: true, user: users[0] });
    }
    // Check if admin fallback credentials
    if (email === 'admin' && password === 'admin123') {
      return res.json({ success: true, user: { name: 'Admin', email: 'admin', role: 'admin' } });
    }
    // Also allow customer login with name fallback if not yet registered
    return res.status(401).json({ error: 'Invalid email or password' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name || email.split('@')[0], email, password || '', 'customer']
    );

    res.status(201).json({
      success: true,
      user: {
        id: result.insertId,
        name: name || email.split('@')[0],
        email,
        role: 'customer'
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Serve frontend static assets from dist
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// SPA fallback for non-API GET requests
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(distPath, 'index.html'));
  }
  next();
});

// Start server after DB is ready
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('❌ Failed to start server:', err);
});
