import React, { createContext, useState, useContext, useEffect } from 'react';

const StoreContext = createContext();

export const useStore = () => useContext(StoreContext);

export const StoreProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  }); 

  const [storeDetails, setStoreDetails] = useState(() => {
    const saved = localStorage.getItem('storeDetails');
    return saved ? JSON.parse(saved) : {
      address: 'Kohinoor City',
      hours: '10 AM - 10 PM',
      phone: '+92 300 1234567'
    };
  });

  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('products');
    return saved ? JSON.parse(saved) : [];
  });

  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('categories');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        delete parsed['Uncategorized'];
        return parsed;
      } catch (e) {}
    }
    return {
      'Mobiles': ['Samsung', 'Apple', 'Google', 'OnePlus', 'Xiaomi'],
      'Audio': ['Headphones', 'Earbuds', 'Speakers', 'AirPods'],
      'Accessories': ['Mobile Accessories', 'Laptop Accessories', 'Chargers', 'Cables', 'Power Banks', 'Screen Protectors'],
      'Smart Home': [],
      'Wearables': []
    };
  });

  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const [registeredCustomers, setRegisteredCustomers] = useState(() => {
    const saved = localStorage.getItem('registeredCustomers');
    return saved ? JSON.parse(saved) : [];
  });

  const [expenses, setExpenses] = useState(() => {
    try {
      const saved = localStorage.getItem('expenses');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Enterprise Store Modules State
  const [coupons, setCoupons] = useState(() => {
    try {
      const saved = localStorage.getItem('store_coupons');
      return saved ? JSON.parse(saved) : [
        { id: 1, code: 'WELCOME10', type: 'percentage', value: 10, minSpend: 2000, usageCount: 14, usageLimit: 100, expiry: '2026-12-31', active: true },
        { id: 2, code: 'ICARE500', type: 'fixed', value: 500, minSpend: 5000, usageCount: 6, usageLimit: 50, expiry: '2026-11-30', active: true }
      ];
    } catch {
      return [];
    }
  });

  const [returns, setReturns] = useState(() => {
    try {
      const saved = localStorage.getItem('store_returns');
      return saved ? JSON.parse(saved) : [
        { id: 'RET-101', orderId: '751417', customerName: 'Malik Azan', customerPhone: '+923190229789', product: '1x Iphone 17 pro', amount: 350000, reason: 'Defective charging port / screen glitch', status: 'Pending Review', date: 'Nov 3, 2026' }
      ];
    } catch {
      return [];
    }
  });

  const [abandonedCarts, setAbandonedCarts] = useState(() => {
    try {
      const saved = localStorage.getItem('store_abandoned_carts');
      return saved ? JSON.parse(saved) : [
        { id: 'AB-882', customerName: 'Usman Ali', phone: '+923001234567', email: 'usman@gmail.com', items: '20W Fast Charger + Braided Cable', total: 6500, date: 'Nov 3, 2026, 8:45 PM', status: 'Uncontacted' },
        { id: 'AB-883', customerName: 'Zain Tariq', phone: '+923214567890', email: 'zain@gmail.com', items: 'AirPods Pro Case', total: 3200, date: 'Nov 2, 2026, 3:10 PM', status: 'Reminded' }
      ];
    } catch {
      return [];
    }
  });

  const [reviews, setReviews] = useState(() => {
    try {
      const saved = localStorage.getItem('store_reviews');
      return saved ? JSON.parse(saved) : [
        { id: 1, productName: 'Apple 20W USB-C Power Adapter', customerName: 'Faisal Mehmood', rating: 5, comment: '100% genuine charger, charges my iPhone rapidly without any heating issues. Excellent store!', date: 'Nov 2, 2026', status: 'Published', reply: 'Thank you for your valuable feedback, Faisal! Glad you loved it.' },
        { id: 2, productName: 'AirPods Pro 2nd Gen', customerName: 'Hamza Khan', rating: 4, comment: 'Sound quality is great and ANC works nicely. Dispatch was fast within 2 days.', date: 'Nov 1, 2026', status: 'Published', reply: '' }
      ];
    } catch {
      return [];
    }
  });

  const [shippingSettings, setShippingSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('store_shipping');
      return saved ? JSON.parse(saved) : {
        flatRate: 200,
        freeShippingThreshold: 5000,
        defaultCourier: 'PostEx',
        originCity: 'Faisalabad (Kohinoor City)',
        estimatedDays: '2-4 Business Days',
        couriers: ['PostEx', 'TCS', 'Trax', 'Leopards']
      };
    } catch {
      return { flatRate: 200, freeShippingThreshold: 5000, defaultCourier: 'PostEx', originCity: 'Faisalabad', estimatedDays: '2-4 Days', couriers: ['PostEx', 'TCS', 'Trax', 'Leopards'] };
    }
  });

  const [integrations, setIntegrations] = useState(() => {
    try {
      const saved = localStorage.getItem('store_integrations');
      return saved ? JSON.parse(saved) : {
        metaPixelId: '108429402948291',
        tiktokPixelId: 'C890K19412',
        ga4Id: 'G-7X9Y1Z2',
        whatsappNumber: '+923190229789',
        whatsappApiKey: ''
      };
    } catch {
      return { metaPixelId: '', tiktokPixelId: '', ga4Id: '', whatsappNumber: '+923190229789', whatsappApiKey: '' };
    }
  });

  const [staffMembers, setStaffMembers] = useState(() => {
    try {
      const saved = localStorage.getItem('store_staff');
      return saved ? JSON.parse(saved) : [
        { id: 1, name: 'Malik Azan', email: 'admin@icaregadget.store', role: 'Super Admin', status: 'Active', lastLogin: 'Today, 2:15 AM' },
        { id: 2, name: 'Faisal Staff', email: 'support@icaregadget.store', role: 'Order Manager', status: 'Active', lastLogin: 'Yesterday, 6:30 PM' }
      ];
    } catch {
      return [];
    }
  });

  const [storePages, setStorePages] = useState(() => {
    try {
      const saved = localStorage.getItem('store_pages');
      return saved ? JSON.parse(saved) : {
        about: "I Care Gadget is Pakistan's premier destination for 100% authentic Apple accessories, fast chargers, earbuds, and premium smartphone gadgets. Located at Kohinoor City, we provide nationwide fast dispatch and customer satisfaction guarantee.",
        shipping: "All nationwide orders are dispatched within 24 hours via premier courier partners (PostEx, TCS, Trax). Estimated delivery time is 2-4 business days. Free shipping applies automatically on all orders above Rs. 5,000.",
        returns: "We offer an easy 7-day replacement warranty on manufacturing defects. Items must be returned in original packaging with provided consignment receipts.",
        terms: "By placing an order on I Care Gadget, you agree to our verification and delivery policies. Cash on Delivery is available across all major cities of Pakistan.",
        faq: "Q: Are your chargers authentic Apple?\nA: Yes, 100% original authentic accessories with warranty.\n\nQ: How do I track my order?\nA: Use your Order ID or CN tracking number on our Track Order page or ask our AI assistant!"
      };
    } catch {
      return {};
    }
  });

  const [productStocks, setProductStocks] = useState(() => {
    try {
      const saved = localStorage.getItem('store_product_stocks');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Sync new modules to localStorage
  useEffect(() => { try { localStorage.setItem('store_coupons', JSON.stringify(coupons)); } catch(e){} }, [coupons]);
  useEffect(() => { try { localStorage.setItem('store_returns', JSON.stringify(returns)); } catch(e){} }, [returns]);
  useEffect(() => { try { localStorage.setItem('store_abandoned_carts', JSON.stringify(abandonedCarts)); } catch(e){} }, [abandonedCarts]);
  useEffect(() => { try { localStorage.setItem('store_reviews', JSON.stringify(reviews)); } catch(e){} }, [reviews]);
  useEffect(() => { try { localStorage.setItem('store_shipping', JSON.stringify(shippingSettings)); } catch(e){} }, [shippingSettings]);
  useEffect(() => { try { localStorage.setItem('store_integrations', JSON.stringify(integrations)); } catch(e){} }, [integrations]);
  useEffect(() => { try { localStorage.setItem('store_staff', JSON.stringify(staffMembers)); } catch(e){} }, [staffMembers]);
  useEffect(() => { try { localStorage.setItem('store_pages', JSON.stringify(storePages)); } catch(e){} }, [storePages]);
  useEffect(() => { try { localStorage.setItem('store_product_stocks', JSON.stringify(productStocks)); } catch(e){} }, [productStocks]);

  // Sync to localStorage as offline cache
  useEffect(() => { try { localStorage.setItem('user', JSON.stringify(user)); } catch(e){} }, [user]);
  useEffect(() => { try { localStorage.setItem('registeredCustomers', JSON.stringify(registeredCustomers)); } catch(e){} }, [registeredCustomers]);
  useEffect(() => { try { localStorage.setItem('storeDetails', JSON.stringify(storeDetails)); } catch(e){} }, [storeDetails]);
  useEffect(() => { try { localStorage.setItem('products', JSON.stringify(products)); } catch(e){} }, [products]);
  useEffect(() => { try { localStorage.setItem('orders', JSON.stringify(orders)); } catch(e){} }, [orders]);
  useEffect(() => { try { localStorage.setItem('cart', JSON.stringify(cart)); } catch(e){} }, [cart]);
  useEffect(() => { try { localStorage.setItem('categories', JSON.stringify(categories)); } catch(e){} }, [categories]);
  useEffect(() => { try { localStorage.setItem('expenses', JSON.stringify(expenses)); } catch(e){} }, [expenses]);

  // Load from MySQL backend on initial mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [prodRes, catRes, orderRes, storeRes, expRes] = await Promise.all([
          fetch('/api/products').catch(() => null),
          fetch('/api/categories').catch(() => null),
          fetch('/api/orders').catch(() => null),
          fetch('/api/store-details').catch(() => null),
          fetch('/api/expenses').catch(() => null)
        ]);

        if (prodRes && prodRes.ok) {
          const prodData = await prodRes.json();
          if (Array.isArray(prodData) && prodData.length > 0) {
            setProducts(prodData);
          }
        }
        if (catRes && catRes.ok) {
          const catData = await catRes.json();
          if (catData && Object.keys(catData).length > 0) {
            setCategories(catData);
          }
        }
        if (orderRes && orderRes.ok) {
          const orderData = await orderRes.json();
          if (Array.isArray(orderData) && orderData.length > 0) {
            setOrders(orderData);
          }
        }
        if (storeRes && storeRes.ok) {
          const storeData = await storeRes.json();
          if (storeData && storeData.address) {
            setStoreDetails(storeData);
          }
        }
        if (expRes && expRes.ok) {
          const expData = await expRes.json();
          if (Array.isArray(expData)) {
            setExpenses(expData);
          }
        }
      } catch (err) {
        console.error('Failed to load data from MySQL API:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Product operations backed by MySQL
  const addProduct = async (product) => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
      if (res.ok) {
        const newProduct = await res.json();
        setProducts(prev => [newProduct, ...prev]);
        return newProduct;
      }
    } catch (err) {
      console.error('Failed to save product to database:', err);
    }
    const fallback = { ...product, id: Date.now() };
    setProducts(prev => [fallback, ...prev]);
    return fallback;
  };

  const updateProduct = async (id, updatedData) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      if (res.ok) {
        const updated = await res.json();
        setProducts(prev => prev.map(p => p.id === id ? updated : p));
        return updated;
      }
    } catch (err) {
      console.error('Failed to update product in database:', err);
    }
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updatedData } : p));
  };

  const deleteProduct = async (id) => {
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete product from database:', err);
    }
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const updateStoreDetails = async (details) => {
    try {
      const res = await fetch('/api/store-details', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(details)
      });
      if (res.ok) {
        const updated = await res.json();
        setStoreDetails(updated);
        return updated;
      }
    } catch (err) {
      console.error('Failed to update store details in database:', err);
    }
    setStoreDetails(prev => ({ ...prev, ...details }));
  };

  // Category operations backed by MySQL
  const addCategory = async (name) => {
    if (!name || name === 'Uncategorized') return;
    try {
      await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
    } catch (err) {
      console.error('Failed to add category to database:', err);
    }
    setCategories(prev => {
      if (!prev[name]) {
        return { ...prev, [name]: [] };
      }
      return prev;
    });
  };
  
  const deleteCategory = async (name) => {
    try {
      await fetch(`/api/categories/${encodeURIComponent(name)}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete category from database:', err);
    }
    setCategories(prev => {
      const newCats = { ...prev };
      delete newCats[name];
      return newCats;
    });
    setProducts(prev => prev.map(p => p.category === name ? { ...p, category: 'Uncategorized', subCategory: '' } : p));
  };
  
  const addSubCategory = async (catName, subName) => {
    try {
      await fetch(`/api/categories/${encodeURIComponent(catName)}/subcategories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subCategory: subName })
      });
    } catch (err) {
      console.error('Failed to add subcategory to database:', err);
    }
    setCategories(prev => {
      if (prev[catName] && !prev[catName].includes(subName)) {
        return { ...prev, [catName]: [...prev[catName], subName] };
      }
      return prev;
    });
  };
  
  const deleteSubCategory = async (catName, subName) => {
    try {
      await fetch(`/api/categories/${encodeURIComponent(catName)}/subcategories/${encodeURIComponent(subName)}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.error('Failed to delete subcategory from database:', err);
    }
    setCategories(prev => {
      if (prev[catName]) {
        return { ...prev, [catName]: prev[catName].filter(s => s !== subName) };
      }
      return prev;
    });
    setProducts(prev => prev.map(p => p.category === catName && p.subCategory === subName ? { ...p, subCategory: '' } : p));
  };

  // Cart operations
  const addToCart = (product, quantityToAdd = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantityToAdd } : item);
      }
      return [...prev, { ...product, quantity: quantityToAdd }];
    });
    setIsCartOpen(true);
  };
  const removeFromCart = (id) => setCart(prev => prev.filter(item => item.id !== id));
  const updateQuantity = (id, quantity) => {
    if (quantity < 1) return;
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity } : item));
  };
  const clearCart = () => setCart([]);

  // Auth operations
  const login = async (email, password) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.requireOtp) {
          return { requireOtp: true, email: data.email, message: data.message };
        }
        if (data.user) {
          setUser(data.user);
          return { success: true, role: data.user.role, user: data.user };
        }
      }
      if (res.status === 401 && data && data.error) {
        const localMatch = registeredCustomers.find(
          c => c.email.toLowerCase() === cleanEmail && c.password === password
        );
        if (localMatch) {
          const { password: _, ...safeUser } = localMatch;
          setUser(safeUser);
          return { success: true, role: 'customer', user: safeUser };
        }
        return { error: data.error };
      }
    } catch (err) {
      console.warn('API login error, checking local store:', err);
    }

    // Offline / LocalStorage Fallback
    const localMatch = registeredCustomers.find(
      c => c.email.toLowerCase() === cleanEmail && c.password === password
    );
    if (localMatch) {
      const { password: _, ...safeUser } = localMatch;
      setUser(safeUser);
      return { success: true, role: 'customer', user: safeUser };
    }

    // Default admin fallback when offline
    if ((cleanEmail === 'admin@icaregadget.store' || cleanEmail === 'admin') && password === 'admin123') {
      const adminUser = { id: 1, name: 'Admin', email: 'admin@icaregadget.store', role: 'admin' };
      setUser(adminUser);
      return { success: true, role: 'admin', user: adminUser };
    }

    return { error: 'Invalid email or password.' };
  };

  const register = async (name, email, password, phone = '', address = '', city = '') => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (name || '').trim();

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cleanName, email: cleanEmail, password, phone, address, city })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        setRegisteredCustomers(prev => {
          const filtered = prev.filter(c => c.email.toLowerCase() !== cleanEmail);
          return [...filtered, { ...data.user, password }];
        });
        return { success: true, user: data.user };
      }
      if (res.status === 400 && data && data.error) {
        return { error: data.error };
      }
    } catch (err) {
      console.warn('API register error, falling back to local storage:', err);
    }

    // Offline / LocalStorage fallback
    const alreadyExists = registeredCustomers.some(c => c.email.toLowerCase() === cleanEmail);
    if (alreadyExists) {
      return { error: 'An account with this email already exists. Please log in.' };
    }

    const newUser = {
      id: Date.now(),
      name: cleanName || cleanEmail.split('@')[0],
      email: cleanEmail,
      role: 'customer',
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
      created_at: new Date().toISOString()
    };

    setRegisteredCustomers(prev => [...prev, { ...newUser, password }]);
    setUser(newUser);
    return { success: true, user: newUser };
  };

  const loginWithGoogle = async (googleData) => {
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(googleData)
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        setRegisteredCustomers(prev => {
          const filtered = prev.filter(c => c.email.toLowerCase() !== data.user.email.toLowerCase());
          return [...filtered, data.user];
        });
        return { success: true, role: data.user.role, user: data.user };
      }
      if (data && data.error) {
        return { error: data.error };
      }
    } catch (err) {
      console.warn('API Google login error, fallback to client decoded user:', err);
    }

    // Client-side fallback if backend was unavailable
    if (googleData?.userInfo?.email) {
      const cleanEmail = googleData.userInfo.email.trim().toLowerCase();
      const targetAdmin = 'admin@icaregadget.store';
      const fallbackUser = {
        id: Date.now(),
        name: googleData.userInfo.name || cleanEmail.split('@')[0],
        email: cleanEmail,
        role: cleanEmail === targetAdmin ? 'admin' : 'customer',
        avatar: googleData.userInfo.avatar || '',
        auth_provider: 'google',
        created_at: new Date().toISOString()
      };
      setUser(fallbackUser);
      setRegisteredCustomers(prev => [...prev.filter(c => c.email.toLowerCase() !== cleanEmail), fallbackUser]);
      return { success: true, role: fallbackUser.role, user: fallbackUser };
    }

    return { error: 'Failed to authenticate with Google. Please try again.' };
  };

  const updateCustomerProfile = async (profileData) => {
    if (!user) return { error: 'You must be logged in' };
    const email = user.email;

    try {
      const res = await fetch('/api/customer/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, ...profileData })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(prev => ({ ...prev, ...data.user }));
          setRegisteredCustomers(prev => prev.map(c => c.email === email ? { ...c, ...data.user } : c));
          return { success: true, user: data.user };
        }
      }
    } catch (err) {
      console.warn('Profile update API error, updating locally:', err);
    }

    const updated = { ...user, ...profileData };
    setUser(updated);
    setRegisteredCustomers(prev => prev.map(c => c.email === email ? { ...c, ...profileData } : c));
    return { success: true, user: updated };
  };

  const changeCustomerPassword = async (currentPassword, newPassword) => {
    if (!user) return { error: 'You must be logged in' };
    try {
      const res = await fetch('/api/customer/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, currentPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        return { success: true, message: data.message || 'Password changed successfully' };
      }
      if (data && data.error) {
        return { error: data.error };
      }
    } catch (err) {
      console.warn('Change password API error, updating locally:', err);
    }

    // Local check
    const local = registeredCustomers.find(c => c.email.toLowerCase() === user.email.toLowerCase());
    if (local && local.password && local.password !== currentPassword) {
      return { error: 'Current password does not match.' };
    }

    setRegisteredCustomers(prev => prev.map(c => (
      c.email.toLowerCase() === user.email.toLowerCase() ? { ...c, password: newPassword } : c
    )));
    return { success: true, message: 'Password updated successfully!' };
  };

  const verifyAdminOtp = async (email, code) => {
    try {
      const res = await fetch('/api/auth/verify-admin-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        return { success: true, user: data.user };
      }
      return { error: data.error || 'Invalid verification code' };
    } catch (err) {
      console.error('Verify OTP error:', err);
      return { error: 'Network error verifying code' };
    }
  };

  const resendAdminOtp = async (email, action = 'ADMIN_LOGIN') => {
    try {
      const res = await fetch('/api/auth/resend-admin-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, action })
      });
      const data = await res.json();
      if (res.ok) {
        return { success: true, message: data.message };
      }
      return { error: data.error || 'Failed to resend code' };
    } catch (err) {
      return { error: 'Network error resending code' };
    }
  };

  const requestPasswordOtp = async (currentPassword) => {
    try {
      const res = await fetch('/api/admin/request-password-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword })
      });
      const data = await res.json();
      if (res.ok) {
        return { success: true, message: data.message };
      }
      return { error: data.error || 'Failed to send code' };
    } catch (err) {
      return { error: 'Network error requesting code' };
    }
  };

  const changeAdminPassword = async (currentPassword, newPassword, code) => {
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, code })
      });
      const data = await res.json();
      if (res.ok) {
        return { success: true, message: data.message };
      }
      return { error: data.error || 'Failed to change password' };
    } catch (err) {
      return { error: 'Network error updating password' };
    }
  };


  const logout = () => {
    setUser(null);
  };

  // Orders backed by MySQL + LocalStorage
  const placeOrder = async (orderUser, cartItems, totalAmount, shippingInfo = {}) => {
    const productNames = cartItems.map(item => `${item.quantity}x ${item.name}`).join(', ');
    const orderId = Date.now();
    const orderItems = cartItems.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image || (item.images && item.images[0]) || ''
    }));

    const newOrder = {
      id: orderId,
      userName: shippingInfo.name || orderUser?.name || 'Customer',
      userEmail: orderUser?.email || shippingInfo.email || '',
      userId: orderUser?.id || null,
      phone: shippingInfo.phone || orderUser?.phone || '',
      shippingAddress: shippingInfo.address || orderUser?.address || '',
      productName: productNames,
      items: orderItems,
      price: `Rs. ${totalAmount.toLocaleString()}`,
      status: 'Pending',
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      });
      if (res.ok) {
        const savedOrder = await res.json();
        setOrders(prev => [savedOrder, ...prev]);
        return savedOrder;
      }
    } catch (err) {
      console.error('Failed to save order to database:', err);
    }

    setOrders(prev => [newOrder, ...prev]);
    return newOrder;
  };

  const getCustomerOrders = () => {
    if (!user) return [];
    const userEmail = (user.email || '').toLowerCase().trim();
    const userName = (user.name || '').toLowerCase().trim();
    return orders.filter(o => {
      const orderEmail = (o.userEmail || '').toLowerCase().trim();
      const orderUser = (o.userName || '').toLowerCase().trim();
      return (orderEmail && orderEmail === userEmail) ||
             (user.id && o.userId === user.id) ||
             (orderUser && orderUser === userName);
    });
  };

  const updateOrderStatus = async (orderId, newStatus, courier, trackingNumber) => {
    try {
      const payload = {};
      if (newStatus !== undefined) payload.status = newStatus;
      if (courier !== undefined) payload.courier = courier;
      if (trackingNumber !== undefined) payload.trackingNumber = trackingNumber;

      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...payload } : o));
        return { success: true };
      }
    } catch (err) {
      console.error('Failed to update order status:', err);
    }
    setOrders(prev => prev.map(o => o.id === orderId ? {
      ...o,
      ...(newStatus !== undefined ? { status: newStatus } : {}),
      ...(courier !== undefined ? { courier } : {}),
      ...(trackingNumber !== undefined ? { trackingNumber } : {})
    } : o));
    return { success: true };
  };

  const trackOrderPublic = async (orderId, contact) => {
    try {
      const q = contact ? `&query=${encodeURIComponent(contact)}` : '';
      const res = await fetch(`/api/orders/track?orderId=${encodeURIComponent(orderId)}${q}`);
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('Failed to track order:', err);
      return { success: false, error: 'Network error tracking order. Please check your connection.' };
    }
  };

  const addExpense = async (expenseData) => {
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData)
      });
      if (res.ok) {
        const saved = await res.json();
        setExpenses(prev => [saved, ...prev]);
        return { success: true, expense: saved };
      }
    } catch (err) {
      console.error('Failed to log expense:', err);
    }
    const local = { ...expenseData, id: Date.now(), amount: Number(expenseData.amount || 0) };
    setExpenses(prev => [local, ...prev]);
    return { success: true, expense: local };
  };

  const deleteExpense = async (id) => {
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setExpenses(prev => prev.filter(e => e.id !== Number(id)));
        return { success: true };
      }
    } catch (err) {
      console.error('Failed to delete expense:', err);
    }
    setExpenses(prev => prev.filter(e => e.id !== Number(id)));
    return { success: true };
  };

  // Coupon Handlers
  const addCoupon = (coupon) => {
    const newCoupon = { id: Date.now(), ...coupon, active: true, usageCount: 0 };
    setCoupons(prev => [newCoupon, ...prev]);
    return { success: true, coupon: newCoupon };
  };
  const deleteCoupon = (id) => {
    setCoupons(prev => prev.filter(c => c.id !== id));
  };
  const toggleCoupon = (id) => {
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, active: !c.active } : c));
  };

  // Return Handlers
  const addReturn = (returnData) => {
    const newRet = { id: 'RET-' + Date.now().toString().slice(-4), date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), status: 'Pending Review', ...returnData };
    setReturns(prev => [newRet, ...prev]);
    return { success: true, returnItem: newRet };
  };
  const updateReturnStatus = (id, newStatus) => {
    setReturns(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
  };

  // Abandoned Cart Handlers
  const markCartRecovered = (id) => {
    setAbandonedCarts(prev => prev.map(c => c.id === id ? { ...c, status: 'Recovered' } : c));
  };
  const markCartContacted = (id) => {
    setAbandonedCarts(prev => prev.map(c => c.id === id ? { ...c, status: 'Reminded' } : c));
  };

  // Review Handlers
  const addReview = (reviewData) => {
    const newRev = { id: Date.now(), date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), status: 'Published', reply: '', ...reviewData };
    setReviews(prev => [newRev, ...prev]);
  };
  const updateReviewStatus = (id, newStatus) => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
  };
  const deleteReview = (id) => {
    setReviews(prev => prev.filter(r => r.id !== id));
  };
  const replyToReview = (id, replyText) => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, reply: replyText } : r));
  };

  // Shipping
  const updateShippingSettings = (newSettings) => {
    setShippingSettings(prev => ({ ...prev, ...newSettings }));
  };

  // Integrations
  const updateIntegrations = (newIntegrations) => {
    setIntegrations(prev => ({ ...prev, ...newIntegrations }));
  };

  // Staff
  const addStaffMember = (staffData) => {
    const newMember = { id: Date.now(), status: 'Active', lastLogin: 'Never', ...staffData };
    setStaffMembers(prev => [...prev, newMember]);
    return { success: true, member: newMember };
  };
  const deleteStaffMember = (id) => {
    setStaffMembers(prev => prev.filter(s => s.id !== id));
  };
  const updateStaffRole = (id, newRole) => {
    setStaffMembers(prev => prev.map(s => s.id === id ? { ...s, role: newRole } : s));
  };

  // Store Pages
  const updateStorePage = (pageKey, content) => {
    setStorePages(prev => ({ ...prev, [pageKey]: content }));
  };

  // Stock
  const updateProductStock = (productId, newStock) => {
    setProductStocks(prev => ({ ...prev, [productId]: Number(newStock) }));
  };

  const getAccountingSummary = async () => {
    try {
      const res = await fetch('/api/accounting/summary');
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.error('Accounting summary error:', err);
    }
    return null;
  };

  return (
    <StoreContext.Provider value={{
user, login, register, loginWithGoogle, logout,
      updateCustomerProfile, changeCustomerPassword, getCustomerOrders,
      verifyAdminOtp, resendAdminOtp, requestPasswordOtp, changeAdminPassword,
      storeDetails, updateStoreDetails, 
      categories, addCategory, deleteCategory, addSubCategory, deleteSubCategory,
      products, addProduct, updateProduct, deleteProduct,
      orders, placeOrder, updateOrderStatus, trackOrderPublic, expenses, addExpense, deleteExpense, getAccountingSummary,
      cart, addToCart, removeFromCart, updateQuantity, clearCart,
      isCartOpen, setIsCartOpen,
      isMobileMenuOpen, setIsMobileMenuOpen,
      selectedProduct, setSelectedProduct,
      loading,
      coupons, addCoupon, deleteCoupon, toggleCoupon,
      returns, addReturn, updateReturnStatus,
      abandonedCarts, markCartRecovered, markCartContacted,
      reviews, addReview, updateReviewStatus, deleteReview, replyToReview,
      shippingSettings, updateShippingSettings,
      integrations, updateIntegrations,
      staffMembers, addStaffMember, deleteStaffMember, updateStaffRole,
      storePages, updateStorePage,
      productStocks, updateProductStock
    }}>
      {children}
    </StoreContext.Provider>
  );
};
