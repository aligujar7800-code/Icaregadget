import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, initDB } from './db.js';
import { fallbackStore } from './fallbackStore.js';
import { sendOtpEmail, generateOtp } from './mailer.js';
import { getEmailRoutingInfo, addDestinationAddress, activateForwardingRule, deleteDestinationAddress } from './cloudflare.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3009;
let isDbConnected = false;

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
  if (isDbConnected) {
    try {
      const [rows] = await pool.query('SELECT * FROM products ORDER BY id DESC');
      return res.json(rows.map(formatProduct));
    } catch (err) {
      console.warn('MySQL products fetch failed, using fallback store:', err.message);
    }
  }
  res.json(fallbackStore.getProducts().map(formatProduct));
});

app.post('/api/products', async (req, res) => {
  try {
    const { name, price, category, subCategory = '', sale = false, bestSeller = false, image = '', images = [], description = '' } = req.body;
    const imagesJson = JSON.stringify(images);
    const mainImg = image || (images.length > 0 ? images[0] : '');

    if (isDbConnected) {
      try {
        const [result] = await pool.query(
          `INSERT INTO products (name, price, category, subCategory, sale, bestSeller, image, images, description)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [name, price, category, subCategory, sale ? 1 : 0, bestSeller ? 1 : 0, mainImg, imagesJson, description]
        );
        const [newProduct] = await pool.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
        return res.status(201).json(formatProduct(newProduct[0]));
      } catch (dbErr) {
        console.warn('MySQL product insert failed, using fallback:', dbErr.message);
      }
    }

    const created = fallbackStore.addProduct({ name, price, category, subCategory, sale, bestSeller, image: mainImg, images, description });
    res.status(201).json(formatProduct(created));
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

    if (isDbConnected) {
      try {
        await pool.query(
          `UPDATE products 
           SET name = ?, price = ?, category = ?, subCategory = ?, sale = ?, bestSeller = ?, image = ?, images = ?, description = ?
           WHERE id = ?`,
          [name, price, category, subCategory, sale ? 1 : 0, bestSeller ? 1 : 0, mainImg, imagesJson, description, id]
        );
        const [updated] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
        if (updated.length > 0) return res.json(formatProduct(updated[0]));
      } catch (dbErr) {
        console.warn('MySQL product update failed, using fallback:', dbErr.message);
      }
    }

    const updated = fallbackStore.updateProduct(id, { name, price, category, subCategory, sale, bestSeller, image: mainImg, images, description });
    if (!updated) return res.status(404).json({ error: 'Product not found' });
    res.json(formatProduct(updated));
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (isDbConnected) {
      try {
        await pool.query('DELETE FROM products WHERE id = ?', [id]);
        return res.json({ success: true, message: 'Product deleted' });
      } catch (dbErr) {
        console.warn('MySQL product delete failed, using fallback:', dbErr.message);
      }
    }
    fallbackStore.deleteProduct(id);
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// ==================== CATEGORIES ====================
app.get('/api/categories', async (req, res) => {
  if (isDbConnected) {
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
      return res.json(categoriesMap);
    } catch (err) {
      console.warn('MySQL categories fetch failed, using fallback:', err.message);
    }
  }
  res.json(fallbackStore.getCategories());
});

app.post('/api/categories', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name === 'Uncategorized') {
      return res.status(400).json({ error: 'Invalid category name' });
    }
    if (isDbConnected) {
      try {
        await pool.query('INSERT IGNORE INTO categories (name, sub_categories) VALUES (?, ?)', [name, JSON.stringify([])]);
        return res.status(201).json({ success: true });
      } catch (dbErr) {
        console.warn('MySQL add category failed, fallback:', dbErr.message);
      }
    }
    fallbackStore.addCategory(name);
    res.status(201).json({ success: true });
  } catch (err) {
    console.error('Error adding category:', err);
    res.status(500).json({ error: 'Failed to add category' });
  }
});

app.delete('/api/categories/:name', async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);
    if (isDbConnected) {
      try {
        await pool.query('DELETE FROM categories WHERE name = ?', [name]);
        await pool.query("UPDATE products SET category = 'Uncategorized', subCategory = '' WHERE category = ?", [name]);
        return res.json({ success: true });
      } catch (dbErr) {
        console.warn('MySQL delete category failed, fallback:', dbErr.message);
      }
    }
    fallbackStore.deleteCategory(name);
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

    if (isDbConnected) {
      try {
        const [rows] = await pool.query('SELECT * FROM categories WHERE name = ?', [name]);
        if (rows.length > 0) {
          let subs = typeof rows[0].sub_categories === 'string' ? JSON.parse(rows[0].sub_categories) : (rows[0].sub_categories || []);
          if (!subs.includes(subCategory)) {
            subs.push(subCategory);
            await pool.query('UPDATE categories SET sub_categories = ? WHERE name = ?', [JSON.stringify(subs), name]);
          }
          return res.json({ success: true, subCategories: subs });
        }
      } catch (dbErr) {
        console.warn('MySQL add subcategory failed, fallback:', dbErr.message);
      }
    }

    const subs = fallbackStore.addSubCategory(name, subCategory);
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

    if (isDbConnected) {
      try {
        const [rows] = await pool.query('SELECT * FROM categories WHERE name = ?', [name]);
        if (rows.length > 0) {
          let subs = typeof rows[0].sub_categories === 'string' ? JSON.parse(rows[0].sub_categories) : (rows[0].sub_categories || []);
          subs = subs.filter(s => s !== subName);
          await pool.query('UPDATE categories SET sub_categories = ? WHERE name = ?', [JSON.stringify(subs), name]);
          await pool.query("UPDATE products SET subCategory = '' WHERE category = ? AND subCategory = ?", [name, subName]);
          return res.json({ success: true, subCategories: subs });
        }
      } catch (dbErr) {
        console.warn('MySQL remove subcategory failed, fallback:', dbErr.message);
      }
    }

    const subs = fallbackStore.deleteSubCategory(name, subName);
    res.json({ success: true, subCategories: subs });
  } catch (err) {
    console.error('Error removing subcategory:', err);
    res.status(500).json({ error: 'Failed to remove subcategory' });
  }
});

// ==================== STORE DETAILS ====================
app.get('/api/store-details', async (req, res) => {
  if (isDbConnected) {
    try {
      const [rows] = await pool.query('SELECT address, hours, phone FROM store_details WHERE id = 1');
      if (rows.length > 0) return res.json(rows[0]);
    } catch (err) {
      console.warn('MySQL store details failed, fallback:', err.message);
    }
  }
  res.json(fallbackStore.getStoreDetails());
});

app.put('/api/store-details', async (req, res) => {
  try {
    const { address, hours, phone } = req.body;
    if (isDbConnected) {
      try {
        await pool.query('UPDATE store_details SET address = ?, hours = ?, phone = ? WHERE id = 1', [address, hours, phone]);
        return res.json({ address, hours, phone });
      } catch (dbErr) {
        console.warn('MySQL update store details failed, fallback:', dbErr.message);
      }
    }
    const updated = fallbackStore.updateStoreDetails({ address, hours, phone });
    res.json(updated);
  } catch (err) {
    console.error('Error updating store details:', err);
    res.status(500).json({ error: 'Failed to update store details' });
  }
});

// ==================== ORDERS ====================
app.get('/api/orders', async (req, res) => {
  if (isDbConnected) {
    try {
      const [rows] = await pool.query('SELECT * FROM orders ORDER BY id DESC');
      return res.json(rows.map(o => ({
        ...o,
        id: Number(o.id),
        items: typeof o.items === 'string' ? JSON.parse(o.items || '[]') : (o.items || [])
      })));
    } catch (err) {
      console.warn('MySQL fetch orders error, using fallback:', err.message);
    }
  }
  res.json(fallbackStore.getOrders());
});

// Customer specific orders
app.get('/api/customer/orders', async (req, res) => {
  const { email, userId, name } = req.query;
  if (!email && !userId && !name) {
    return res.status(400).json({ error: 'Customer identifier (email, userId, or name) required' });
  }

  if (isDbConnected) {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM orders 
         WHERE (userEmail != '' AND userEmail = ?) 
            OR (userId IS NOT NULL AND userId = ?) 
            OR (userName != '' AND userName = ?)
         ORDER BY id DESC`,
        [email || '', userId || 0, name || '']
      );

      return res.json(rows.map(o => ({
        ...o,
        id: Number(o.id),
        items: typeof o.items === 'string' ? JSON.parse(o.items || '[]') : (o.items || [])
      })));
    } catch (err) {
      console.warn('MySQL customer orders error, using fallback:', err.message);
    }
  }
  res.json(fallbackStore.getCustomerOrders(email, userId, name));
});

app.post('/api/orders', async (req, res) => {
  try {
    const { 
      id, 
      userName = 'Customer', 
      userEmail = '', 
      userId = null, 
      phone = '', 
      shippingAddress = '', 
      productName = '', 
      items = [], 
      price = 'Rs. 0', 
      status = 'Pending', 
      date 
    } = req.body;

    const orderId = id || Date.now();
    const orderDate = date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const itemsJson = typeof items === 'string' ? items : JSON.stringify(items || []);

    if (isDbConnected) {
      try {
        await pool.query(
          `INSERT INTO orders (id, userName, userEmail, userId, phone, shippingAddress, productName, items, price, status, date) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [orderId, userName, userEmail, userId, phone, shippingAddress, productName, itemsJson, price, status, orderDate]
        );

        const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
        const savedOrder = orders[0] || { id: orderId, userName, userEmail, price, status, date: orderDate };
        return res.status(201).json({
          ...savedOrder,
          id: Number(savedOrder.id),
          items: typeof savedOrder.items === 'string' ? JSON.parse(savedOrder.items || '[]') : (savedOrder.items || [])
        });
      } catch (dbErr) {
        console.warn('MySQL place order error, using fallback:', dbErr.message);
      }
    }

    const saved = fallbackStore.addOrder({
      id: orderId,
      userName,
      userEmail,
      userId,
      phone,
      shippingAddress,
      productName,
      items,
      price,
      status,
      date: orderDate
    });
    res.status(201).json(saved);
  } catch (err) {
    console.error('Error placing order:', err);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const id = req.params.id;
    if (isDbConnected) {
      try {
        await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
        return res.json({ success: true, id, status });
      } catch (dbErr) {
        console.warn('MySQL update order status failed, using fallback:', dbErr.message);
      }
    }
    fallbackStore.updateOrderStatus(id, status);
    res.json({ success: true, id, status });
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// ==================== AUTH & SECURITY ====================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const targetAdminEmail = process.env.ADMIN_EMAIL || 'admin@icaregadget.store';
    const isAdminAttempt = email === targetAdminEmail || email === 'admin';

    if (isAdminAttempt) {
      if (isDbConnected) {
        try {
          const [admins] = await pool.query(
            'SELECT id, name, email, password, role FROM users WHERE (email = ? OR email = ? OR role = "admin") LIMIT 1',
            [targetAdminEmail, 'admin']
          );

          const adminUser = admins[0];
          const validPassword = adminUser ? adminUser.password === password : password === 'admin123';

          if (!validPassword) {
            return res.status(401).json({ error: 'Invalid admin credentials' });
          }

          const code = generateOtp();
          await pool.query('DELETE FROM otp_codes WHERE email = ? AND action = "ADMIN_LOGIN" AND is_used = FALSE', [targetAdminEmail]);
          await pool.query('INSERT INTO otp_codes (email, code, action, expires_at) VALUES (?, ?, "ADMIN_LOGIN", DATE_ADD(NOW(), INTERVAL 10 MINUTE))', [targetAdminEmail, code]);
          await sendOtpEmail(targetAdminEmail, code, 'ADMIN_LOGIN');

          return res.json({
            success: true,
            requireOtp: true,
            email: targetAdminEmail,
            message: 'Verification code sent to ' + targetAdminEmail
          });
        } catch (dbErr) {
          console.warn('MySQL admin login failed, using fallback:', dbErr.message);
        }
      }

      // Offline Admin Fallback
      if (password === 'admin123') {
        const adminUser = { id: 1, name: 'Admin', email: targetAdminEmail, role: 'admin' };
        return res.json({ success: true, user: adminUser });
      }
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    // Customer Login
    if (isDbConnected) {
      try {
        const [users] = await pool.query(
          'SELECT id, name, email, role, phone, address, city, created_at FROM users WHERE email = ? AND password = ?', 
          [email.trim().toLowerCase(), password]
        );
        if (users.length > 0) {
          return res.json({ success: true, user: users[0] });
        }
      } catch (dbErr) {
        console.warn('MySQL customer login failed, using fallback:', dbErr.message);
      }
    }

    // Fallback Store Customer Login
    const localUser = fallbackStore.findUser(email, password);
    if (localUser) {
      const { password: _, ...safeUser } = localUser;
      return res.json({ success: true, user: safeUser });
    }

    return res.status(401).json({ error: 'Invalid email or password' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Customer Registration / Sign Up
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone = '', address = '', city = '' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please provide full name, email, and password.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    if (isDbConnected) {
      try {
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [cleanEmail]);
        if (existing.length > 0) {
          return res.status(400).json({ error: 'An account with this email address already exists. Please log in.' });
        }

        const [result] = await pool.query(
          'INSERT INTO users (name, email, password, role, phone, address, city) VALUES (?, ?, ?, "customer", ?, ?, ?)',
          [name.trim(), cleanEmail, password, phone.trim(), address.trim(), city.trim()]
        );

        const newUser = {
          id: result.insertId,
          name: name.trim(),
          email: cleanEmail,
          role: 'customer',
          phone: phone.trim(),
          address: address.trim(),
          city: city.trim(),
          created_at: new Date()
        };

        return res.status(201).json({ success: true, user: newUser });
      } catch (dbErr) {
        console.warn('MySQL register failed, using fallback store:', dbErr.message);
      }
    }

    // Fallback Store (when MySQL is not running)
    const existing = fallbackStore.findUserByEmail(cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email address already exists. Please log in.' });
    }

    const newUser = fallbackStore.addUser({
      name: name.trim(),
      email: cleanEmail,
      password,
      role: 'customer',
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim()
    });

    const { password: _, ...safeUser } = newUser;
    return res.status(201).json({ success: true, user: safeUser });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// ==================== GOOGLE AUTHENTICATION ====================
app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential, access_token, userInfo } = req.body;
    let googleUser = null;

    if (credential) {
      // 1. Verify with Google TokenInfo API
      try {
        const tokenRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
        if (tokenRes.ok) {
          const payload = await tokenRes.json();
          googleUser = {
            email: payload.email,
            name: payload.name || payload.given_name || payload.email.split('@')[0],
            google_id: payload.sub,
            avatar: payload.picture || ''
          };
        }
      } catch (e) {
        console.warn('Google tokeninfo verification failed, falling back to decoding payload:', e.message);
      }

      // Fallback: decode JWT payload if Google API had network hiccup
      if (!googleUser && credential.includes('.')) {
        try {
          const base64Url = credential.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
          const payload = JSON.parse(jsonPayload);
          if (payload.email) {
            googleUser = {
              email: payload.email,
              name: payload.name || payload.email.split('@')[0],
              google_id: payload.sub || '',
              avatar: payload.picture || ''
            };
          }
        } catch (e) {
          console.warn('JWT decode failed:', e.message);
        }
      }
    } else if (access_token) {
      // 2. Fetch UserInfo from Google using Access Token
      try {
        const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${access_token}` }
        });
        if (userRes.ok) {
          const payload = await userRes.json();
          googleUser = {
            email: payload.email,
            name: payload.name || payload.email.split('@')[0],
            google_id: payload.sub,
            avatar: payload.picture || ''
          };
        }
      } catch (e) {
        console.warn('Google userinfo fetch failed:', e.message);
      }
    } else if (userInfo && userInfo.email) {
      googleUser = userInfo;
    }

    if (!googleUser || !googleUser.email) {
      return res.status(400).json({ error: 'Could not verify Google account. Please try again.' });
    }

    const cleanEmail = googleUser.email.trim().toLowerCase();
    const cleanName = googleUser.name ? googleUser.name.trim() : cleanEmail.split('@')[0];
    const targetAdminEmail = process.env.ADMIN_EMAIL || 'admin@icaregadget.store';
    const role = cleanEmail === targetAdminEmail ? 'admin' : 'customer';

    if (isDbConnected) {
      try {
        const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [cleanEmail]);
        if (existing.length > 0) {
          await pool.query(
            'UPDATE users SET google_id = COALESCE(NULLIF(google_id, ""), ?), avatar = COALESCE(NULLIF(avatar, ""), ?) WHERE id = ?',
            [googleUser.google_id || '', googleUser.avatar || '', existing[0].id]
          );
          const { password: _, ...safeUser } = existing[0];
          return res.json({
            success: true,
            user: { ...safeUser, avatar: googleUser.avatar || safeUser.avatar || '' }
          });
        } else {
          const [result] = await pool.query(
            'INSERT INTO users (name, email, password, role, google_id, avatar, auth_provider) VALUES (?, ?, "", ?, ?, ?, "google")',
            [cleanName, cleanEmail, role, googleUser.google_id || '', googleUser.avatar || '']
          );
          return res.json({
            success: true,
            user: {
              id: result.insertId,
              name: cleanName,
              email: cleanEmail,
              role,
              phone: '',
              address: '',
              city: '',
              avatar: googleUser.avatar || '',
              google_id: googleUser.google_id || '',
              auth_provider: 'google',
              created_at: new Date()
            }
          });
        }
      } catch (dbErr) {
        console.warn('MySQL google auth failed, using fallback store:', dbErr.message);
      }
    }

    // Fallback Store (when MySQL is not running)
    const user = fallbackStore.findOrCreateGoogleUser({
      name: cleanName,
      email: cleanEmail,
      google_id: googleUser.google_id,
      avatar: googleUser.avatar
    });
    const { password: _, ...safeUser } = user;
    return res.json({ success: true, user: safeUser });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(500).json({ error: 'Google authentication failed' });
  }
});

