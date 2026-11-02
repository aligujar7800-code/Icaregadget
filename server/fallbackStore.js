import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'local_db.json');

const DEFAULT_DB = {
  users: [
    {
      id: 1,
      name: 'Admin',
      email: 'admin@icaregadget.store',
      password: 'admin123',
      role: 'admin',
      phone: '+92 300 1234567',
      address: 'Main Store',
      city: 'Faisalabad',
      created_at: new Date().toISOString()
    }
  ],
  products: [],
  categories: {
    'Mobiles': ['Samsung', 'Apple', 'Google', 'OnePlus', 'Xiaomi'],
    'Audio': ['Headphones', 'Earbuds', 'Speakers', 'AirPods'],
    'Accessories': ['Mobile Accessories', 'Laptop Accessories', 'Chargers', 'Cables', 'Power Banks', 'Screen Protectors'],
    'Smart Home': [],
    'Gaming': []
  },
  orders: [],
  store_details: {
    address: 'Kohinoor City',
    hours: '10 AM - 10 PM',
    phone: '+92 300 1234567'
  }
};

function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2), 'utf-8');
      return JSON.parse(JSON.stringify(DEFAULT_DB));
    }
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading local fallback DB:', err);
    return JSON.parse(JSON.stringify(DEFAULT_DB));
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing local fallback DB:', err);
  }
}

export const fallbackStore = {
  // Users & Auth
  findUserByEmail(email) {
    const db = readDB();
    const cleanEmail = (email || '').trim().toLowerCase();
    return db.users.find(u => u.email.toLowerCase() === cleanEmail);
  },

  findUser(email, password) {
    const db = readDB();
    const cleanEmail = (email || '').trim().toLowerCase();
    return db.users.find(u => u.email.toLowerCase() === cleanEmail && u.password === password);
  },

  findOrCreateGoogleUser({ name, email, google_id = '', avatar = '' }) {
    const db = readDB();
    const cleanEmail = (email || '').trim().toLowerCase();
    const existing = db.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      if (google_id) existing.google_id = google_id;
      if (avatar && !existing.avatar) existing.avatar = avatar;
      if (!existing.auth_provider) existing.auth_provider = 'google';
      writeDB(db);
      return existing;
    }

    const newUser = {
      id: Date.now(),
      name: name || cleanEmail.split('@')[0],
      email: cleanEmail,
      password: '',
      role: 'customer',
      phone: '',
      address: '',
      city: '',
      google_id: google_id || '',
      avatar: avatar || '',
      auth_provider: 'google',
      created_at: new Date().toISOString()
    };
    db.users.push(newUser);
    writeDB(db);
    return newUser;
  },

  addUser(user) {
    const db = readDB();
    const id = Date.now();
    const newUser = {
      id,
      name: user.name,
      email: user.email.toLowerCase(),
      password: user.password,
      role: user.role || 'customer',
      phone: user.phone || '',
      address: user.address || '',
      city: user.city || '',
      created_at: new Date().toISOString()
    };
    db.users.push(newUser);
    writeDB(db);
    return newUser;
  },

  updateUserProfile(email, updatedData) {
    const db = readDB();
    const cleanEmail = (email || '').trim().toLowerCase();
    const idx = db.users.findIndex(u => u.email.toLowerCase() === cleanEmail);
    if (idx === -1) return null;
    db.users[idx] = { ...db.users[idx], ...updatedData };
    writeDB(db);
    return db.users[idx];
  },

  changeUserPassword(email, newPassword) {
    const db = readDB();
    const cleanEmail = (email || '').trim().toLowerCase();
    const idx = db.users.findIndex(u => u.email.toLowerCase() === cleanEmail);
    if (idx === -1) return false;
    db.users[idx].password = newPassword;
    writeDB(db);
    return true;
  },

  // Products
  getProducts() {
    const db = readDB();
    return db.products || [];
  },

  addProduct(product) {
    const db = readDB();
    const newProduct = {
      ...product,
      id: Number(product.id || Date.now()),
      created_at: new Date().toISOString()
    };
    db.products.unshift(newProduct);
    writeDB(db);
    return newProduct;
  },

  updateProduct(id, updatedData) {
    const db = readDB();
    const idx = db.products.findIndex(p => p.id === Number(id));
    if (idx === -1) return null;
    db.products[idx] = { ...db.products[idx], ...updatedData };
    writeDB(db);
    return db.products[idx];
  },

  deleteProduct(id) {
    const db = readDB();
    db.products = db.products.filter(p => p.id !== Number(id));
    writeDB(db);
    return true;
  },

  // Categories
  getCategories() {
    const db = readDB();
    return db.categories || DEFAULT_DB.categories;
  },

  addCategory(name) {
    const db = readDB();
    if (!db.categories[name]) {
      db.categories[name] = [];
      writeDB(db);
    }
    return db.categories;
  },

  deleteCategory(name) {
    const db = readDB();
    delete db.categories[name];
    writeDB(db);
    return db.categories;
  },

  addSubCategory(catName, subName) {
    const db = readDB();
    if (db.categories[catName] && !db.categories[catName].includes(subName)) {
      db.categories[catName].push(subName);
      writeDB(db);
    }
    return db.categories[catName] || [];
  },

  deleteSubCategory(catName, subName) {
    const db = readDB();
    if (db.categories[catName]) {
      db.categories[catName] = db.categories[catName].filter(s => s !== subName);
      writeDB(db);
    }
    return db.categories[catName] || [];
  },

  // Orders
  getOrders() {
    const db = readDB();
    return db.orders || [];
  },

  getCustomerOrders(email, userId, name) {
    const db = readDB();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (name || '').trim().toLowerCase();
    return (db.orders || []).filter(o => {
      const oEmail = (o.userEmail || '').trim().toLowerCase();
      const oUser = (o.userName || '').trim().toLowerCase();
      return (cleanEmail && oEmail === cleanEmail) ||
             (userId && Number(o.userId) === Number(userId)) ||
             (cleanName && oUser === cleanName);
    });
  },

  addOrder(order) {
    const db = readDB();
    const newOrder = {
      ...order,
      id: Number(order.id || Date.now()),
      date: order.date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      status: order.status || 'Pending'
    };
    db.orders.unshift(newOrder);
    writeDB(db);
    return newOrder;
  },

  updateOrderStatus(id, status) {
    const db = readDB();
    const idx = db.orders.findIndex(o => o.id === Number(id));
    if (idx === -1) return null;
    db.orders[idx].status = status;
    writeDB(db);
    return db.orders[idx];
  },

  // Store Details
  getStoreDetails() {
    const db = readDB();
    return db.store_details || DEFAULT_DB.store_details;
  },

  updateStoreDetails(details) {
    const db = readDB();
    db.store_details = { ...db.store_details, ...details };
    writeDB(db);
    return db.store_details;
  }
};
