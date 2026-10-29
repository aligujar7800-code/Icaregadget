import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

export default function AdminDashboard() {
  const { 
    user, products, addProduct, updateProduct, deleteProduct, 
    storeDetails, updateStoreDetails, logout, orders, 
    categories: contextCategories, addCategory, deleteCategory, 
    addSubCategory, deleteSubCategory,
    requestPasswordOtp, changeAdminPassword 
  } = useStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('products');
  const fileInputRef = useRef(null);

  // Product form state
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Mobiles');
  const [subCategory, setSubCategory] = useState('');
  const [sale, setSale] = useState(false);
  const [bestSeller, setBestSeller] = useState(false);
  const [imagesPreview, setImagesPreview] = useState([]);
  const [description, setDescription] = useState('');

  // Products table filter
  const [filterCategory, setFilterCategory] = useState('All');

  // Store details form state
  const [address, setAddress] = useState(storeDetails.address);
  const [hours, setHours] = useState(storeDetails.hours);
  const [phone, setPhone] = useState(storeDetails.phone);

  // Password change form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordOtp, setPasswordOtp] = useState('');
  const [passwordStep, setPasswordStep] = useState('input'); // 'input' or 'otp'
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdCountdown, setPwdCountdown] = useState(0);

  // Cloudflare Email Routing state
  const [cfRouting, setCfRouting] = useState({
    isConfigured: false,
    adminEmail: 'admin@icaregadget.store',
    currentForwardTo: '',
    ruleEnabled: false,
    addresses: []
  });
  const [cfLoading, setCfLoading] = useState(false);
  const [cfError, setCfError] = useState('');
  const [cfSuccess, setCfSuccess] = useState('');
  const [newDestinationEmail, setNewDestinationEmail] = useState('');
  const [cfActionLoading, setCfActionLoading] = useState(false);
  const [aiMessages, setAiMessages] = useState([
    {
      role: 'assistant',
      content: "Hello Admin! I'm your AI Business Advisor & Data Handler. I have live access to your store metrics (orders, revenue, products). Ask me to calculate sales performance, diagnose inventory gaps, plan promotions, or discuss any business question!"
    }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const handleAiSend = async (customPrompt) => {
    const text = (customPrompt || aiInput).trim();
    if (!text || aiLoading) return;

    const updated = [...aiMessages, { role: 'user', content: text }];
    setAiMessages(updated);
    setAiInput('');
    setAiLoading(true);

    try {
      const res = await fetch('/api/chat/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: updated.slice(-6).map(m => ({ role: m.role, content: m.content }))
        })
      });
      const data = await res.json();
      const reply = data.reply || "I'm having a brief connection issue. Please try again.";
      setAiMessages([...updated, { role: 'assistant', content: reply }]);
    } catch (err) {
      setAiMessages([...updated, { role: 'assistant', content: "Failed to connect to AI server: " + err.message }]);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    let timer;
    if (pwdCountdown > 0) {
      timer = setTimeout(() => setPwdCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [pwdCountdown]);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user || user.role !== 'admin') return null;

  const allCategories = Object.keys(contextCategories || {});
  const allSubCategories = (contextCategories && contextCategories[category]) ? contextCategories[category] : [];

  const filteredProducts = filterCategory === 'All'
    ? products
    : products.filter(p => p.category === filterCategory);

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const MAX_SIZE = 800;
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG with 0.7 quality
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(async (file) => {
      if (file) {
        const compressed = await compressImage(file);
        setImagesPreview(prev => [...prev, compressed]);
      }
    });
  };

  useEffect(() => {
    const handleGlobalPaste = (e) => {
      // Only capture paste events if we are on the products tab and not typing in a text input (unless it's an image)
      if (activeTab !== 'products') return;
      
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            compressImage(file).then(compressed => {
              setImagesPreview(prev => [...prev, compressed]);
            });
          }
          break;
        }
      }
    };
    
    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [activeTab]);

  const handleEditClick = (product) => {
    setEditingId(product.id);
    setName(product.name);
    setPrice(product.price);
    setCategory(product.category);
    setSubCategory(product.subCategory || '');
    setSale(product.sale);
    setBestSeller(product.bestSeller || false);
    setImagesPreview(product.images && product.images.length > 0 ? product.images : (product.image ? [product.image] : []));
    setDescription(product.description || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setPrice('');
    setSubCategory('');
    setImagesPreview([]);
    setDescription('');
    setSale(false);
    setBestSeller(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmitProduct = (e) => {
    e.preventDefault();
    
    // Automatically register category and subcategory if they don't exist
    if (category) {
      addCategory(category);
      if (subCategory) {
        addSubCategory(category, subCategory);
      }
    }

    if (editingId) {
      updateProduct(editingId, { name, price, category, subCategory, sale, bestSeller, description, image: imagesPreview[0] || '', images: imagesPreview });
      alert('Product updated successfully!');
    } else {
      addProduct({ name, price, category, subCategory, sale, bestSeller, description, image: imagesPreview[0] || '', images: imagesPreview });
      alert('Product published successfully!');
    }
    handleCancelEdit();
  };

  const handleDeleteClick = (id) => {
    if (window.confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      deleteProduct(id);
    }
  };

  const handleUpdateStore = (e) => {
    e.preventDefault();
    updateStoreDetails({ address, hours, phone });
    alert('Store details updated successfully!');
  };

  const handleRequestPasswordOtp = async (e) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (!currentPassword) {
      setPwdError('Please enter your current password.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPwdError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('New passwords do not match.');
      return;
    }

    setPwdLoading(true);
    try {
      const res = await requestPasswordOtp(currentPassword);
      if (res?.success) {
        setPasswordStep('otp');
        setPwdSuccess(res.message || 'Verification code sent to admin@icaregadget.store');
        setPwdCountdown(60);
      } else {
        setPwdError(res?.error || 'Failed to request code. Check current password.');
      }
    } catch (err) {
      setPwdError('Network error requesting code.');
    } finally {
      setPwdLoading(false);
    }
  };

  const handleConfirmPasswordChange = async (e) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (!passwordOtp || passwordOtp.trim().length !== 6) {
      setPwdError('Please enter the 6-digit verification code.');
      return;
    }

    setPwdLoading(true);
    try {
      const res = await changeAdminPassword(currentPassword, newPassword, passwordOtp.trim());
      if (res?.success) {
        setPwdSuccess('Password updated successfully! Next time you log in, use your new password.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordOtp('');
        setPasswordStep('input');
      } else {
        setPwdError(res?.error || 'Invalid or expired verification code.');
      }
    } catch (err) {
      setPwdError('Network error updating password.');
    } finally {
      setPwdLoading(false);
    }
  };

  const fetchEmailRouting = async () => {
    try {
      setCfLoading(true);
      setCfError('');
      const res = await fetch('/api/admin/email-routing');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch email routing');
      setCfRouting(data);
    } catch (err) {
      console.error(err);
      setCfError(err.message || 'Error fetching email routing');
    } finally {
      setCfLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'security') {
      fetchEmailRouting();
    }
  }, [activeTab]);

  const handleAddDestination = async (e) => {
    e.preventDefault();
    if (!newDestinationEmail || !newDestinationEmail.includes('@')) {
      setCfError('Please enter a valid destination email address.');
      return;
    }
    setCfActionLoading(true);
    setCfError('');
    setCfSuccess('');
    try {
      const res = await fetch('/api/admin/email-routing/add-destination', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newDestinationEmail.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add destination address');
      setCfSuccess(data.message || 'Verification email sent by Cloudflare!');
      setNewDestinationEmail('');
      await fetchEmailRouting();
    } catch (err) {
      setCfError(err.message || 'Failed to add destination email.');
    } finally {
      setCfActionLoading(false);
    }
  };

  const handleActivateDestination = async (targetEmail) => {
    setCfActionLoading(true);
    setCfError('');
    setCfSuccess('');
    try {
      const res = await fetch('/api/admin/email-routing/activate-destination', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to activate forwarding rule');
      setCfSuccess(data.message || 'Forwarding rule activated successfully!');
      await fetchEmailRouting();
    } catch (err) {
      setCfError(err.message || 'Failed to activate forwarding rule.');
    } finally {
      setCfActionLoading(false);
    }
  };

  const handleDeleteDestination = async (tag, email) => {
    if (!window.confirm(`Are you sure you want to delete ${email} from Cloudflare?`)) {
      return;
    }
    setCfActionLoading(true);
    setCfError('');
    setCfSuccess('');
    try {
      const res = await fetch(`/api/admin/email-routing/destination/${tag}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete address');
      setCfSuccess(`Deleted ${email} from Cloudflare successfully.`);
      await fetchEmailRouting();
    } catch (err) {
      setCfError(err.message || 'Failed to delete destination address.');
    } finally {
      setCfActionLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: '0.9375rem' };
  const labelStyle = { display: 'block', fontWeight: '600', fontSize: '0.875rem', marginBottom: '8px', color: '#374151' };
  const focusHandler = (e) => e.target.style.borderColor = 'var(--orange)';
  const blurHandler = (e) => e.target.style.borderColor = '#d1d5db';

  const sidebarBtnStyle = (isActive) => ({
    textAlign: 'left', padding: '12px 16px', borderRadius: '8px',
    backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
    color: isActive ? 'white' : '#9ca3af',
    fontWeight: '500', transition: 'all 0.2s', border: 'none', cursor: 'pointer', width: '100%'
  });

  return (
    <div className="admin-layout" style={{ display: 'flex', minHeight: 'calc(100vh - 80px)', backgroundColor: '#f3f4f6' }}>
      {/* Sidebar */}
      <aside className="admin-sidebar" style={{ width: '260px', backgroundColor: '#111827', color: 'white', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #374151' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Admin Dashboard</h2>
        </div>
        <nav style={{ flex: 1, padding: '24px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
          <button onClick={() => setActiveTab('orders')} style={sidebarBtnStyle(activeTab === 'orders')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
                Customer Orders
              </div>
              {orders.length > 0 && <span style={{ backgroundColor: 'var(--orange)', color: 'white', padding: '2px 8px', borderRadius: '99px', fontSize: '0.75rem' }}>{orders.length}</span>}
            </div>
          </button>

          <button onClick={() => setActiveTab('products')} style={sidebarBtnStyle(activeTab === 'products')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              Products
            </div>
          </button>

          <button onClick={() => setActiveTab('categories')} style={sidebarBtnStyle(activeTab === 'categories')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h7" /></svg>
              Categories
            </div>
          </button>

          <button onClick={() => setActiveTab('store')} style={sidebarBtnStyle(activeTab === 'store')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              Store Settings
            </div>
          </button>

          <button onClick={() => setActiveTab('security')} style={sidebarBtnStyle(activeTab === 'security')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              Security & Password
            </div>
          </button>
          <button onClick={() => setActiveTab('ai_assistant')} style={sidebarBtnStyle(activeTab === 'ai_assistant')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                AI Assistant
              </div>
              <span style={{ backgroundColor: '#10b981', color: 'white', padding: '1px 6px', borderRadius: '99px', fontSize: '0.7rem', fontWeight: 'bold' }}>AI</span>
            </div>
          </button>
        </nav>
        <div style={{ padding: '24px 12px' }}>
          <button onClick={handleLogout} style={{ width: '100%', textAlign: 'left', padding: '12px 16px', borderRadius: '8px', color: '#f87171', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '12px', transition: 'background 0.2s', border: 'none', cursor: 'pointer', backgroundColor: 'transparent' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(248, 113, 113, 0.1)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main" style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <header className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
              {activeTab === 'products' && 'Products Management'}
              {activeTab === 'categories' && 'Categories Management'}
              {activeTab === 'store' && 'Store Settings'}
              {activeTab === 'orders' && 'Customer Orders'}
              {activeTab === 'security' && 'Security & Password Settings'}
              {activeTab === 'ai_assistant' && 'AI Business Advisor & Data Handler'}
            </h1>
            <p style={{ color: '#6b7280', marginTop: '4px' }}>Welcome back, Admin.</p>
          </div>
        </header>

        {/* ===== ORDERS TAB ===== */}
        {activeTab === 'orders' && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '20px', color: '#111827' }}>Recent Orders</h2>
            {orders.length === 0 ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: '#6b7280' }}>No orders have been placed yet.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: '12px 16px', color: '#6b7280', fontWeight: '600', fontSize: '0.875rem' }}>Order ID</th>
                      <th style={{ padding: '12px 16px', color: '#6b7280', fontWeight: '600', fontSize: '0.875rem' }}>Customer</th>
                      <th style={{ padding: '12px 16px', color: '#6b7280', fontWeight: '600', fontSize: '0.875rem' }}>Product</th>
                      <th style={{ padding: '12px 16px', color: '#6b7280', fontWeight: '600', fontSize: '0.875rem' }}>Total</th>
                      <th style={{ padding: '12px 16px', color: '#6b7280', fontWeight: '600', fontSize: '0.875rem' }}>Date</th>
                      <th style={{ padding: '12px 16px', color: '#6b7280', fontWeight: '600', fontSize: '0.875rem' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice().reverse().map(order => (
                      <tr key={order.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '16px', fontWeight: '500', color: '#111827' }}>#{order.id.toString().slice(-6)}</td>
                        <td style={{ padding: '16px', color: '#4b5563' }}>{order.userName}</td>
                        <td style={{ padding: '16px', color: '#4b5563' }}>{order.productName}</td>
                        <td style={{ padding: '16px', fontWeight: '600', color: '#111827' }}>{order.price}</td>
                        <td style={{ padding: '16px', color: '#6b7280', fontSize: '0.875rem' }}>{order.date}</td>
                        <td style={{ padding: '16px' }}>
                          <span style={{ padding: '4px 8px', borderRadius: '9999px', backgroundColor: '#fef3c7', color: '#92400e', fontSize: '0.75rem', fontWeight: '600' }}>{order.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ===== PRODUCTS TAB ===== */}
        {activeTab === 'products' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px' }}>
            
            {/* Products Table */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>All Products ({filteredProducts.length})</h2>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['All', 'Mobiles', 'Audio', 'Accessories', 'Smart Home', 'Wearables'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setFilterCategory(cat)}
                      style={{
                        padding: '6px 14px', borderRadius: '20px', fontSize: '0.8125rem', fontWeight: '600', border: 'none', cursor: 'pointer',
                        backgroundColor: filterCategory === cat ? 'var(--orange)' : '#f3f4f6',
                        color: filterCategory === cat ? 'white' : '#4b5563',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ overflowX: 'auto', maxHeight: '600px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white' }}>
                    <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: '12px 16px', color: '#6b7280', fontWeight: '600', fontSize: '0.8125rem' }}>Product</th>
                      <th style={{ padding: '12px 16px', color: '#6b7280', fontWeight: '600', fontSize: '0.8125rem' }}>Category</th>
                      <th style={{ padding: '12px 16px', color: '#6b7280', fontWeight: '600', fontSize: '0.8125rem' }}>Price</th>
                      <th style={{ padding: '12px 16px', color: '#6b7280', fontWeight: '600', fontSize: '0.8125rem' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.slice().reverse().map(product => (
                      <tr key={product.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#f3f4f6', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {product.image ? (
                              <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                            )}
                          </div>
                          <span style={{ fontWeight: '500', color: '#111827', fontSize: '0.875rem' }}>{product.name}</span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontSize: '0.8125rem', color: '#4b5563' }}>{product.category}</span>
                          {product.subCategory && (
                            <span style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af' }}>{product.subCategory}</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px', color: '#111827', fontWeight: '500', fontSize: '0.875rem' }}>{product.price}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={() => handleEditClick(product)} style={{ border: 'none', background: 'none', color: '#3b82f6', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem' }}>Edit</button>
                            <button onClick={() => handleDeleteClick(product.id)} style={{ border: 'none', background: 'none', color: '#ef4444', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem' }}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add/Edit Product Form */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', height: 'fit-content' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                  {editingId ? 'Edit Product' : 'Add New Product'}
                </h2>
                {editingId && (
                  <button type="button" onClick={handleCancelEdit} style={{ fontSize: '0.875rem', color: '#6b7280', border: 'none', background: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Cancel</button>
                )}
              </div>
              
              <form onSubmit={handleSubmitProduct} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Image Upload Zone */}
                <div>
                  <label style={labelStyle}>Product Images</label>
                  <div style={{ border: '2px dashed #d1d5db', borderRadius: '8px', padding: '24px', textAlign: 'center', backgroundColor: '#f9fafb', position: 'relative', overflow: 'hidden', minHeight: '160px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transition: 'border-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--orange)'} onMouseLeave={e => e.currentTarget.style.borderColor = '#d1d5db'}>
                    {imagesPreview.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', width: '100%', padding: '8px', zIndex: 10 }}>
                        {imagesPreview.map((src, i) => (
                          <div key={i} style={{ width: '80px', height: '80px', borderRadius: '4px', overflow: 'hidden', position: 'relative', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
                            <img src={src} alt={`Preview ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button type="button" onClick={() => setImagesPreview(prev => prev.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>X</button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ pointerEvents: 'none' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" style={{ marginBottom: '12px' }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Click to upload multiple or <strong style={{ color: '#111827' }}>Ctrl+V</strong> to paste</p>
                      </div>
                    )}
                    <input 
                      type="file" 
                      accept="image/*"
                      multiple
                      ref={fileInputRef}
                      onChange={handleImageUpload} 
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 1 }}
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Description</label>
                  <textarea 
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
                    onFocus={focusHandler}
                    onBlur={blurHandler}
                    placeholder="Enter product description"
                  />
                </div>

                <div>
                  <label style={labelStyle}>Product Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} placeholder="e.g. iPhone 15 Pro" />
                </div>

                <div>
                  <label style={labelStyle}>Price</label>
                  <input type="text" value={price} onChange={e => setPrice(e.target.value)} required style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} placeholder="e.g. Rs. 350,000" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Category</label>
                    <input 
                      list="category-options"
                      value={category} 
                      onChange={e => { setCategory(e.target.value); setSubCategory(''); }} 
                      style={inputStyle} 
                      onFocus={focusHandler} 
                      onBlur={blurHandler} 
                      placeholder="Select or type new..." 
                      required
                    />
                    <datalist id="category-options">
                      {allCategories.map(c => <option key={c} value={c} />)}
                    </datalist>
                  </div>
                  <div>
                    <label style={labelStyle}>Sub-Category</label>
                    <input 
                      list="sub-category-options"
                      value={subCategory} 
                      onChange={e => setSubCategory(e.target.value)} 
                      style={inputStyle} 
                      onFocus={focusHandler} 
                      onBlur={blurHandler} 
                      placeholder="Optional sub-category..." 
                    />
                    <datalist id="sub-category-options">
                      {allSubCategories.map(sc => <option key={sc} value={sc} />)}
                    </datalist>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                    <input type="checkbox" checked={sale} onChange={e => setSale(e.target.checked)} style={{ width: '16px', height: '16px' }} />
                    On Sale
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                    <input type="checkbox" checked={bestSeller} onChange={e => setBestSeller(e.target.checked)} style={{ width: '16px', height: '16px' }} />
                    Best Seller
                  </label>
                </div>

                <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: 'var(--black)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '8px', transition: 'background-color 0.2s', fontSize: '0.9375rem' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--orange)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--black)'}>
                  {editingId ? 'Update Product' : 'Publish Product'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ===== CATEGORIES TAB ===== */}
        {activeTab === 'categories' && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>Categories Management</h2>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '4px' }}>Manage the main categories and sub-categories that appear in the website header.</p>
              </div>
              <button 
                onClick={() => {
                  const name = prompt("Enter new category name:");
                  if (name && name.trim()) addCategory(name.trim());
                }}
                style={{ padding: '8px 16px', backgroundColor: 'var(--black)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: 'background-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--orange)'} 
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--black)'}
              >
                + Add Category
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {Object.keys(contextCategories).map(catName => (
                <div key={catName} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f3f4f6', paddingBottom: '12px', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>{catName}</h3>
                    <button 
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete the category "${catName}"? This will move all its products to "Uncategorized".`)) {
                          deleteCategory(catName);
                        }
                      }}
                      style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem' }}
                    >
                      Delete Category
                    </button>
                  </div>
                  
                  <div>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', marginBottom: '8px' }}>Sub-Categories</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {contextCategories[catName].map(sub => (
                        <div key={sub} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f3f4f6', padding: '4px 10px', borderRadius: '20px', fontSize: '0.875rem', color: '#374151' }}>
                          {sub}
                          <button 
                            onClick={() => deleteSubCategory(catName, sub)}
                            style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                            title="Remove sub-category"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => {
                          const subName = prompt(`Enter new sub-category for ${catName}:`);
                          if (subName && subName.trim()) addSubCategory(catName, subName.trim());
                        }}
                        style={{ background: 'none', border: '1px dashed #d1d5db', color: '#6b7280', padding: '4px 12px', borderRadius: '20px', fontSize: '0.875rem', cursor: 'pointer' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--orange)'; e.currentTarget.style.color = 'var(--orange)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#6b7280'; }}
                      >
                        + Add Sub-Category
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== STORE SETTINGS TAB ===== */}
        {activeTab === 'store' && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', maxWidth: '600px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '8px', color: '#111827' }}>Update Store Details</h2>
            <p style={{ color: '#6b7280', marginBottom: '32px', fontSize: '0.875rem' }}>These details appear in the "Visit the shop" section and Footer across the website.</p>
            
            <form onSubmit={handleUpdateStore} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label style={labelStyle}>Store Address (Directions)</label>
                <textarea value={address} onChange={e => setAddress(e.target.value)} rows="3" style={{ ...inputStyle, fontFamily: 'inherit' }} onFocus={focusHandler} onBlur={blurHandler} />
              </div>
              
              <div>
                <label style={labelStyle}>Opening Hours</label>
                <input type="text" value={hours} onChange={e => setHours(e.target.value)} style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
              </div>
              
              <div>
                <label style={labelStyle}>Phone Number (WhatsApp)</label>
                <input type="text" value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
              </div>
              
              <button type="submit" style={{ padding: '12px 24px', backgroundColor: 'var(--black)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', alignSelf: 'flex-start', marginTop: '8px', transition: 'background-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--orange)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--black)'}>
                Save Changes
              </button>
            </form>
          </div>
        )}

        {/* ===== SECURITY & PASSWORD TAB ===== */}
        {activeTab === 'security' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '32px', alignItems: 'start' }}>
            
            {/* Card 1: Change Admin Password */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '8px', color: '#111827' }}>Change Admin Password</h2>
              <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '0.875rem', lineHeight: '1.5' }}>
                To update your password, enter your existing password below. A 6-digit verification code will be sent to <strong>admin@icaregadget.store</strong> to authorize the change.
              </p>

              {pwdError && (
                <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '12px 16px', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '20px' }}>
                  {pwdError}
                </div>
              )}

              {pwdSuccess && (
                <div style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '12px 16px', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '20px' }}>
                  {pwdSuccess}
                </div>
              )}

              {passwordStep === 'input' ? (
                <form onSubmit={handleRequestPasswordOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={labelStyle}>Current Password *</label>
                    <input 
                      type="password" 
                      value={currentPassword} 
                      onChange={e => setCurrentPassword(e.target.value)} 
                      style={inputStyle} 
                      placeholder="Enter current password (default: admin123)"
                      required 
                      onFocus={focusHandler} 
                      onBlur={blurHandler} 
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>New Password *</label>
                    <input 
                      type="password" 
                      value={newPassword} 
                      onChange={e => setNewPassword(e.target.value)} 
                      style={inputStyle} 
                      placeholder="Minimum 6 characters"
                      required 
                      minLength={6}
                      onFocus={focusHandler} 
                      onBlur={blurHandler} 
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Confirm New Password *</label>
                    <input 
                      type="password" 
                      value={confirmPassword} 
                      onChange={e => setConfirmPassword(e.target.value)} 
                      style={inputStyle} 
                      placeholder="Re-enter new password"
                      required 
                      minLength={6}
                      onFocus={focusHandler} 
                      onBlur={blurHandler} 
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={pwdLoading}
                    style={{ 
                      padding: '12px 24px', 
                      backgroundColor: 'var(--orange)', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '8px', 
                      fontWeight: 'bold', 
                      cursor: pwdLoading ? 'default' : 'pointer', 
                      alignSelf: 'flex-start', 
                      marginTop: '8px',
                      transition: 'opacity 0.2s' 
                    }}
                  >
                    {pwdLoading ? 'Sending Verification Code...' : 'Send Verification Code'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleConfirmPasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', padding: '16px', borderRadius: '8px' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#c2410c' }}>
                      Enter the 6-digit code sent to <strong>admin@icaregadget.store</strong> to confirm changing your password.
                    </p>
                  </div>

                  <div>
                    <label style={labelStyle}>6-Digit Verification Code *</label>
                    <input 
                      type="text" 
                      maxLength={6}
                      value={passwordOtp} 
                      onChange={e => setPasswordOtp(e.target.value.replace(/[^0-9]/g, ''))} 
                      style={{ 
                        ...inputStyle, 
                        textAlign: 'center', 
                        fontSize: '1.5rem', 
                        fontWeight: '800', 
                        letterSpacing: '6px',
                        fontFamily: 'monospace'
                      }} 
                      placeholder="------"
                      required 
                      autoFocus
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button 
                      type="submit" 
                      disabled={pwdLoading}
                      style={{ 
                        padding: '12px 24px', 
                        backgroundColor: '#16a34a', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '8px', 
                        fontWeight: 'bold', 
                        cursor: pwdLoading ? 'default' : 'pointer' 
                      }}
                    >
                      {pwdLoading ? 'Updating Password...' : 'Confirm & Update Password'}
                    </button>

                    <button 
                      type="button" 
                      onClick={() => { setPasswordStep('input'); setPasswordOtp(''); setPwdError(''); setPwdSuccess(''); }}
                      style={{ 
                        padding: '12px 18px', 
                        backgroundColor: '#f3f4f6', 
                        color: '#4b5563', 
                        border: 'none', 
                        borderRadius: '8px', 
                        fontWeight: '600', 
                        cursor: 'pointer' 
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Card 2: Cloudflare Email Routing & Forwarding */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                  Email Forwarding (Cloudflare)
                </h2>
                <button 
                  type="button" 
                  onClick={fetchEmailRouting}
                  disabled={cfLoading}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 12px', backgroundColor: '#f3f4f6', color: '#374151',
                    border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.8125rem',
                    fontWeight: '600', cursor: cfLoading ? 'default' : 'pointer'
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: cfLoading ? 'spin 1s linear infinite' : 'none' }}>
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                  </svg>
                  Refresh
                </button>
              </div>

              <p style={{ color: '#6b7280', marginBottom: '20px', fontSize: '0.875rem', lineHeight: '1.5' }}>
                All 2FA login & security verification codes are sent to <strong>{cfRouting.adminEmail || 'admin@icaregadget.store'}</strong>. Cloudflare automatically forwards them to the active destination address below.
              </p>

              {/* Active Forwarding Banner */}
              <div style={{
                backgroundColor: cfRouting.currentForwardTo ? '#f0fdf4' : '#fffbeb',
                border: `1px solid ${cfRouting.currentForwardTo ? '#bbf7d0' : '#fef3c7'}`,
                borderRadius: '10px',
                padding: '16px 20px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: cfRouting.currentForwardTo ? '#15803d' : '#b45309', marginBottom: '4px' }}>
                    Active Forwarding Destination
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#111827' }}>
                    {cfRouting.currentForwardTo || 'No forwarding rule configured'}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '2px' }}>
                    {cfRouting.adminEmail || 'admin@icaregadget.store'} &rarr; {cfRouting.currentForwardTo || 'none'}
                  </div>
                </div>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  backgroundColor: cfRouting.currentForwardTo ? '#dcfce7' : '#fef3c7',
                  color: cfRouting.currentForwardTo ? '#15803d' : '#92400e',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: cfRouting.currentForwardTo ? '#22c55e' : '#f59e0b' }}></span>
                  {cfRouting.currentForwardTo ? 'Active & Receiving' : 'Not Active'}
                </span>
              </div>

              {cfError && (
                <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '12px 16px', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '20px' }}>
                  {cfError}
                </div>
              )}

              {cfSuccess && (
                <div style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '12px 16px', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '20px' }}>
                  {cfSuccess}
                </div>
              )}

              {/* Form: Add New Destination Address */}
              <form onSubmit={handleAddDestination} style={{ marginBottom: '28px' }}>
                <label style={labelStyle}>Add New Destination Email</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <input 
                    type="email" 
                    value={newDestinationEmail} 
                    onChange={e => setNewDestinationEmail(e.target.value)} 
                    placeholder="e.g. newadmin@gmail.com"
                    style={{ ...inputStyle, flex: 1, minWidth: '220px' }}
                    required
                    onFocus={focusHandler}
                    onBlur={blurHandler}
                  />
                  <button 
                    type="submit" 
                    disabled={cfActionLoading || cfLoading}
                    style={{
                      padding: '10px 18px',
                      backgroundColor: 'var(--black)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: '600',
                      cursor: (cfActionLoading || cfLoading) ? 'default' : 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--orange)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--black)'}
                  >
                    {cfActionLoading ? 'Sending...' : 'Add Destination'}
                  </button>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '6px 0 0', lineHeight: '1.4' }}>
                  💡 Cloudflare sends an email verification link to that address. Once you click that link, you can activate it below.
                </p>
              </form>

              {/* Registered Destination Addresses in Cloudflare */}
              <div>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 'bold', color: '#374151', marginBottom: '12px' }}>
                  Cloudflare Registered Destinations ({cfRouting.addresses?.length || 0})
                </h3>

                {cfLoading ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>
                    Loading Cloudflare destinations...
                  </div>
                ) : (!cfRouting.addresses || cfRouting.addresses.length === 0) ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                    No destination addresses registered yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {cfRouting.addresses.map(addr => {
                      const isActive = cfRouting.currentForwardTo?.toLowerCase() === addr.email?.toLowerCase();
                      const isVerified = Boolean(addr.verified);

                      return (
                        <div 
                          key={addr.tag || addr.email}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 16px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            backgroundColor: isActive ? '#f9fafb' : 'white',
                            gap: '12px',
                            flexWrap: 'wrap'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '32px', height: '32px', borderRadius: '50%',
                              backgroundColor: isVerified ? '#dcfce7' : '#fef3c7',
                              color: isVerified ? '#15803d' : '#b45309',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                            }}>
                              {isVerified ? (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                              ) : (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                              )}
                            </div>
                            <div>
                              <div style={{ fontWeight: '600', color: '#111827', fontSize: '0.875rem' }}>
                                {addr.email}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: isVerified ? '#16a34a' : '#d97706' }}>
                                {isVerified ? 'Verified in Cloudflare' : 'Pending verification link'}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {isActive ? (
                              <span style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                backgroundColor: '#16a34a',
                                color: 'white'
                              }}>
                                Active Rule
                              </span>
                            ) : isVerified ? (
                              <button
                                type="button"
                                disabled={cfActionLoading}
                                onClick={() => handleActivateDestination(addr.email)}
                                style={{
                                  padding: '6px 14px',
                                  backgroundColor: 'var(--orange)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  fontSize: '0.8125rem',
                                  fontWeight: '600',
                                  cursor: cfActionLoading ? 'default' : 'pointer'
                                }}
                              >
                                Activate
                              </button>
                            ) : (
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                color: '#9ca3af',
                                backgroundColor: '#f3f4f6'
                              }}>
                                Check Inbox
                              </span>
                            )}

                            {!isActive && (
                              <button
                                type="button"
                                title={`Delete ${addr.email} from Cloudflare`}
                                disabled={cfActionLoading}
                                onClick={() => handleDeleteDestination(addr.tag || addr.id, addr.email)}
                                style={{
                                  padding: '6px 10px',
                                  backgroundColor: '#fee2e2',
                                  color: '#dc2626',
                                  border: '1px solid #fecaca',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  fontWeight: '600',
                                  cursor: cfActionLoading ? 'default' : 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  transition: 'background-color 0.15s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fca5a5'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fee2e2'}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
        {/* ==================== AI ASSISTANT TAB ==================== */}
        {activeTab === 'ai_assistant' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Quick Action Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <button
                onClick={() => handleAiSend("Summarize today's revenue, total orders, and pending delivery status.")}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#10b981'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}
              >
                <div style={{ fontSize: '20px', marginBottom: '6px' }}>📊</div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: '#111827' }}>Revenue & Orders</div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>Live sales and pending shipments</div>
              </button>

              <button
                onClick={() => handleAiSend("Which products are marked as Best Sellers and what items are currently on sale?")}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#10b981'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}
              >
                <div style={{ fontSize: '20px', marginBottom: '6px' }}>⚡</div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: '#111827' }}>Best Sellers & Deals</div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>Review featured gadgets & discounts</div>
              </button>

              <button
                onClick={() => handleAiSend("Suggest 3 promotional marketing campaigns for I Care Gadget this month to boost tech accessories sales.")}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#10b981'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}
              >
                <div style={{ fontSize: '20px', marginBottom: '6px' }}>💡</div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: '#111827' }}>Growth & Campaigns</div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>Promotional strategies & bundle offers</div>
              </button>

              <button
                onClick={() => handleAiSend("What are the most popular trending mobile accessories in Pakistan right now?")}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#10b981'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}
              >
                <div style={{ fontSize: '20px', marginBottom: '6px' }}>🌐</div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: '#111827' }}>Market Trends & Strategy</div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>Ask any business or general question</div>
              </button>
            </div>

            {/* Conversational Console */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
              border: '1px solid #e5e7eb',
              display: 'flex',
              flexDirection: 'column',
              height: '580px',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '14px 24px',
                borderBottom: '1px solid #f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#fafafa'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
                  <span style={{ fontWeight: 600, fontSize: '14px', color: '#111827' }}>Executive Business Co-Pilot</span>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>• icare_db live link</span>
                </div>
                <button
                  onClick={() => setAiMessages([{
                    role: 'assistant',
                    content: "History cleared. What can I calculate or suggest for you?"
                  }])}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#9ca3af',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                  onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
                >
                  Clear History
                </button>
              </div>

              <div style={{
                flex: 1,
                padding: '20px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                backgroundColor: '#f9fafb'
              }}>
                {aiMessages.map((m, idx) => {
                  const isUser = m.role === 'user';
                  return (
                    <div key={idx} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '85%',
                        padding: '12px 18px',
                        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        backgroundColor: isUser ? '#111827' : '#ffffff',
                        color: isUser ? '#ffffff' : '#1f2937',
                        fontSize: '13.5px',
                        lineHeight: '1.55',
                        boxShadow: isUser ? '0 2px 6px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.05)',
                        border: isUser ? 'none' : '1px solid #e5e7eb',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {m.content}
                      </div>
                    </div>
                  );
                })}
                {aiLoading && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{
                      padding: '10px 16px',
                      borderRadius: '16px 16px 16px 4px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      fontSize: '13px',
                      color: '#6b7280',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
                      Analyzing live store data...
                    </div>
                  </div>
                )}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAiSend();
                }}
                style={{
                  padding: '14px 18px',
                  borderTop: '1px solid #f3f4f6',
                  display: 'flex',
                  gap: '10px',
                  backgroundColor: '#ffffff'
                }}
              >
                <input
                  type="text"
                  placeholder="Ask anything: store revenue, best sellers, pricing, campaigns, or general business ideas..."
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  disabled={aiLoading}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '13.5px',
                    outline: 'none',
                    backgroundColor: '#f9fafb'
                  }}
                  onFocus={e => e.target.style.borderColor = '#111827'}
                  onBlur={e => e.target.style.borderColor = '#d1d5db'}
                />
                <button
                  type="submit"
                  disabled={aiLoading || !aiInput.trim()}
                  style={{
                    backgroundColor: '#111827',
                    color: 'white',
                    padding: '0 20px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '13.5px',
                    cursor: aiLoading || !aiInput.trim() ? 'not-allowed' : 'pointer',
                    opacity: aiLoading || !aiInput.trim() ? 0.5 : 1
                  }}
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
