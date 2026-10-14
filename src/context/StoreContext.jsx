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

  const [products, setProducts] = useState([]);

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

  // Sync to localStorage as offline cache
  useEffect(() => { try { localStorage.setItem('user', JSON.stringify(user)); } catch(e){} }, [user]);
  useEffect(() => { try { localStorage.setItem('storeDetails', JSON.stringify(storeDetails)); } catch(e){} }, [storeDetails]);
  useEffect(() => { try { localStorage.setItem('products', JSON.stringify(products)); } catch(e){} }, [products]);
  useEffect(() => { try { localStorage.setItem('orders', JSON.stringify(orders)); } catch(e){} }, [orders]);
  useEffect(() => { try { localStorage.setItem('cart', JSON.stringify(cart)); } catch(e){} }, [cart]);
  useEffect(() => { try { localStorage.setItem('categories', JSON.stringify(categories)); } catch(e){} }, [categories]);

  // Load from MySQL backend on initial mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [prodRes, catRes, orderRes, storeRes] = await Promise.all([
          fetch('/api/products').catch(() => null),
          fetch('/api/categories').catch(() => null),
          fetch('/api/orders').catch(() => null),
          fetch('/api/store-details').catch(() => null)
        ]);

        if (prodRes && prodRes.ok) {
          const prodData = await prodRes.json();
          if (Array.isArray(prodData)) {
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
          if (Array.isArray(orderData)) {
            setOrders(orderData);
          }
        }
        if (storeRes && storeRes.ok) {
          const storeData = await storeRes.json();
          if (storeData && storeData.address) {
            setStoreDetails(storeData);
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
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          return data.user.role;
        }
      }
    } catch (err) {
      console.error('API login error, fallback to local:', err);
    }

    // Fallback logic
    if (email === 'admin' && password === 'admin123') {
      const adminUser = { role: 'admin', name: 'Admin', email: 'admin' };
      setUser(adminUser);
      return 'admin';
    } else {
      const custUser = { role: 'customer', name: email.split('@')[0] || 'Customer', email };
      setUser(custUser);
      return 'customer';
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          return data.user.role;
        }
      }
    } catch (err) {
      console.error('API register error, fallback to local:', err);
    }
    const custUser = { role: 'customer', name: name || email.split('@')[0], email };
    setUser(custUser);
    return 'customer';
  };

  const loginWithGoogle = () => {
    const custUser = { role: 'customer', name: 'Google User', email: 'google_user@icare.com' };
    setUser(custUser);
    return 'customer';
  };

  const logout = () => setUser(null);

  // Orders backed by MySQL
  const placeOrder = async (orderUser, cartItems, totalAmount) => {
    const productNames = cartItems.map(item => `${item.quantity}x ${item.name}`).join(', ');
    const newOrder = {
      id: Date.now(),
      userName: orderUser?.name || 'Customer',
      productName: productNames,
      price: `Rs. ${totalAmount.toLocaleString()}`,
      status: 'Pending',
      date: new Date().toLocaleDateString()
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

  return (
    <StoreContext.Provider value={{ 
      user, login, register, loginWithGoogle, logout, 
      storeDetails, updateStoreDetails, 
      categories, addCategory, deleteCategory, addSubCategory, deleteSubCategory,
      products, addProduct, updateProduct, deleteProduct,
      orders, placeOrder,
      cart, addToCart, removeFromCart, updateQuantity, clearCart,
      isCartOpen, setIsCartOpen,
      isMobileMenuOpen, setIsMobileMenuOpen,
      selectedProduct, setSelectedProduct,
      loading
    }}>
      {children}
    </StoreContext.Provider>
  );
};