// Customer Profile Update
app.put('/api/customer/profile', async (req, res) => {
  try {
    const { email, name, phone = '', address = '', city = '' } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    if (isDbConnected) {
      try {
        await pool.query(
          'UPDATE users SET name = COALESCE(?, name), phone = ?, address = ?, city = ? WHERE email = ?',
          [name ? name.trim() : null, phone.trim(), address.trim(), city.trim(), email.trim().toLowerCase()]
        );

        const [users] = await pool.query(
          'SELECT id, name, email, role, phone, address, city, created_at FROM users WHERE email = ?',
          [email.trim().toLowerCase()]
        );

        if (users.length > 0) return res.json({ success: true, user: users[0] });
      } catch (dbErr) {
        console.warn('MySQL profile update failed, using fallback:', dbErr.message);
      }
    }

    const updated = fallbackStore.updateUserProfile(email, { name, phone, address, city });
    if (!updated) return res.status(404).json({ error: 'User not found' });
    const { password: _, ...safeUser } = updated;
    res.json({ success: true, user: safeUser });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Customer Change Password
app.put('/api/customer/change-password', async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Please provide current and new passwords.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    if (isDbConnected) {
      try {
        const [users] = await pool.query(
          'SELECT id FROM users WHERE email = ? AND password = ?',
          [email.trim().toLowerCase(), currentPassword]
        );

        if (users.length === 0) {
          return res.status(400).json({ error: 'Current password is incorrect.' });
        }

        await pool.query('UPDATE users SET password = ? WHERE email = ?', [newPassword, email.trim().toLowerCase()]);
        return res.json({ success: true, message: 'Password updated successfully' });
      } catch (dbErr) {
        console.warn('MySQL password change failed, using fallback:', dbErr.message);
      }
    }

    const localUser = fallbackStore.findUser(email, currentPassword);
    if (!localUser) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    fallbackStore.changeUserPassword(email, newPassword);
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Verify Admin Login OTP
app.post('/api/auth/verify-admin-otp', async (req, res) => {
  try {
    const { email, code } = req.body;
    const targetAdminEmail = process.env.ADMIN_EMAIL || 'admin@icaregadget.store';

    const [rows] = await pool.query(
      `SELECT * FROM otp_codes 
       WHERE email = ? AND code = ? AND action = 'ADMIN_LOGIN' AND is_used = FALSE AND expires_at > NOW() 
       ORDER BY id DESC LIMIT 1`,
      [targetAdminEmail, String(code).trim()]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired verification code. Please check your email and try again.' });
    }

    // Mark code as used
    await pool.query('UPDATE otp_codes SET is_used = TRUE WHERE id = ?', [rows[0].id]);

    // Retrieve admin record
    const [admins] = await pool.query('SELECT id, name, email, role FROM users WHERE role = "admin" LIMIT 1');
    const user = admins.length > 0 
      ? admins[0] 
      : { id: 1, name: 'Admin', email: targetAdminEmail, role: 'admin' };

    res.json({ success: true, user });
  } catch (err) {
    console.error('OTP verification error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Resend Admin OTP
app.post('/api/auth/resend-admin-otp', async (req, res) => {
  try {
    const { email, action = 'ADMIN_LOGIN' } = req.body;
    const targetAdminEmail = process.env.ADMIN_EMAIL || 'admin@icaregadget.store';

    const code = generateOtp();

    await pool.query(
      'DELETE FROM otp_codes WHERE email = ? AND action = ? AND is_used = FALSE',
      [targetAdminEmail, action]
    );

    await pool.query(
      'INSERT INTO otp_codes (email, code, action, expires_at) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))',
      [targetAdminEmail, code, action]
    );

    await sendOtpEmail(targetAdminEmail, code, action);

    res.json({ success: true, message: 'New verification code sent' });
  } catch (err) {
    console.error('Error resending OTP:', err);
    res.status(500).json({ error: 'Failed to resend code' });
  }
});

// Request Password Change OTP (From Admin Dashboard)
app.post('/api/admin/request-password-otp', async (req, res) => {
  try {
    const { currentPassword } = req.body;
    const targetAdminEmail = process.env.ADMIN_EMAIL || 'admin@icaregadget.store';

    const [admins] = await pool.query('SELECT * FROM users WHERE role = "admin" LIMIT 1');
    const adminUser = admins[0];

    const validPassword = adminUser ? adminUser.password === currentPassword : currentPassword === 'admin123';
    if (!validPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const code = generateOtp();

    await pool.query(
      'DELETE FROM otp_codes WHERE email = ? AND action = "CHANGE_PASSWORD" AND is_used = FALSE',
      [targetAdminEmail]
    );

    await pool.query(
      'INSERT INTO otp_codes (email, code, action, expires_at) VALUES (?, ?, "CHANGE_PASSWORD", DATE_ADD(NOW(), INTERVAL 10 MINUTE))',
      [targetAdminEmail, code]
    );

    await sendOtpEmail(targetAdminEmail, code, 'CHANGE_PASSWORD');

    res.json({ success: true, message: 'Verification code sent to ' + targetAdminEmail });
  } catch (err) {
    console.error('Error requesting password OTP:', err);
    res.status(500).json({ error: 'Failed to request verification code' });
  }
});

// Confirm Password Change (From Admin Dashboard)
app.post('/api/admin/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword, code } = req.body;
    const targetAdminEmail = process.env.ADMIN_EMAIL || 'admin@icaregadget.store';

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    // 1. Check current password
    const [admins] = await pool.query('SELECT * FROM users WHERE role = "admin" LIMIT 1');
    const adminUser = admins[0];
    const validPassword = adminUser ? adminUser.password === currentPassword : currentPassword === 'admin123';

    if (!validPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // 2. Validate OTP
    const [otpRows] = await pool.query(
      `SELECT * FROM otp_codes 
       WHERE email = ? AND code = ? AND action = 'CHANGE_PASSWORD' AND is_used = FALSE AND expires_at > NOW() 
       ORDER BY id DESC LIMIT 1`,
      [targetAdminEmail, String(code).trim()]
    );

    if (otpRows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    // 3. Update password in database
    if (adminUser) {
      await pool.query('UPDATE users SET password = ? WHERE id = ?', [newPassword, adminUser.id]);
    } else {
      await pool.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Admin', targetAdminEmail, newPassword, 'admin']
      );
    }

    // Mark OTP used
    await pool.query('UPDATE otp_codes SET is_used = TRUE WHERE id = ?', [otpRows[0].id]);

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// ==================== CLOUDFLARE EMAIL ROUTING ====================
app.get('/api/admin/email-routing', async (req, res) => {
  try {
    const info = await getEmailRoutingInfo();
    res.json(info);
  } catch (err) {
    console.error('Error in /api/admin/email-routing:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch email routing information' });
  }
});

app.post('/api/admin/email-routing/add-destination', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email address is required' });
    }
    const result = await addDestinationAddress(email);
    res.json(result);
  } catch (err) {
    console.error('Error adding destination address:', err);
    res.status(500).json({ error: err.message || 'Failed to add destination address' });
  }
});

app.post('/api/admin/email-routing/activate-destination', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email address is required' });
    }
    const result = await activateForwardingRule(email);
    res.json(result);
  } catch (err) {
    console.error('Error activating forwarding rule:', err);
    res.status(500).json({ error: err.message || 'Failed to activate forwarding rule' });
  }
});

app.delete('/api/admin/email-routing/destination/:tag', async (req, res) => {
  try {
    const { tag } = req.params;
    if (!tag) {
      return res.status(400).json({ error: 'Address tag is required' });
    }
    const result = await deleteDestinationAddress(tag);
    res.json(result);
  } catch (err) {
    console.error('Error deleting destination address:', err);
    res.status(500).json({ error: err.message || 'Failed to delete destination address' });
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

// ==================== AI CHAT ROUTES (MULTI-TENANT n8n ENGINE) ====================

// 1. Customer Chat (Website Widget)
app.post('/api/chat', async (req, res) => {
  try {
    const { message, audio, history = [], role = 'customer', businessId = process.env.BUSINESS_ID || 'icare', senderName } = req.body;

    if ((!message || !message.trim()) && !audio) {
      return res.status(400).json({ error: 'Message or audio is required' });
    }

    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/website-chat';

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
      const n8nResponse = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-source': 'icare-website'
        },
        body: JSON.stringify({
          channel: 'website',
          businessId,
          role: 'customer',
          message: (message || '').trim(),
          audio: audio || null,
          senderName: senderName || 'Website Customer',
          history
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (n8nResponse.ok) {
        const data = await n8nResponse.json();
        const replyText = typeof data === 'string' ? data : (data.reply || data.message || data.output || "Hello! How can I help you find gadgets today?");
        return res.json({ 
          success: true, 
          reply: replyText,
          audio: data.audio || null,
          business: data.business || 'I Care Gadget'
        });
      }
    } catch (fetchErr) {
      clearTimeout(timeout);
      console.warn('n8n webhook connection failed, falling back to local database quick-reply:', fetchErr.message);
    }

    // Smart Local Fallback using live icare_db
    const query = message.toLowerCase();
    if (query.includes('hour') || query.includes('time') || query.includes('open') || query.includes('location') || query.includes('address')) {
      const [storeRows] = await pool.query('SELECT address, hours, phone FROM store_details LIMIT 1');
      const store = storeRows[0] || { address: 'Kohinoor City', hours: '10 AM - 10 PM', phone: '+92 300 1234567' };
      return res.json({
        success: true,
        reply: `We are located at ${store.address} and open daily from ${store.hours}. Delivery is also available across Pakistan! What item are you looking for today? 😊`,
        business: 'I Care Gadget'
      });
    }

    const [products] = await pool.query('SELECT name, price, bestSeller, sale FROM products ORDER BY bestSeller DESC, id DESC LIMIT 2');
    if (products.length > 0) {
      const items = products.map(p => `${p.name} (PKR ${p.price})`).join(' and ');
      return res.json({
        success: true,
        reply: `Welcome to I Care Gadget! Some of our top trending items right now are the ${items}. Are you looking for chargers, audio, or phone accessories?`,
        business: 'I Care Gadget'
      });
    }

    return res.json({
      success: true,
      reply: "Welcome to I Care Gadget! We offer authentic chargers, accessories, audio gear, and phone protection. What can I help you find today?",
      business: 'I Care Gadget'
    });

  } catch (err) {
    console.error('Error in /api/chat:', err);
    res.status(500).json({ 
      success: false, 
      reply: "I am having a brief connection issue. Please give me a moment and ask again!",
      error: err.message 
    });
  }
});

// 2. Admin AI Chat (Data Handler & Business Analytics)
app.post('/api/chat/admin', async (req, res) => {
  try {
    const { message, audio, history = [] } = req.body;
    if ((!message || !message.trim()) && !audio) {
      return res.status(400).json({ error: 'Message or audio is required' });
    }

    // Query live metrics from icare_db
    const [orderStats] = await pool.query(`
      SELECT 
        COUNT(*) as totalOrders,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pendingOrders,
        SUM(CASE WHEN status = 'Delivered' THEN 1 ELSE 0 END) as deliveredOrders,
        COALESCE(SUM(CAST(price AS DECIMAL(10,2))), 0) as totalRevenue
      FROM orders
    `);

    const [productStats] = await pool.query(`
      SELECT 
        COUNT(*) as totalProducts,
        SUM(CASE WHEN bestSeller = 1 THEN 1 ELSE 0 END) as bestSellers,
        SUM(CASE WHEN sale = 1 THEN 1 ELSE 0 END) as onSale
      FROM products
    `);

    const liveStats = {
      orders: orderStats[0] || {},
      products: productStats[0] || {}
    };

    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/website-chat';
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

      const n8nRes = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'website',
          businessId: process.env.BUSINESS_ID || 'icare',
          role: 'admin',
          message: `${(message || '').trim()}\n\n[Live Store Data: ${JSON.stringify(liveStats)}]`,
          audio: audio || null,
          senderName: 'Store Admin',
          history
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (n8nRes.ok) {
        const data = await n8nRes.json();
        return res.json({ 
          success: true, 
          reply: data.reply || data.message || data.output,
          audio: data.audio || null
        });
      }
    } catch (n8nErr) {
      console.warn('n8n admin call error:', n8nErr.message);
    }

    // Direct Analytical response fallback
    const rev = Number(liveStats.orders.totalRevenue || 0).toLocaleString();
    const reply = `**Live Store Analytics:**\n- **Total Revenue:** PKR ${rev}\n- **Orders:** ${liveStats.orders.totalOrders || 0} total (${liveStats.orders.pendingOrders || 0} pending, ${liveStats.orders.deliveredOrders || 0} delivered)\n- **Products in Catalog:** ${liveStats.products.totalProducts || 0} (${liveStats.products.bestSellers || 0} Best Sellers, ${liveStats.products.onSale || 0} on sale)\n\nWhat specific business insights or recommendations would you like?`;
    return res.json({ success: true, reply });

  } catch (err) {
    console.error('Error in /api/chat/admin:', err);
    res.status(500).json({ success: false, error: err.message });
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

// Start server after attempting DB connection
initDB()
  .then(() => {
    isDbConnected = true;
    console.log('✅ Database connected');
  })
  .catch(err => {
    isDbConnected = false;
    console.warn('⚠️ Warning: MySQL database not connected yet (server running in fallback mode):', err.message);
  })
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  });
