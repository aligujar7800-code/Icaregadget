import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// Helper: Record audit log entry
export async function logAudit(userId, userEmail, action, entityType, entityId, details, req) {
  try {
    const ip = req?.ip || req?.headers?.['x-forwarded-for'] || '127.0.0.1';
    await pool.query(
      `INSERT INTO audit_logs (user_id, user_email, action, entity_type, entity_id, details, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId || null, userEmail || 'System', action, entityType, String(entityId || ''), String(details || ''), String(ip).slice(0, 50)]
    );
  } catch (err) {
    console.warn('logAudit failed:', err.message);
  }
}

// Helper: Record in-app notification
export async function createNotification(userId, recipientRole, title, message, type = 'system', link = '') {
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, recipient_role, title, message, type, link)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId || null, recipientRole || 'admin', title, message, type, link]
    );
  } catch (err) {
    console.warn('createNotification failed:', err.message);
  }
}

// Helper: Record order activity timeline
export async function recordOrderActivity(orderId, status, note, actor = 'Admin') {
  try {
    await pool.query(
      `INSERT INTO order_activity (order_id, status, note, actor)
       VALUES (?, ?, ?, ?)`,
      [orderId, status, note || '', actor]
    );
  } catch (err) {
    console.warn('recordOrderActivity failed:', err.message);
  }
}

// Helper: Centralized stock movement ledger
export async function recordStockMovement(productId, productName, variantId, qtyChange, moveType, reason, admin = 'Admin') {
  try {
    const [pRows] = await pool.query('SELECT stock, name FROM products WHERE id = ?', [productId]);
    if (pRows.length === 0) return;
    const currentStock = Number(pRows[0].stock || 0);
    const newStock = Math.max(0, currentStock + qtyChange);

    await pool.query('UPDATE products SET stock = ? WHERE id = ?', [newStock, productId]);

    await pool.query(
      `INSERT INTO inventory_movements (product_id, product_name, variant_id, previous_quantity, quantity_changed, new_quantity, movement_type, reason, responsible_admin)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [productId, pRows[0].name || productName, variantId || '', currentStock, qtyChange, newStock, moveType, reason, admin]
    );

    // Trigger low stock notification if below threshold
    if (newStock <= 5) {
      await createNotification(null, 'admin', 'Low Stock Alert', `Product "${pRows[0].name}" is running low (${newStock} units left).`, 'inventory', '/admin?tab=inventory');
    }
  } catch (err) {
    console.warn('recordStockMovement failed:', err.message);
  }
}

