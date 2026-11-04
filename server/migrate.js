import { pool } from './db.js';

export async function runMigrations() {
  const connection = await pool.getConnection();
  try {
    console.log('🔄 Running database migrations...');

    const safeAddColumn = async (table, colName, colType) => {
      try {
        const [existing] = await connection.query(
          `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
          [table, colName]
        );
        if (existing.length === 0) {
          await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${colName}\` ${colType}`);
          console.log(`✅ Added column \`${colName}\` to \`${table}\``);
        }
      } catch (err) {
        console.warn(`safeAddColumn error on ${table}.${colName}:`, err.message);
      }
    };

    // 1. Addresses table for multiple customer delivery destinations
    await connection.query(`
      CREATE TABLE IF NOT EXISTS addresses (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        label VARCHAR(50) DEFAULT 'Home',
        recipient_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        city VARCHAR(100) NOT NULL,
        area VARCHAR(150) DEFAULT '',
        street VARCHAR(255) DEFAULT '',
        house_number VARCHAR(100) DEFAULT '',
        landmark VARCHAR(255) DEFAULT '',
        instructions TEXT,
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Order activity timeline
    await connection.query(`
      CREATE TABLE IF NOT EXISTS order_activity (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        order_id BIGINT NOT NULL,
        status VARCHAR(50) NOT NULL,
        note TEXT,
        actor VARCHAR(100) DEFAULT 'System',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_order_id (order_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. Returns & Refunds
    await connection.query(`
      CREATE TABLE IF NOT EXISTS returns_refunds (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        order_id BIGINT NOT NULL,
        user_id INT DEFAULT NULL,
        user_name VARCHAR(255) NOT NULL,
        user_email VARCHAR(255) DEFAULT '',
        user_phone VARCHAR(50) DEFAULT '',
        product_details TEXT NOT NULL,
        reason VARCHAR(255) NOT NULL,
        explanation TEXT,
        evidence_url TEXT,
        status VARCHAR(50) DEFAULT 'Requested',
        refund_amount DECIMAL(12,2) DEFAULT 0.00,
        admin_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_order_id (order_id),
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. Abandoned Carts
    await connection.query(`
      CREATE TABLE IF NOT EXISTS abandoned_carts (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id INT DEFAULT NULL,
        customer_name VARCHAR(255) DEFAULT '',
        customer_email VARCHAR(255) DEFAULT '',
        customer_phone VARCHAR(50) DEFAULT '',
        items JSON NOT NULL,
        cart_value DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        recovery_status VARCHAR(50) DEFAULT 'Abandoned',
        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        recovery_token VARCHAR(100) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. Inventory Movements Ledger
    await connection.query(`
      CREATE TABLE IF NOT EXISTS inventory_movements (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        product_id BIGINT NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        variant_id VARCHAR(100) DEFAULT '',
        previous_quantity INT NOT NULL,
        quantity_changed INT NOT NULL,
        new_quantity INT NOT NULL,
        movement_type VARCHAR(50) NOT NULL,
        reason VARCHAR(255) DEFAULT '',
        responsible_admin VARCHAR(100) DEFAULT 'Admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_product_id (product_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 6. Coupons & Discounts
    await connection.query(`
      CREATE TABLE IF NOT EXISTS coupons (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        type ENUM('percentage', 'fixed') DEFAULT 'percentage',
        value DECIMAL(10,2) NOT NULL,
        min_order_value DECIMAL(10,2) DEFAULT 0.00,
        max_discount DECIMAL(10,2) DEFAULT 0.00,
        expiry_date DATE DEFAULT NULL,
        usage_limit INT DEFAULT 0,
        times_used INT DEFAULT 0,
        customer_limit INT DEFAULT 1,
        category VARCHAR(100) DEFAULT '',
        product_id BIGINT DEFAULT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 7. Financial Transactions & Payments
    await connection.query(`
      CREATE TABLE IF NOT EXISTS financial_transactions (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        order_id BIGINT DEFAULT NULL,
        transaction_type VARCHAR(50) NOT NULL,
        payment_method VARCHAR(100) NOT NULL,
        transaction_ref VARCHAR(150) DEFAULT '',
        amount DECIMAL(12,2) NOT NULL,
        account VARCHAR(50) NOT NULL DEFAULT 'Cash in Hand',
        status VARCHAR(50) DEFAULT 'Completed',
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_order_id (order_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 8. Shipping Settings & Couriers
    await connection.query(`
      CREATE TABLE IF NOT EXISTS shipping_settings (
        id INT PRIMARY KEY DEFAULT 1,
        couriers JSON,
        city_rates JSON,
        free_shipping_min DECIMAL(10,2) DEFAULT 5000.00,
        default_courier VARCHAR(100) DEFAULT 'PostEx',
        cod_enabled BOOLEAN DEFAULT TRUE,
        tracking_templates JSON,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 9. Customer Reviews & Ratings
    await connection.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        product_id BIGINT NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        user_id INT DEFAULT NULL,
        user_name VARCHAR(255) NOT NULL,
        user_email VARCHAR(255) DEFAULT '',
        rating INT NOT NULL CHECK(rating >= 1 AND rating <= 5),
        comment TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'Approved',
        admin_reply TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_product_id (product_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 10. Marketing Campaigns
    await connection.query(`
      CREATE TABLE IF NOT EXISTS marketing_campaigns (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        type VARCHAR(50) DEFAULT 'banner',
        banner_image TEXT,
        target_url TEXT,
        coupon_code VARCHAR(50) DEFAULT '',
        status VARCHAR(50) DEFAULT 'Active',
        views INT DEFAULT 0,
        clicks INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 11. Pages & Content (CMS)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS pages_content (
        id INT AUTO_INCREMENT PRIMARY KEY,
        slug VARCHAR(100) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        content LONGTEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 12. Staff Members & Custom Permissions
    await connection.query(`
      CREATE TABLE IF NOT EXISTS staff_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT DEFAULT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        role VARCHAR(50) NOT NULL DEFAULT 'Support Agent',
        permissions JSON,
        status VARCHAR(50) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 13. Audit Logs
    await connection.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id INT DEFAULT NULL,
        user_email VARCHAR(255) DEFAULT '',
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(100) NOT NULL,
        entity_id VARCHAR(100) DEFAULT '',
        details TEXT,
        ip_address VARCHAR(50) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_action (action)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 14. Notifications System
    await connection.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id INT DEFAULT NULL,
        recipient_role VARCHAR(50) DEFAULT 'all',
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'order',
        link VARCHAR(255) DEFAULT '',
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_is_read (is_read)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 15. In-Store Appointments
    await connection.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id INT DEFAULT NULL,
        customer_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        email VARCHAR(255) DEFAULT '',
        appointment_type VARCHAR(100) NOT NULL,
        preferred_date VARCHAR(50) NOT NULL,
        preferred_time VARCHAR(50) NOT NULL,
        device_name VARCHAR(150) DEFAULT '',
        problem_description TEXT,
        status VARCHAR(50) DEFAULT 'Pending',
        admin_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 16. Integrations Settings
    await connection.query(`
      CREATE TABLE IF NOT EXISTS integrations_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        integration_key VARCHAR(100) NOT NULL UNIQUE,
        name VARCHAR(150) NOT NULL,
        category VARCHAR(50) NOT NULL,
        config JSON,
        is_enabled BOOLEAN DEFAULT FALSE,
        status VARCHAR(50) DEFAULT 'Configured',
        last_tested_at DATETIME DEFAULT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Safe column extensions
    await safeAddColumn('orders', 'subtotal', "VARCHAR(100) DEFAULT '0'");
    await safeAddColumn('orders', 'shipping_charges', "VARCHAR(100) DEFAULT '0'");
    await safeAddColumn('orders', 'discount_amount', "VARCHAR(100) DEFAULT '0'");
    await safeAddColumn('orders', 'payment_method', "VARCHAR(100) DEFAULT 'Cash on Delivery'");
    await safeAddColumn('orders', 'payment_status', "VARCHAR(50) DEFAULT 'Pending'");
    await safeAddColumn('orders', 'admin_notes', "TEXT");

    await safeAddColumn('products', 'sku', "VARCHAR(100) DEFAULT ''");
    await safeAddColumn('products', 'stock', "INT DEFAULT 15");
    await safeAddColumn('products', 'low_stock_threshold', "INT DEFAULT 5");
    await safeAddColumn('products', 'variants', "JSON");
    await safeAddColumn('products', 'featured', "BOOLEAN DEFAULT FALSE");
    await safeAddColumn('products', 'status', "VARCHAR(50) DEFAULT 'active'");
    await safeAddColumn('products', 'outOfStock', "BOOLEAN DEFAULT FALSE");

    await safeAddColumn('users', 'status', "VARCHAR(50) DEFAULT 'active'");
    await safeAddColumn('users', 'customer_notes', "TEXT");

    // Seed default shipping settings if empty
    const [shipRows] = await connection.query('SELECT COUNT(*) as count FROM shipping_settings');
    if (shipRows[0].count === 0) {
      await connection.query(`
        INSERT INTO shipping_settings (id, couriers, city_rates, free_shipping_min, default_courier, cod_enabled, tracking_templates)
        VALUES (1, ?, ?, 5000.00, 'PostEx', 1, ?)
      `, [
        JSON.stringify([
          { name: 'PostEx', enabled: true, cod: true },
          { name: 'Trax', enabled: true, cod: true },
          { name: 'Leopards', enabled: true, cod: true },
          { name: 'TCS', enabled: true, cod: true },
          { name: 'M&P', enabled: true, cod: true },
          { name: 'Call Courier', enabled: true, cod: true },
          { name: 'Rider / Own Delivery', enabled: true, cod: true },
        ]),
        JSON.stringify({
          'Faisalabad': 150,
          'Lahore': 200,
          'Karachi': 250,
          'Islamabad': 200,
          'Rawalpindi': 200,
          'Default': 250
        }),
        JSON.stringify({
          'PostEx': 'https://postex.pk/tracking?cn=',
          'Trax': 'https://sonic.pk/tracking?tracking_number=',
          'Leopards': 'https://www.leopardscourier.com/leopards-tracking?track_numbers=',
          'TCS': 'https://www.tcsexpress.com/tracking?track=',
          'M&P': 'https://mulphilog.com/tracking?consignmentNo='
        })
      ]);
      console.log('✅ Default shipping settings initialized');
    }

    // Seed default pages content if empty
    const [pageRows] = await connection.query('SELECT COUNT(*) as count FROM pages_content');
    if (pageRows[0].count === 0) {
      const defaultPages = [
        { slug: 'about-us', title: 'About I Care Gadget', content: 'Welcome to I Care Gadget Kohinoor City Faisalabad. We are premier retailers of 100% authentic Apple, Samsung, Google, and premium mobile accessories.' },
        { slug: 'privacy-policy', title: 'Privacy Policy', content: 'Your privacy is paramount. We only collect essential customer delivery information to process orders and provide live tracking.' },
        { slug: 'terms-and-conditions', title: 'Terms & Conditions', content: 'All gadget purchases are backed by genuine store warranty. Cash on delivery orders must be confirmed via phone before dispatch.' },
        { slug: 'shipping-policy', title: 'Shipping & Delivery Policy', content: 'Standard nationwide delivery takes 2 to 4 working days via our trusted courier partners PostEx, TCS, and Trax.' },
        { slug: 'return-refund-policy', title: 'Return & Refund Policy', content: 'We offer a 7-day hassle-free replacement warranty for defective or damaged items upon unboxing verification.' },
        { slug: 'faqs', title: 'Frequently Asked Questions', content: 'Q: Are your chargers original?\nA: Yes, all Apple 20W and Samsung 25W/45W chargers are 100% genuine with money-back guarantee.' }
      ];
      for (const p of defaultPages) {
        await connection.query('INSERT INTO pages_content (slug, title, content) VALUES (?, ?, ?)', [p.slug, p.title, p.content]);
      }
      console.log('✅ Default store pages initialized');
    }

    console.log('🚀 All database migrations completed successfully!');
  } finally {
    connection.release();
  }
}

// Allow direct execution: node server/migrate.js
if (process.argv[1]?.endsWith('migrate.js')) {
  runMigrations().then(() => {
    console.log('✅ Migration script finished.');
    process.exit(0);
  }).catch(err => {
    console.error('❌ Migration script error:', err);
    process.exit(1);
  });
}
