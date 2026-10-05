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
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate old products to support arrays
      return parsed.map(p => ({ ...p, images: p.images || (p.image ? [p.image] : []), description: p.description || '' }));
    }
    return [
      { id: 101, name: 'iPhone 15 Pro', price: 'Rs. 350,000', sale: false, category: 'Mobiles', subCategory: 'Apple', bestSeller: false, image: '', images: [], description: 'The latest iPhone 15 Pro features a titanium design, A17 Pro chip, and a more advanced 48MP main camera system.' },
      { id: 102, name: 'Samsung Galaxy S24 Ultra', price: 'Rs. 400,000', sale: true, category: 'Mobiles', subCategory: 'Samsung', bestSeller: false, image: '', images: [], description: 'Experience the new era of mobile AI with the Galaxy S24 Ultra.' },
      { id: 103, name: 'Google Pixel 8 Pro', price: 'Rs. 280,000', sale: false, category: 'Mobiles', subCategory: 'Google', bestSeller: false, image: '', images: [], description: 'The best of Google engineering in a sleek, pro-level smartphone.' },
      { id: 104, name: 'OnePlus 12', price: 'Rs. 250,000', sale: false, category: 'Mobiles', subCategory: 'OnePlus', bestSeller: false, image: '', images: [], description: 'Smooth beyond belief. Co-developed with Hasselblad.' },
      { id: 105, name: 'iPhone 13', price: 'Rs. 180,000', sale: true, category: 'Mobiles', subCategory: 'Apple', bestSeller: false, image: '', images: [], description: 'Your new superpower. Advanced dual-camera system.' },
      { id: 106, name: 'Xiaomi 14', price: 'Rs. 220,000', sale: false, category: 'Mobiles', subCategory: 'Xiaomi', bestSeller: false, image: '', images: [], description: 'Masterpiece in sight. Leica optical lens.' },
      
      { id: 201, name: 'Wireless earbuds Pro', price: 'Rs. 15,000', sale: true, category: 'Audio', subCategory: 'Earbuds', bestSeller: true, image: '', images: [], description: 'Active noise cancellation for immersive sound.' },
      { id: 202, name: 'Over-ear Noise Cancelling Headphones', price: 'Rs. 45,000', sale: false, category: 'Audio', subCategory: 'Headphones', bestSeller: false, image: '', images: [], description: 'High-fidelity audio with industry-leading noise cancellation.' },
      { id: 203, name: 'Portable Bluetooth Speaker', price: 'Rs. 12,000', sale: false, category: 'Audio', subCategory: 'Speakers', bestSeller: false, image: '', images: [], description: 'Waterproof portable speaker with bold sound.' },
      { id: 204, name: 'Sport Wireless Earbuds', price: 'Rs. 8,000', sale: true, category: 'Audio', subCategory: 'Earbuds', bestSeller: false, image: '', images: [], description: 'Secure fit and sweatproof design for workouts.' },
      
      { id: 301, name: 'USB-C to USB-C cable', price: 'Rs. 2,000', sale: false, category: 'Accessories', subCategory: 'Cables', bestSeller: true, image: '', images: [], description: 'Fast charging and data syncing cable.' },
      { id: 302, name: '30W Fast Charger', price: 'Rs. 4,500', sale: true, category: 'Accessories', subCategory: 'Chargers', bestSeller: false, image: '', images: [], description: 'Compact power adapter for fast charging.' },
      { id: 303, name: 'MagSafe Clear Case', price: 'Rs. 3,000', sale: false, category: 'Accessories', subCategory: 'Mobile Accessories', bestSeller: false, image: '', images: [], description: 'Showcase your phone while keeping it protected.' },
      { id: 401, name: 'Smart LED Bulb', price: 'Rs. 3,500', sale: false, category: 'Smart Home', subCategory: '', bestSeller: false, image: '', images: [], description: '' },
      { id: 402, name: 'Smart Wi-Fi Plug', price: 'Rs. 4,000', sale: true, category: 'Smart Home', subCategory: '', bestSeller: false, image: '', images: [], description: '' },
      { id: 403, name: 'Indoor Security Camera', price: 'Rs. 12,500', sale: false, category: 'Smart Home', subCategory: '', bestSeller: false, image: '', images: [], description: '' },
      { id: 404, name: 'Voice Assistant Speaker', price: 'Rs. 18,000', sale: true, category: 'Smart Home', subCategory: '', bestSeller: false, image: '', images: [], description: '' },
      
      { id: 501, name: 'Smartwatch', price: 'Rs. 25,000', sale: false, category: 'Wearables', subCategory: '', bestSeller: true, image: '', images: [], description: '' },
    ];
  });

  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('categories');
    if (saved) {
      const parsed = JSON.parse(saved);
      delete parsed['Uncategorized'];
      return parsed;
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

  useEffect(() => { try { localStorage.setItem('user', JSON.stringify(user)); } catch(e){} }, [user]);
  useEffect(() => { try { localStorage.setItem('storeDetails', JSON.stringify(storeDetails)); } catch(e){} }, [storeDetails]);
  useEffect(() => { 
    try { 
      localStorage.setItem('products', JSON.stringify(products)); 
    } catch(e) { 
      alert('WARNING: Your browser storage is full because the images you uploaded are too large. Please delete some products or use smaller images, otherwise your changes will not be saved!'); 
    } 
  }, [products]);
  useEffect(() => { try { localStorage.setItem('orders', JSON.stringify(orders)); } catch(e){} }, [orders]);
  useEffect(() => { try { localStorage.setItem('cart', JSON.stringify(cart)); } catch(e){} }, [cart]);
  useEffect(() => { try { localStorage.setItem('categories', JSON.stringify(categories)); } catch(e){} }, [categories]);

  const addProduct = (product) => setProducts([...products, { ...product, id: Date.now() }]);
  const updateProduct = (id, updatedData) => setProducts(products.map(p => p.id === id ? { ...p, ...updatedData } : p));
  const deleteProduct = (id) => setProducts(products.filter(p => p.id !== id));
  const updateStoreDetails = (details) => setStoreDetails({ ...storeDetails, ...details });

  // Category operations
  const addCategory = (name) => {
    if (name === 'Uncategorized') return;
    
    setCategories(prev => {
      if (!prev[name]) {
        return { ...prev, [name]: [] };
      }
      return prev;
    });
  };
  
  const deleteCategory = (name) => {
    setCategories(prev => {
      const newCats = { ...prev };
      delete newCats[name];
      return newCats;
    });
    setProducts(prev => prev.map(p => p.category === name ? { ...p, category: 'Uncategorized', subCategory: '' } : p));
  };
  
  const addSubCategory = (catName, subName) => {
    setCategories(prev => {
      if (prev[catName] && !prev[catName].includes(subName)) {
        return { ...prev, [catName]: [...prev[catName], subName] };
      }
      return prev;
    });
  };
  
  const deleteSubCategory = (catName, subName) => {
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

  const login = (email, password) => {
    if (email === 'admin' && password === 'admin123') {
      setUser({ role: 'admin', name: 'Admin' });
      return 'admin';
    } else {
      setUser({ role: 'customer', name: email.split('@')[0] || 'Customer' });
      return 'customer';
    }
  };

  const register = (name, email, password) => {
    setUser({ role: 'customer', name: name || email.split('@')[0] });
    return 'customer';
  };

  const loginWithGoogle = () => {
    setUser({ role: 'customer', name: 'Google User' });
    return 'customer';
  };

  const logout = () => setUser(null);

  const placeOrder = (user, cartItems, totalAmount) => {
    const productNames = cartItems.map(item => `${item.quantity}x ${item.name}`).join(', ');
    const newOrder = {
      id: Date.now(),
      userName: user.name,
      productName: productNames,
      price: `Rs. ${totalAmount.toLocaleString()}`,
      status: 'Pending',
      date: new Date().toLocaleDateString()
    };
    setOrders([...orders, newOrder]);
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
      selectedProduct, setSelectedProduct
    }}>
      {children}
    </StoreContext.Provider>
  );
};