// ==========================================
// 1. CUSTOMER ADDRESSES API
// ==========================================
router.get('/customer/addresses', async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const [rows] = await pool.query(
      'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC',
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching addresses:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/customer/addresses', async (req, res) => {
  try {
    const { userId, label = 'Home', recipientName, phone, city, area = '', street = '', houseNumber = '', landmark = '', instructions = '', isDefault = false } = req.body;
    if (!userId || !recipientName || !phone || !city) {
      return res.status(400).json({ error: 'Missing required address fields' });
    }

    if (isDefault) {
      await pool.query('UPDATE addresses SET is_default = FALSE WHERE user_id = ?', [userId]);
    } else {
      const [count] = await pool.query('SELECT COUNT(*) as cnt FROM addresses WHERE user_id = ?', [userId]);
      if (count[0].cnt === 0) {
        // First address is default by design
        isDefault = true;
      }
    }

    const [result] = await pool.query(
      `INSERT INTO addresses (user_id, label, recipient_name, phone, city, area, street, house_number, landmark, instructions, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, label, recipientName, phone, city, area, street, houseNumber, landmark, instructions, isDefault ? 1 : 0]
    );

    const [newAddr] = await pool.query('SELECT * FROM addresses WHERE id = ?', [result.insertId]);
    res.status(201).json(newAddr[0]);
  } catch (err) {
    console.error('Error creating address:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/customer/addresses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { label, recipientName, phone, city, area = '', street = '', houseNumber = '', landmark = '', instructions = '', isDefault } = req.body;

    if (isDefault) {
      const [curr] = await pool.query('SELECT user_id FROM addresses WHERE id = ?', [id]);
      if (curr.length > 0) {
        await pool.query('UPDATE addresses SET is_default = FALSE WHERE user_id = ?', [curr[0].user_id]);
      }
    }

    await pool.query(
      `UPDATE addresses 
       SET label = ?, recipient_name = ?, phone = ?, city = ?, area = ?, street = ?, house_number = ?, landmark = ?, instructions = ?, is_default = ?
       WHERE id = ?`,
      [label, recipientName, phone, city, area, street, houseNumber, landmark, instructions, isDefault ? 1 : 0, id]
    );

    const [updated] = await pool.query('SELECT * FROM addresses WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (err) {
    console.error('Error updating address:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/customer/addresses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM addresses WHERE id = ?', [id]);
    res.json({ success: true, message: 'Address removed' });
  } catch (err) {
    console.error('Error deleting address:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/customer/addresses/:id/default', async (req, res) => {
  try {
    const { id } = req.params;
    const [curr] = await pool.query('SELECT user_id FROM addresses WHERE id = ?', [id]);
    if (curr.length === 0) return res.status(404).json({ error: 'Address not found' });

    await pool.query('UPDATE addresses SET is_default = FALSE WHERE user_id = ?', [curr[0].user_id]);
    await pool.query('UPDATE addresses SET is_default = TRUE WHERE id = ?', [id]);

    res.json({ success: true, message: 'Default address updated' });
  } catch (err) {
    console.error('Error setting default address:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. ORDER ACTIVITY & LIFECYCLE
// ==========================================
router.get('/orders/:id/activity', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      'SELECT * FROM order_activity WHERE order_id = ? ORDER BY id ASC',
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching order activity:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/orders/:id/activity', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note = '', actor = 'Admin' } = req.body;
    await recordOrderActivity(id, status, note, actor);
    res.status(201).json({ success: true });
  } catch (err) {
    console.error('Error logging order activity:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. CUSTOMERS MANAGEMENT DIRECTORY
// ==========================================
router.get('/customers', async (req, res) => {
  try {
    const [users] = await pool.query(`
      SELECT 
        u.id, u.name, u.email, u.phone, u.city, u.address, u.status, u.created_at, u.customer_notes,
        COUNT(DISTINCT o.id) as totalOrders,
        COALESCE(SUM(CASE WHEN LOWER(o.status) != 'cancelled' THEN CAST(REPLACE(REPLACE(o.price, 'Rs.', ''), ',', '') AS DECIMAL(12,2)) ELSE 0 END), 0) as totalSpent,
        MAX(o.created_at) as lastOrderDate
      FROM users u
      LEFT JOIN orders o ON (o.userId = u.id OR LOWER(o.userEmail) = LOWER(u.email))
      WHERE u.role = 'customer'
      GROUP BY u.id
      ORDER BY u.id DESC
    `);
    res.json(users);
  } catch (err) {
    console.error('Error fetching customers directory:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [userRows] = await pool.query('SELECT id, name, email, phone, city, address, status, customer_notes, created_at FROM users WHERE id = ?', [id]);
    if (userRows.length === 0) return res.status(404).json({ error: 'Customer not found' });

    const user = userRows[0];
    const [addresses] = await pool.query('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC', [id]);
    const [orders] = await pool.query('SELECT * FROM orders WHERE userId = ? OR LOWER(userEmail) = LOWER(?) ORDER BY id DESC', [id, user.email]);

    res.json({
      ...user,
      addresses,
      orders
    });
  } catch (err) {
    console.error('Error fetching customer details:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/customers/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await pool.query('UPDATE users SET status = ? WHERE id = ?', [status || 'active', id]);
    await logAudit(null, 'Admin', 'UPDATE_CUSTOMER_STATUS', 'User', id, `Changed status to ${status}`, req);
    res.json({ success: true, status });
  } catch (err) {
    console.error('Error updating customer status:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/customers/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    const { customerNotes } = req.body;
    await pool.query('UPDATE users SET customer_notes = ? WHERE id = ?', [customerNotes || '', id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating customer notes:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. RETURNS & REFUNDS API
// ==========================================
router.get('/returns', async (req, res) => {
  try {
    const userId = req.query.userId;
    let query = 'SELECT * FROM returns_refunds ORDER BY id DESC';
    let params = [];
    if (userId) {
      query = 'SELECT * FROM returns_refunds WHERE user_id = ? ORDER BY id DESC';
      params = [userId];
    }
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching returns:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/returns', async (req, res) => {
  try {
    const orderId = req.body.orderId || req.body.order_id;
    const userName = (req.body.userName || req.body.customerName || req.body.name || '').trim();
    const userEmail = (req.body.userEmail || req.body.customerEmail || req.body.email || '').trim();
    const userPhone = (req.body.userPhone || req.body.customerPhone || req.body.phone || '').trim();
    const userId = req.body.userId || req.body.user_id || null;
    const reason = (req.body.reason || '').trim();
    const explanation = req.body.explanation || req.body.customerNotes || req.body.notes || '';
    const productDetails = req.body.productDetails || (Array.isArray(req.body.items) ? req.body.items.map(i => `${i.quantity || 1}x ${i.name || i.title}`).join(', ') : req.body.items) || 'Gadget Item';
    const evidenceUrl = req.body.evidenceUrl || '';

    if (!orderId || !userName || !reason) {
      return res.status(400).json({ error: 'Order ID, Customer Name, and Reason are required' });
    }

    const [result] = await pool.query(
      `INSERT INTO returns_refunds (order_id, user_id, user_name, user_email, user_phone, product_details, reason, explanation, evidence_url, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Requested')`,
      [orderId, userId || null, userName, userEmail || '', userPhone || '', productDetails || 'Gadget Item', reason, explanation, evidenceUrl]
    );

    try {
      await createNotification(null, 'admin', 'New Return Request', `Customer ${userName} requested return for Order #${orderId}`, 'return', '/admin?tab=returns');
      await recordOrderActivity(orderId, 'Return Requested', `Reason: ${reason}`, userName);
    } catch (notifErr) {
      // Non-blocking notification
    }

    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    console.error('Error creating return request:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/returns/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, refundAmount = 0, adminNotes = '' } = req.body;

    const [curr] = await pool.query('SELECT * FROM returns_refunds WHERE id = ?', [id]);
    if (curr.length === 0) return res.status(404).json({ error: 'Return request not found' });
    const ret = curr[0];

    await pool.query(
      `UPDATE returns_refunds 
       SET status = ?, refund_amount = ?, admin_notes = ?
       WHERE id = ?`,
      [status, refundAmount, adminNotes, id]
    );

    // If refund completed, record a financial transaction
    if (status === 'Refunded' && Number(refundAmount) > 0) {
      await pool.query(
        `INSERT INTO financial_transactions (order_id, transaction_type, payment_method, amount, account, status, note)
         VALUES (?, 'Refund', 'Bank Transfer', ?, 'Bank Account', 'Completed', ?)`,
        [ret.order_id, refundAmount, `Refund processed for return request #${id}. ${adminNotes}`]
      );
    }

    // Customer notification
    if (ret.user_id) {
      await createNotification(ret.user_id, 'customer', 'Return Update', `Your return request for Order #${ret.order_id} is now: ${status}`, 'return', '/account');
    }

    await recordOrderActivity(ret.order_id, `Return ${status}`, adminNotes || `Return #${id} updated to ${status}`, 'Admin');
    await logAudit(null, 'Admin', 'UPDATE_RETURN_STATUS', 'Return', id, `Status set to ${status}, refund Rs. ${refundAmount}`, req);

    res.json({ success: true });
  } catch (err) {
    console.error('Error updating return status:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. ABANDONED CARTS API
// ==========================================
router.get('/abandoned-carts', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM abandoned_carts ORDER BY last_activity DESC');
    res.json(rows.map(r => ({
      ...r,
      items: typeof r.items === 'string' ? JSON.parse(r.items || '[]') : (r.items || [])
    })));
  } catch (err) {
    console.error('Error fetching abandoned carts:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/abandoned-carts', async (req, res) => {
  try {
    const { userId, customerName = '', customerEmail = '', customerPhone = '', items = [], cartValue = 0 } = req.body;
    if (!items || items.length === 0) return res.json({ success: false, message: 'Empty cart' });

    const recoveryToken = 'rec_' + Math.random().toString(36).substring(2, 10);
    const itemsJson = JSON.stringify(items);

    const [result] = await pool.query(
      `INSERT INTO abandoned_carts (user_id, customer_name, customer_email, customer_phone, items, cart_value, recovery_token, recovery_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Abandoned')`,
      [userId || null, customerName, customerEmail, customerPhone, itemsJson, cartValue, recoveryToken]
    );

    res.status(201).json({ success: true, id: result.insertId, recoveryToken });
  } catch (err) {
    console.error('Error logging abandoned cart:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/abandoned-carts/:id/recover', async (req, res) => {
  try {
    const { id } = req.params;
    const { status = 'Recovered' } = req.body;
    await pool.query('UPDATE abandoned_carts SET recovery_status = ? WHERE id = ?', [status, id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error recovering cart:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. INVENTORY & STOCK LEDGER
// ==========================================
router.get('/inventory', async (req, res) => {
  try {
    const [products] = await pool.query(`
      SELECT 
        id, name, sku, category, price, costPrice, stock, low_stock_threshold, status, image
      FROM products 
      ORDER BY stock ASC, id DESC
    `);

    const totalStockValuation = products.reduce((acc, p) => {
      const cost = parseFloat(String(p.costPrice || '0').replace(/^[^\d]+/, '').replace(/,/g, '')) || 0;
      return acc + (cost * (p.stock || 0));
    }, 0);

    const lowStockCount = products.filter(p => (p.stock || 0) <= (p.low_stock_threshold || 5) && (p.stock || 0) > 0).length;
    const outOfStockCount = products.filter(p => (p.stock || 0) === 0).length;

    res.json({
      products,
      summary: {
        totalProducts: products.length,
        totalStockValuation,
        lowStockCount,
        outOfStockCount
      }
    });
  } catch (err) {
    console.error('Error fetching inventory:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/inventory/adjustment', async (req, res) => {
  try {
    const { productId, quantityChange, movementType = 'Manual Adjustment', reason = '', admin = 'Admin' } = req.body;
    if (!productId || quantityChange === undefined) {
      return res.status(400).json({ error: 'Product ID and Quantity Change are required' });
    }

    const [pRows] = await pool.query('SELECT name FROM products WHERE id = ?', [productId]);
    if (pRows.length === 0) return res.status(404).json({ error: 'Product not found' });

    await recordStockMovement(productId, pRows[0].name, '', Number(quantityChange), movementType, reason, admin);
    await logAudit(null, admin, 'STOCK_ADJUSTMENT', 'Product', productId, `Qty change: ${quantityChange}. Reason: ${reason}`, req);

    res.json({ success: true });
  } catch (err) {
    console.error('Error adjusting inventory:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/inventory/movements', async (req, res) => {
  try {
    const { productId } = req.query;
    let query = 'SELECT * FROM inventory_movements ORDER BY id DESC LIMIT 200';
    let params = [];
    if (productId) {
      query = 'SELECT * FROM inventory_movements WHERE product_id = ? ORDER BY id DESC';
      params = [productId];
    }
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching movements:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 7. COUPONS & DISCOUNTS API
// ==========================================
router.get('/coupons', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM coupons ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching coupons:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/coupons', async (req, res) => {
  try {
    const { code, type = 'percentage', value, minOrderValue = 0, maxDiscount = 0, expiryDate = null, usageLimit = 0, category = '' } = req.body;
    if (!code || !value) return res.status(400).json({ error: 'Coupon code and value are required' });

    const cleanCode = code.trim().toUpperCase();
    const [result] = await pool.query(
      `INSERT INTO coupons (code, type, value, min_order_value, max_discount, expiry_date, usage_limit, category, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [cleanCode, type, value, minOrderValue, maxDiscount, expiryDate, usageLimit, category]
    );

    res.status(201).json({ success: true, id: result.insertId, code: cleanCode });
  } catch (err) {
    console.error('Error creating coupon:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/coupons/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    await pool.query('UPDATE coupons SET is_active = ? WHERE id = ?', [is_active ? 1 : 0, id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating coupon:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/coupons/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM coupons WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting coupon:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/coupons/validate', async (req, res) => {
  try {
    const { code } = req.body;
    const cartTotal = Number(req.body.cartTotal ?? req.body.orderSubtotal ?? req.body.subtotal ?? 0);
    if (!code) return res.status(400).json({ valid: false, error: 'Coupon code required', message: 'Coupon code required' });

    const [rows] = await pool.query('SELECT * FROM coupons WHERE UPPER(code) = UPPER(?) AND is_active = TRUE', [code.trim()]);
    if (rows.length === 0) return res.status(404).json({ valid: false, message: 'Invalid or inactive coupon code' });

    const c = rows[0];
    if (c.expiry_date && new Date(c.expiry_date) < new Date()) {
      return res.status(400).json({ valid: false, message: 'Coupon code has expired' });
    }
    if (c.usage_limit > 0 && c.times_used >= c.usage_limit) {
      return res.status(400).json({ valid: false, message: 'Coupon usage limit reached' });
    }
    const minOrder = Number(c.min_order_value || 0);
    if (cartTotal < minOrder) {
      return res.status(400).json({ valid: false, message: `Minimum cart value of Rs. ${minOrder.toLocaleString()} required for this coupon` });
    }

    let discount = 0;
    if (c.type === 'percentage') {
      discount = Math.round((cartTotal * Number(c.value)) / 100);
      if (c.max_discount > 0 && discount > Number(c.max_discount)) {
        discount = Number(c.max_discount);
      }
    } else {
      discount = Number(c.value);
    }

    discount = Math.min(discount, cartTotal);

    res.json({
      valid: true,
      code: c.code,
      discount,
      discountAmount: discount,
      type: c.type,
      value: Number(c.value),
      coupon: c,
      message: `Coupon applied: Rs. ${discount.toLocaleString()} savings!`
    });
  } catch (err) {
    console.error('Error validating coupon:', err);
    res.status(500).json({ valid: false, error: err.message, message: 'Server error validating coupon' });
  }
});

// ==========================================
// 8. FINANCIALS & COD SETTLEMENT
// ==========================================
router.get('/finances/summary', async (req, res) => {
  try {
    const [orders] = await pool.query('SELECT price, status, payment_method, payment_status, courier FROM orders');
    const [expenses] = await pool.query('SELECT amount, category, paidFrom FROM expenses');
    const [refunds] = await pool.query('SELECT refund_amount FROM returns_refunds WHERE status = "Refunded"');
    const [transactions] = await pool.query('SELECT amount, account, transaction_type FROM financial_transactions WHERE status = "Completed"');

    const parsePrice = (str) => {
      if (!str) return 0;
      const cleaned = String(str).replace(/^[^\d]+/, '').replace(/,/g, '');
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    };

    let grossSales = 0;
    let deliveredSales = 0;
    let codReceivables = 0;

    orders.forEach(o => {
      const amount = parsePrice(o.price);
      const st = (o.status || '').toLowerCase();
      if (st !== 'cancelled') {
        grossSales += amount;
      }
      if (st === 'delivered') {
        deliveredSales += amount;
      }
      if (st === 'shipped' || (st === 'delivered' && o.payment_status !== 'Paid')) {
        codReceivables += amount;
      }
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const totalRefunds = refunds.reduce((sum, r) => sum + Number(r.refund_amount || 0), 0);

    // Approximate COGS at 55% of delivered sales if cost not populated
    const cogs = deliveredSales * 0.55;
    const grossProfit = deliveredSales - cogs - totalRefunds;
    const netProfit = grossProfit - totalExpenses;

    let cashBalance = 50000;
    let bankBalance = 150000;

    expenses.forEach(e => {
      if (e.paidFrom === 'Cash in Hand') cashBalance -= Number(e.amount || 0);
      else bankBalance -= Number(e.amount || 0);
    });

    transactions.forEach(t => {
      if (t.account === 'Cash in Hand') {
        cashBalance += t.transaction_type === 'Refund' ? -Number(t.amount) : Number(t.amount);
      } else {
        bankBalance += t.transaction_type === 'Refund' ? -Number(t.amount) : Number(t.amount);
      }
    });

    res.json({
      grossSales,
      deliveredSales,
      totalExpenses,
      totalRefunds,
      cogs,
      grossProfit,
      netProfit,
      codReceivables,
      cashBalance: Math.max(0, cashBalance),
      bankBalance: Math.max(0, bankBalance)
    });
  } catch (err) {
    console.error('Error fetching finances summary:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/payments/cod-settlement', async (req, res) => {
  try {
    const { courierName, amount, depositAccount = 'Bank Account', referenceNumber = '', note = '' } = req.body;
    if (!courierName || !amount) {
      return res.status(400).json({ error: 'Courier name and settlement amount required' });
    }

    await pool.query(
      `INSERT INTO financial_transactions (transaction_type, payment_method, transaction_ref, amount, account, status, note)
       VALUES ('COD Settlement', ?, ?, ?, ?, 'Completed', ?)`,
      [courierName, referenceNumber || 'SETTLE_' + Date.now(), Number(amount), depositAccount, note || `Courier settlement from ${courierName}`]
    );

    await logAudit(null, 'Admin', 'COD_SETTLEMENT', 'Courier', courierName, `Settled Rs. ${amount} to ${depositAccount}`, req);

    res.json({ success: true, message: `Settlement of Rs. ${Number(amount).toLocaleString()} recorded successfully.` });
  } catch (err) {
    console.error('Error recording COD settlement:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/payments', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM financial_transactions ORDER BY id DESC LIMIT 100');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching payments:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 9. SHIPPING & COURIER SETTINGS
// ==========================================
router.get('/shipping', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM shipping_settings WHERE id = 1');
    if (rows.length === 0) {
      return res.json({
        couriers: [
          { name: 'PostEx', enabled: true, cod: true },
          { name: 'Trax', enabled: true, cod: true },
          { name: 'TCS', enabled: true, cod: true },
          { name: 'Leopards', enabled: true, cod: true }
        ],
        city_rates: { 'Faisalabad': 150, 'Lahore': 200, 'Karachi': 250, 'Default': 250 },
        free_shipping_min: 5000,
        default_courier: 'PostEx'
      });
    }
    const r = rows[0];
    res.json({
      ...r,
      couriers: typeof r.couriers === 'string' ? JSON.parse(r.couriers || '[]') : (r.couriers || []),
      city_rates: typeof r.city_rates === 'string' ? JSON.parse(r.city_rates || '{}') : (r.city_rates || {}),
      tracking_templates: typeof r.tracking_templates === 'string' ? JSON.parse(r.tracking_templates || '{}') : (r.tracking_templates || {})
    });
  } catch (err) {
    console.error('Error fetching shipping settings:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/shipping', async (req, res) => {
  try {
    const { couriers, cityRates, freeShippingMin, defaultCourier, codEnabled } = req.body;
    await pool.query(
      `UPDATE shipping_settings
       SET couriers = ?, city_rates = ?, free_shipping_min = ?, default_courier = ?, cod_enabled = ?
       WHERE id = 1`,
      [JSON.stringify(couriers || []), JSON.stringify(cityRates || {}), freeShippingMin || 5000, defaultCourier || 'PostEx', codEnabled ? 1 : 0]
    );
    res.json({ success: true, message: 'Shipping settings updated' });
  } catch (err) {
    console.error('Error updating shipping settings:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 10. REVIEWS & RATINGS API
// ==========================================
router.get('/reviews', async (req, res) => {
  try {
    const { productId, status } = req.query;
    let query = 'SELECT * FROM reviews WHERE 1=1';
    let params = [];
    if (productId) {
      query += ' AND product_id = ?';
      params.push(productId);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    query += ' ORDER BY id DESC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/reviews', async (req, res) => {
  try {
    const { productId, productName, userId, userName, userEmail, rating, comment } = req.body;
    if (!productId || !userName || !rating || !comment) {
      return res.status(400).json({ error: 'Missing required review fields' });
    }

    const [result] = await pool.query(
      `INSERT INTO reviews (product_id, product_name, user_id, user_name, user_email, rating, comment, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Approved')`,
      [productId, productName || 'Product', userId || null, userName, userEmail || '', Math.max(1, Math.min(5, Number(rating))), comment]
    );

    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    console.error('Error posting review:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/reviews/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminReply } = req.body;
    await pool.query(
      'UPDATE reviews SET status = ?, admin_reply = ? WHERE id = ?',
      [status || 'Approved', adminReply || null, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating review:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/reviews/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM reviews WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting review:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 11. MARKETING CAMPAIGNS API
// ==========================================
router.get('/marketing', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM marketing_campaigns ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching marketing campaigns:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/marketing', async (req, res) => {
  try {
    const { title, type = 'banner', bannerImage = '', targetUrl = '', couponCode = '', status = 'Active' } = req.body;
    if (!title) return res.status(400).json({ error: 'Campaign title is required' });

    const [result] = await pool.query(
      `INSERT INTO marketing_campaigns (title, type, banner_image, target_url, coupon_code, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, type, bannerImage, targetUrl, couponCode, status]
    );

    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    console.error('Error creating campaign:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/marketing/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, type, bannerImage, targetUrl, couponCode, status } = req.body;
    await pool.query(
      `UPDATE marketing_campaigns 
       SET title = ?, type = ?, banner_image = ?, target_url = ?, coupon_code = ?, status = ?
       WHERE id = ?`,
      [title, type, bannerImage, targetUrl, couponCode, status, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating campaign:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/marketing/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM marketing_campaigns WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting campaign:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 12. PAGES & CONTENT CMS API
// ==========================================
router.get('/pages', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM pages_content ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching pages:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/pages/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const [rows] = await pool.query('SELECT * FROM pages_content WHERE slug = ?', [slug]);
    if (rows.length === 0) return res.status(404).json({ error: 'Page not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching page content:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/pages/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { title, content } = req.body;
    await pool.query(
      `INSERT INTO pages_content (slug, title, content)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE title = VALUES(title), content = VALUES(content)`,
      [slug, title, content]
    );
    res.json({ success: true, message: 'Page saved' });
  } catch (err) {
    console.error('Error updating page:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 13. STAFF MEMBERS & PERMISSIONS
// ==========================================
router.get('/staff', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM staff_members ORDER BY id DESC');
    res.json(rows.map(r => ({
      ...r,
      permissions: typeof r.permissions === 'string' ? JSON.parse(r.permissions || '[]') : (r.permissions || [])
    })));
  } catch (err) {
    console.error('Error fetching staff:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/staff', async (req, res) => {
  try {
    const { name, email, role = 'Support Agent', permissions = [] } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });

    const [result] = await pool.query(
      `INSERT INTO staff_members (name, email, role, permissions, status)
       VALUES (?, ?, ?, ?, 'Active')`,
      [name, email.toLowerCase().trim(), role, JSON.stringify(permissions)]
    );

    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    console.error('Error adding staff member:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/staff/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { role, permissions, status } = req.body;
    await pool.query(
      `UPDATE staff_members 
       SET role = ?, permissions = ?, status = ?
       WHERE id = ?`,
      [role, JSON.stringify(permissions || []), status || 'Active', id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating staff member:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/staff/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM staff_members WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting staff member:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 14. IN-STORE APPOINTMENTS API
// ==========================================
router.get('/appointments', async (req, res) => {
  try {
    const userId = req.query.userId;
    let query = 'SELECT * FROM appointments ORDER BY id DESC';
    let params = [];
    if (userId) {
      query = 'SELECT * FROM appointments WHERE user_id = ? ORDER BY id DESC';
      params = [userId];
    }
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching appointments:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/appointments', async (req, res) => {
  try {
    const { userId, customerName, phone, email, appointmentType, preferredDate, preferredTime, deviceName = '', problemDescription = '' } = req.body;
    if (!customerName || !phone || !appointmentType || !preferredDate || !preferredTime) {
      return res.status(400).json({ error: 'Please provide name, phone, appointment type, date and time.' });
    }

    // Check for slot conflicts
    const [conflicts] = await pool.query(
      'SELECT id FROM appointments WHERE preferred_date = ? AND preferred_time = ? AND status != "Cancelled"',
      [preferredDate, preferredTime]
    );
    if (conflicts.length >= 3) {
      return res.status(409).json({ error: 'This time slot is fully booked. Please select another time or date.' });
    }

    const [result] = await pool.query(
      `INSERT INTO appointments (user_id, customer_name, phone, email, appointment_type, preferred_date, preferred_time, device_name, problem_description, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Confirmed')`,
      [userId || null, customerName, phone, email || '', appointmentType, preferredDate, preferredTime, deviceName, problemDescription]
    );

    await createNotification(null, 'admin', 'New Appointment Booking', `${customerName} booked "${appointmentType}" for ${preferredDate} at ${preferredTime}`, 'appointment', '/admin?tab=store');

    res.status(201).json({ success: true, id: result.insertId, message: 'Appointment booked successfully!' });
  } catch (err) {
    console.error('Error booking appointment:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/appointments/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes = '' } = req.body;
    await pool.query('UPDATE appointments SET status = ?, admin_notes = ? WHERE id = ?', [status, adminNotes, id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating appointment:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 15. NOTIFICATIONS API
// ==========================================
router.get('/notifications', async (req, res) => {
  try {
    const { userId, role = 'admin' } = req.query;
    let query = 'SELECT * FROM notifications WHERE recipient_role = ? OR recipient_role = "all"';
    let params = [role];

    if (userId) {
      query += ' OR user_id = ?';
      params.push(userId);
    }
    query += ' ORDER BY id DESC LIMIT 50';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error marking notification read:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/notifications/read-all', async (req, res) => {
  try {
    const { role = 'admin', userId } = req.body;
    let query = 'UPDATE notifications SET is_read = TRUE WHERE (recipient_role = ? OR recipient_role = "all")';
    let params = [role];
    if (userId) {
      query += ' OR user_id = ?';
      params.push(userId);
    }
    await pool.query(query, params);
    res.json({ success: true });
  } catch (err) {
    console.error('Error marking all notifications read:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 16. AUDIT LOGS
// ==========================================
router.get('/audit-logs', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 100');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 17. INTEGRATIONS SETTINGS
// ==========================================
router.get('/integrations', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM integrations_settings ORDER BY id ASC');
    if (rows.length === 0) {
      // Default supported integrations
      const defaults = [
        { key: 'postex', name: 'PostEx Courier', category: 'Courier', config: { token: '***', webhookUrl: '/api/webhooks/postex' }, enabled: true },
        { key: 'trax', name: 'Trax Logistics', category: 'Courier', config: { apiKey: '***' }, enabled: true },
        { key: 'jazzcash', name: 'JazzCash Payment', category: 'Payment', config: { merchantId: '***' }, enabled: false },
        { key: 'easypaisa', name: 'Easypaisa Gateway', category: 'Payment', config: { storeId: '***' }, enabled: false },
        { key: 'whatsapp', name: 'WhatsApp Business API', category: 'Marketing', config: { phoneId: '***' }, enabled: false },
        { key: 'smtp', name: 'Cloudflare / SMTP Email', category: 'Email', config: { host: 'smtp.cloudflare.com' }, enabled: true },
        { key: 'meta_pixel', name: 'Meta Pixel & Conversion API', category: 'Analytics', config: { pixelId: '987654321' }, enabled: true }
      ];
      for (const d of defaults) {
        await pool.query(
          `INSERT INTO integrations_settings (integration_key, name, category, config, is_enabled, status)
           VALUES (?, ?, ?, ?, ?, 'Configured')`,
          [d.key, d.name, d.category, JSON.stringify(d.config), d.enabled ? 1 : 0]
        );
      }
      const [reRows] = await pool.query('SELECT * FROM integrations_settings');
      return res.json(reRows.map(r => ({ ...r, config: JSON.parse(r.config || '{}') })));
    }
    res.json(rows.map(r => ({
      ...r,
      config: typeof r.config === 'string' ? JSON.parse(r.config || '{}') : (r.config || {})
    })));
  } catch (err) {
    console.error('Error fetching integrations:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/integrations/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { config, is_enabled } = req.body;
    await pool.query(
      `UPDATE integrations_settings 
       SET config = ?, is_enabled = ?, last_tested_at = NOW()
       WHERE integration_key = ?`,
      [JSON.stringify(config || {}), is_enabled ? 1 : 0, key]
    );
    res.json({ success: true, message: `${key} integration updated` });
  } catch (err) {
    console.error('Error updating integration:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
