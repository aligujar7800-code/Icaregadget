import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { getCourierTrackingUrl, getCourierBrandStyle } from '../utils/courier';
import CustomerOverviewTab from '../components/customer/CustomerOverviewTab';
import CustomerAddressesTab from '../components/customer/CustomerAddressesTab';
import CustomerReturnsTab from '../components/customer/CustomerReturnsTab';
import CustomerAppointmentsTab from '../components/customer/CustomerAppointmentsTab';
import CustomerReceiptModal from '../components/customer/CustomerReceiptModal';

export default function CustomerDashboard() {
  const { 
    user, 
    logout, 
    getCustomerOrders, 
    updateCustomerProfile, 
    changeCustomerPassword, 
    cart, 
    setIsCartOpen 
  } = useStore();

  const navigate = useNavigate();

  // Active tab: 'orders' | 'profile' | 'security'
  const [activeTab, setActiveTab] = useState('overview');
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [orderFilter, setOrderFilter] = useState('all');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  // Profile Form state
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [city, setCity] = useState(user?.city || '');
  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });
  const [profileLoading, setProfileLoading] = useState(false);

  // Password Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState({ text: '', type: '' });
  const [pwdLoading, setPwdLoading] = useState(false);

  // Protect route: Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (user.role === 'admin') {
      navigate('/admin');
    } else {
      setName(user.name || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
      setCity(user.city || '');
    }
  }, [user, navigate]);

  if (!user) return null;

  const orders = getCustomerOrders();

  // Metrics calculation
  const totalOrdersCount = orders.length;
  const pendingOrdersCount = orders.filter(o => (o.status || 'Pending').toLowerCase() === 'pending' || (o.status || '').toLowerCase() === 'processing').length;
  const deliveredOrdersCount = orders.filter(o => (o.status || '').toLowerCase() === 'delivered').length;
  
  const parseAmount = (priceStr) => {
    if (!priceStr) return 0;
    const num = parseInt(String(priceStr).replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 0 : num;
  };

  const totalSpent = orders.reduce((sum, o) => sum + parseAmount(o.price), 0);

  // Filtered orders
  const filteredOrders = orders.filter(o => {
    if (orderFilter === 'all') return true;
    const status = (o.status || 'pending').toLowerCase();
    if (orderFilter === 'pending') return status === 'pending' || status === 'processing';
    if (orderFilter === 'delivered') return status === 'delivered';
    if (orderFilter === 'cancelled') return status === 'cancelled';
    return true;
  });

  const getStatusBadge = (status = 'Pending') => {
    const s = status.toLowerCase();
    if (s === 'delivered') {
      return { bg: '#dcfce7', text: '#15803d', label: 'Delivered', border: '#bbf7d0' };
    }
    if (s === 'processing' || s === 'shipped') {
      return { bg: '#e0f2fe', text: '#0369a1', label: status, border: '#bae6fd' };
    }
    if (s === 'cancelled') {
      return { bg: '#fee2e2', text: '#b91c1c', label: 'Cancelled', border: '#fecaca' };
    }
    return { bg: '#fef3c7', text: '#b45309', label: 'Pending', border: '#fde68a' };
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMsg({ text: '', type: '' });
    setProfileLoading(true);

    try {
      const res = await updateCustomerProfile({ name, phone, address, city });
      if (res?.error) {
        setProfileMsg({ text: res.error, type: 'error' });
      } else {
        setProfileMsg({ text: 'Profile details updated successfully!', type: 'success' });
      }
    } catch (err) {
      setProfileMsg({ text: 'Failed to update profile.', type: 'error' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwdMsg({ text: '', type: '' });

    if (newPassword.length < 6) {
      setPwdMsg({ text: 'New password must be at least 6 characters long.', type: 'error' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdMsg({ text: 'New passwords do not match.', type: 'error' });
      return;
    }

    setPwdLoading(true);

    try {
      const res = await changeCustomerPassword(currentPassword, newPassword);
      if (res?.error) {
        setPwdMsg({ text: res.error, type: 'error' });
      } else {
        setPwdMsg({ text: 'Password updated successfully!', type: 'success' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setPwdMsg({ text: 'Failed to update password.', type: 'error' });
    } finally {
      setPwdLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '90vh', padding: '24px 28px' }}>
      <div style={{ maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
        
        {/* ================= TOP HERO BANNER ================= */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          padding: '16px 20px',
          border: '1px solid #e2e8f0',
          marginBottom: '16px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: 'var(--orange)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              overflow: 'hidden',
              flexShrink: 0
            }}>
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                (user.name || 'C').charAt(0)
              )}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                  Welcome back, {user.name || 'Customer'}!
                </h1>
                <span style={{
                  backgroundColor: '#dcfce7',
                  color: '#15803d',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '20px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  Verified
                </span>
              </div>
              <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '2px 0 0 0' }}>
                {user.email} &bull; Member of icaregadget
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <Link 
              to="/" 
              className="btn btn--outline" 
              style={{ padding: '7px 14px', fontSize: '0.8125rem', borderRadius: '6px' }}
            >
              &larr; Continue Shopping
            </Link>
          </div>
        </div>

        {/* ================= KEY METRICS OVERVIEW ================= */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '10px',
          marginBottom: '16px'
        }}>
          {/* Card 1: Total Orders */}
          <div style={{
            backgroundColor: '#ffffff',
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            </div>
            <div>
              <div style={{ fontSize: '10.5px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Total Orders</div>
              <div style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0f172a' }}>{totalOrdersCount}</div>
            </div>
          </div>

          {/* Card 2: Active / In Progress */}
          <div style={{
            backgroundColor: '#ffffff',
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div>
              <div style={{ fontSize: '10.5px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>In Progress</div>
              <div style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0f172a' }}>{pendingOrdersCount}</div>
            </div>
          </div>

          {/* Card 3: Total Spent */}
          <div style={{
            backgroundColor: '#ffffff',
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <div>
              <div style={{ fontSize: '10.5px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Total Purchases</div>
              <div style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0f172a' }}>Rs. {totalSpent.toLocaleString()}</div>
            </div>
          </div>

          {/* Card 4: Cart Items */}
          <div 
            onClick={() => setIsCartOpen(true)}
            style={{
              backgroundColor: '#ffffff',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              transition: 'border-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#94a3b8'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
          >
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            </div>
            <div>
              <div style={{ fontSize: '10.5px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Items in Cart</div>
              <div style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0f172a' }}>
                {cart.reduce((total, i) => total + i.quantity, 0)} <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '600' }}>View &rarr;</span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= MAIN TABS LAYOUT ================= */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '210px 1fr',
          gap: '14px',
          alignItems: 'start'
        }} className="customer-dashboard-layout">
          
          {/* Dashboard Left Navigation */}
          <aside style={{
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            padding: '8px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeTab === 'overview' ? '#fff7ed' : 'transparent',
                color: activeTab === 'overview' ? 'var(--orange)' : '#475569',
                fontWeight: activeTab === 'overview' ? '700' : '600',
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              Overview
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeTab === 'orders' ? '#fff7ed' : 'transparent',
                color: activeTab === 'orders' ? 'var(--orange)' : '#475569',
                fontWeight: activeTab === 'orders' ? '700' : '600',
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
              My Orders ({totalOrdersCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('addresses')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeTab === 'addresses' ? '#fff7ed' : 'transparent',
                color: activeTab === 'addresses' ? 'var(--orange)' : '#475569',
                fontWeight: activeTab === 'addresses' ? '700' : '600',
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              Delivery Book
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('returns')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeTab === 'returns' ? '#fff7ed' : 'transparent',
                color: activeTab === 'returns' ? 'var(--orange)' : '#475569',
                fontWeight: activeTab === 'returns' ? '700' : '600',
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
              Warranty & Returns
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('appointments')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeTab === 'appointments' ? '#fff7ed' : 'transparent',
                color: activeTab === 'appointments' ? 'var(--orange)' : '#475569',
                fontWeight: activeTab === 'appointments' ? '700' : '600',
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Repair / Demo
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeTab === 'profile' ? '#fff7ed' : 'transparent',
                color: activeTab === 'profile' ? 'var(--orange)' : '#475569',
                fontWeight: activeTab === 'profile' ? '700' : '600',
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Profile & Shipping
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('security')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeTab === 'security' ? '#fff7ed' : 'transparent',
                color: activeTab === 'security' ? 'var(--orange)' : '#475569',
                fontWeight: activeTab === 'security' ? '700' : '600',
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Password & Security
            </button>

            <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '4px 0' }} />

            <Link
              to="/track"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: '6px',
                color: '#475569',
                fontWeight: '600',
                fontSize: '13px',
                textDecoration: 'none'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Track an Order
            </Link>

            <Link
              to="/book-appointment"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: '6px',
                color: '#475569',
                fontWeight: '600',
                fontSize: '13px',
                textDecoration: 'none'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Book Repair / Demo
            </Link>

            <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '4px 0' }} />

            <button
              type="button"
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'transparent',
                color: '#dc2626',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fef2f2'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Sign Out
            </button>
          </aside>

          {/* Dashboard Main Content Area */}
          <main style={{ minWidth: 0 }}>
            
            {/* ================= TAB 0: OVERVIEW ================= */}
            {activeTab === 'overview' && (
              <CustomerOverviewTab
                user={user}
                orders={orders}
                setActiveTab={setActiveTab}
                setSelectedOrderDetails={setSelectedOrderDetails}
                setIsCartOpen={setIsCartOpen}
                cart={cart}
              />
            )}

            {/* ================= TAB: SAVED ADDRESSES ================= */}
            {activeTab === 'addresses' && (
              <CustomerAddressesTab user={user} />
            )}

            {/* ================= TAB: RETURNS & WARRANTY ================= */}
            {activeTab === 'returns' && (
              <CustomerReturnsTab user={user} orders={orders} />
            )}

            {/* ================= TAB: APPOINTMENTS ================= */}
            {activeTab === 'appointments' && (
              <CustomerAppointmentsTab user={user} />
            )}

            {/* ================= TAB 1: MY ORDERS ================= */}
            {activeTab === 'orders' && (
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '10px',
                padding: '18px 20px',
                border: '1px solid #e2e8f0',
                boxShadow: 'none'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                      Order History
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '4px 0 0 0' }}>
                      Track status, view items and purchase receipts
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div style={{ display: 'flex', gap: '8px', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
                    {[
                      { key: 'all', label: 'All' },
                      { key: 'pending', label: 'In Progress' },
                      { key: 'delivered', label: 'Delivered' },
                      { key: 'cancelled', label: 'Cancelled' },
                    ].map(f => (
                      <button
                        key={f.key}
                        onClick={() => setOrderFilter(f.key)}
                        style={{
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          backgroundColor: orderFilter === f.key ? '#ffffff' : 'transparent',
                          color: orderFilter === f.key ? '#0f172a' : '#64748b',
                          fontWeight: '600',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          boxShadow: orderFilter === f.key ? '0 1px 2px rgba(0,0,0,0.08)' : 'none'
                        }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredOrders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                    <div style={{ width: '64px', height: '64px', margin: '0 auto 16px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                    </div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>No Orders Found</h3>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '360px', margin: '0 auto 20px' }}>
                      {orderFilter === 'all' 
                        ? "You haven't placed any orders with this account yet. Discover our latest gadgets!" 
                        : `No orders matching filter "${orderFilter}".`}
                    </p>
                    <Link to="/mobiles" className="btn btn--primary" style={{ padding: '10px 24px', borderRadius: '8px', fontSize: '0.9rem' }}>
                      Browse Products
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {filteredOrders.map(order => {
                      const badge = getStatusBadge(order.status);
                      return (
                        <div 
                          key={order.id} 
                          style={{
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            padding: '20px',
                            backgroundColor: '#ffffff',
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                          }}
                        >
                          {/* Order Header */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px', marginBottom: '14px' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontWeight: '800', fontSize: '1.05rem', color: '#0f172a' }}>
                                  Order #{order.id}
                                </span>
                                <span style={{
                                  backgroundColor: badge.bg,
                                  color: badge.text,
                                  border: `1px solid ${badge.border}`,
                                  fontSize: '0.75rem',
                                  fontWeight: '700',
                                  padding: '2px 8px',
                                  borderRadius: '6px'
                                }}>
                                  {badge.label}
                                </span>
                              </div>
                              <span style={{ fontSize: '0.825rem', color: '#64748b', marginTop: '2px', display: 'inline-block' }}>
                                Placed on {order.date || 'Recent'}
                              </span>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>
                                {order.price}
                              </div>
                              <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '600' }}>
                                Cash on Delivery / Paid
                              </span>
                            </div>
                          </div>

                          {/* Order Products Preview */}
                          <div style={{ marginBottom: '14px' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                              Items:
                            </div>
                            <div style={{ color: '#1e293b', fontSize: '0.925rem', lineHeight: '1.5' }}>
                              {order.items && order.items.length > 0 ? (
                                <ul style={{ margin: 0, paddingLeft: '18px' }}>
                                  {order.items.map((it, idx) => (
                                    <li key={idx}>
                                      <strong>{it.quantity}x</strong> {it.name} &bull; <span style={{ color: '#64748b' }}>{it.price}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <span>{order.productName || 'Gadget Order'}</span>
                              )}
                            </div>
                          </div>

                          {/* Courier Dispatch Tracking Box */}
                          {(order.trackingNumber || (order.status || '').toLowerCase() === 'shipped') && (
                            <div style={{
                              marginBottom: '14px',
                              padding: '12px 14px',
                              borderRadius: '10px',
                              backgroundColor: order.trackingNumber ? getCourierBrandStyle(order.courier).bg : '#f8fafc',
                              border: `1px solid ${order.trackingNumber ? getCourierBrandStyle(order.courier).border : '#e2e8f0'}`,
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: '10px'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.05)', color: '#0f172a' }}>
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                                </span>
                                <div>
                                  <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0f172a' }}>
                                    {order.trackingNumber ? `Dispatched with ${order.courier || 'Courier'}` : 'Parcel Dispatched'}
                                  </div>
                                  {order.trackingNumber ? (
                                    <div style={{ fontSize: '0.8rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span>CN / Tracking: <strong>{order.trackingNumber}</strong></span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          navigator.clipboard.writeText(order.trackingNumber);
                                          alert(`Copied tracking number: ${order.trackingNumber}`);
                                        }}
                                        style={{ background: 'none', border: 'none', color: 'var(--orange)', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                                      >
                                        Copy
                                      </button>
                                    </div>
                                  ) : (
                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                      Shipped and en route with our delivery partner.
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div style={{ display: 'flex', gap: '8px' }}>
                                {order.trackingNumber && getCourierTrackingUrl(order.courier, order.trackingNumber) && (
                                  <a
                                    href={getCourierTrackingUrl(order.courier, order.trackingNumber)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      padding: '6px 12px',
                                      borderRadius: '6px',
                                      backgroundColor: '#111827',
                                      color: '#ffffff',
                                      fontSize: '0.78rem',
                                      fontWeight: '600',
                                      textDecoration: 'none',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                  >
                                    Track on {order.courier || 'Courier'} ↗
                                  </a>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Order Footer & Actions */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', paddingTop: '12px', borderTop: '1px solid #f8fafc' }}>
                            <div style={{ fontSize: '0.825rem', color: '#64748b' }}>
                              {order.shippingAddress ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                  Shipping to: <strong>{order.shippingAddress}</strong>
                                </span>
                              ) : (
                                <span>Receiver: <strong>{order.userName}</strong></span>
                              )}
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                type="button"
                                onClick={() => setSelectedOrderDetails(order)}
                                style={{
                                  padding: '7px 14px',
                                  borderRadius: '6px',
                                  border: '1px solid #cbd5e1',
                                  backgroundColor: '#ffffff',
                                  color: '#334155',
                                  fontSize: '0.825rem',
                                  fontWeight: '600',
                                  cursor: 'pointer'
                                }}
                              >
                                View Details & Receipt
                              </button>
                              <Link
                                to={`/track?orderId=${order.id}`}
                                style={{
                                  padding: '7px 14px',
                                  borderRadius: '6px',
                                  backgroundColor: '#f1f5f9',
                                  color: '#0f172a',
                                  fontSize: '0.825rem',
                                  fontWeight: '600',
                                  textDecoration: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center'
                                }}
                              >
                                Track &rarr;
                              </Link>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ================= TAB 2: PROFILE & SHIPPING ================= */}
            {activeTab === 'profile' && (
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '10px',
                padding: '18px 20px',
                border: '1px solid #e2e8f0',
                boxShadow: 'none'
              }}>
                <div style={{ marginBottom: '18px' }}>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                    Customer Profile & Address
                  </h2>
                  <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '4px 0 0 0' }}>
                    Keep your contact information and delivery address up to date for fast checkout
                  </p>
                </div>

                {profileMsg.text && (
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    marginBottom: '20px',
                    backgroundColor: profileMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
                    color: profileMsg.type === 'success' ? '#15803d' : '#b91c1c',
                    border: `1px solid ${profileMsg.type === 'success' ? '#bbf7d0' : '#fecaca'}`
                  }}>
                    {profileMsg.text}
                  </div>
                )}

                <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label htmlFor="p-name" style={{ fontWeight: '600', fontSize: '0.875rem', color: '#334155' }}>
                        Full Name
                      </label>
                      <input 
                        type="text" 
                        id="p-name" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)}
                        style={{ padding: '11px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none' }}
                        required
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label htmlFor="p-email" style={{ fontWeight: '600', fontSize: '0.875rem', color: '#334155' }}>
                        Email Address (Account Identifier)
                      </label>
                      <input 
                        type="email" 
                        id="p-email" 
                        value={user.email || ''} 
                        disabled
                        style={{ padding: '11px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.95rem', cursor: 'not-allowed' }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label htmlFor="p-phone" style={{ fontWeight: '600', fontSize: '0.875rem', color: '#334155' }}>
                        Phone Number
                      </label>
                      <input 
                        type="tel" 
                        id="p-phone" 
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+92 300 1234567"
                        style={{ padding: '11px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none' }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label htmlFor="p-city" style={{ fontWeight: '600', fontSize: '0.875rem', color: '#334155' }}>
                        City
                      </label>
                      <input 
                        type="text" 
                        id="p-city" 
                        value={city} 
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Faisalabad, Lahore, Karachi"
                        style={{ padding: '11px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none' }}
                      />
                    </div>

                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label htmlFor="p-address" style={{ fontWeight: '600', fontSize: '0.875rem', color: '#334155' }}>
                      Default Delivery / Shipping Address
                    </label>
                    <textarea 
                      id="p-address" 
                      rows={3}
                      value={address} 
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="House No, Street, Landmark, Area"
                      style={{ padding: '11px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button 
                      type="submit" 
                      className="btn btn--primary" 
                      disabled={profileLoading}
                      style={{ padding: '12px 28px', borderRadius: '8px', fontSize: '0.95rem', fontWeight: '700' }}
                    >
                      {profileLoading ? 'Saving...' : 'Save Profile Changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ================= TAB 3: PASSWORD & SECURITY ================= */}
            {activeTab === 'security' && (
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '10px',
                padding: '18px 20px',
                border: '1px solid #e2e8f0',
                boxShadow: 'none'
              }}>
                <div style={{ marginBottom: '18px' }}>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                    Password & Security
                  </h2>
                  <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '4px 0 0 0' }}>
                    Update your password to keep your account safe
                  </p>
                </div>

                {pwdMsg.text && (
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    marginBottom: '20px',
                    backgroundColor: pwdMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
                    color: pwdMsg.type === 'success' ? '#15803d' : '#b91c1c',
                    border: `1px solid ${pwdMsg.type === 'success' ? '#bbf7d0' : '#fecaca'}`
                  }}>
                    {pwdMsg.text}
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '480px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label htmlFor="current-pwd" style={{ fontWeight: '600', fontSize: '0.875rem', color: '#334155' }}>
                      Current Password
                    </label>
                    <input 
                      type="password" 
                      id="current-pwd" 
                      value={currentPassword} 
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      style={{ padding: '11px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none' }}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label htmlFor="new-pwd" style={{ fontWeight: '600', fontSize: '0.875rem', color: '#334155' }}>
                      New Password (min 6 characters)
                    </label>
                    <input 
                      type="password" 
                      id="new-pwd" 
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      style={{ padding: '11px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none' }}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label htmlFor="confirm-pwd" style={{ fontWeight: '600', fontSize: '0.875rem', color: '#334155' }}>
                      Confirm New Password
                    </label>
                    <input 
                      type="password" 
                      id="confirm-pwd" 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      style={{ padding: '11px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none' }}
                      required
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn--primary" 
                    disabled={pwdLoading}
                    style={{ padding: '12px', borderRadius: '8px', fontSize: '0.95rem', fontWeight: '700', marginTop: '10px' }}
                  >
                    {pwdLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>
            )}

          </main>
        </div>

      </div>

      {/* ================= ORDER DETAILS MODAL ================= */}
      {selectedOrderDetails && (
        <div 
          onClick={() => setSelectedOrderDetails(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 9999
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '560px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: '#0f172a' }}>
                  Order Details #{selectedOrderDetails.id}
                </h3>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Placed on {selectedOrderDetails.date || 'Recent'}
                </span>
              </div>
              <button 
                onClick={() => setSelectedOrderDetails(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            {/* 5-Step Order Progress Timeline */}
            {(() => {
              const st = (selectedOrderDetails.status || 'Pending').toLowerCase();
              const isConfirmed = st !== 'pending';
              const isProcessing = st === 'processing' || st === 'shipped' || st === 'delivered';
              const isShipped = st === 'shipped' || st === 'delivered';
              const isDelivered = st === 'delivered';
              const isCancelled = st === 'cancelled';

              return (
                <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', color: '#475569' }}>
                      Delivery Progress Timeline
                    </div>
                    {isCancelled ? (
                      <span style={{ backgroundColor: '#fee2e2', color: '#b91c1c', fontSize: '0.75rem', fontWeight: '700', padding: '2px 8px', borderRadius: '4px' }}>
                        Cancelled
                      </span>
                    ) : (
                      <span style={{ backgroundColor: isDelivered ? '#dcfce7' : '#e0f2fe', color: isDelivered ? '#15803d' : '#0369a1', fontSize: '0.75rem', fontWeight: '700', padding: '2px 8px', borderRadius: '4px' }}>
                        {selectedOrderDetails.status || 'Pending'}
                      </span>
                    )}
                  </div>

                  {!isCancelled && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                      <div style={{ textAlign: 'center', zIndex: 1 }}>
                        <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: '#16a34a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 4px', fontSize: '0.72rem', fontWeight: '700' }}>✓</div>
                        <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#16a34a' }}>Placed</span>
                      </div>
                      <div style={{ flex: 1, height: '2px', backgroundColor: isConfirmed ? '#16a34a' : '#cbd5e1' }} />

                      <div style={{ textAlign: 'center', zIndex: 1 }}>
                        <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: isConfirmed ? '#16a34a' : '#e2e8f0', color: isConfirmed ? 'white' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 4px', fontSize: '0.72rem', fontWeight: '700' }}>{isConfirmed ? '✓' : '2'}</div>
                        <span style={{ fontSize: '0.7rem', fontWeight: '700', color: isConfirmed ? '#16a34a' : '#64748b' }}>Confirmed</span>
                      </div>
                      <div style={{ flex: 1, height: '2px', backgroundColor: isProcessing ? '#16a34a' : '#cbd5e1' }} />

                      <div style={{ textAlign: 'center', zIndex: 1 }}>
                        <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: isProcessing ? '#16a34a' : '#e2e8f0', color: isProcessing ? 'white' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 4px', fontSize: '0.72rem', fontWeight: '700' }}>{isProcessing ? '✓' : '3'}</div>
                        <span style={{ fontSize: '0.7rem', fontWeight: '700', color: isProcessing ? '#16a34a' : '#64748b' }}>Packed</span>
                      </div>
                      <div style={{ flex: 1, height: '2px', backgroundColor: isShipped ? '#16a34a' : '#cbd5e1' }} />

                      <div style={{ textAlign: 'center', zIndex: 1 }}>
                        <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: isShipped ? (isDelivered ? '#16a34a' : 'var(--orange, #ea580c)') : '#e2e8f0', color: isShipped ? 'white' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 4px', fontSize: '0.72rem', fontWeight: '700' }}>{isDelivered ? '✓' : '4'}</div>
                        <span style={{ fontSize: '0.7rem', fontWeight: '700', color: isShipped ? 'var(--orange, #ea580c)' : '#64748b' }}>Shipped</span>
                      </div>
                      <div style={{ flex: 1, height: '2px', backgroundColor: isDelivered ? '#16a34a' : '#cbd5e1' }} />

                      <div style={{ textAlign: 'center', zIndex: 1 }}>
                        <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: isDelivered ? '#16a34a' : '#e2e8f0', color: isDelivered ? 'white' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 4px', fontSize: '0.72rem', fontWeight: '700' }}>{isDelivered ? '✓' : '5'}</div>
                        <span style={{ fontSize: '0.7rem', fontWeight: '700', color: isDelivered ? '#16a34a' : '#64748b' }}>Delivered</span>
                      </div>
                    </div>
                  )}

                  {selectedOrderDetails.trackingNumber && (
                    <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ fontSize: '0.8rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                        <span><strong>{selectedOrderDetails.courier || 'Courier Partner'}</strong> &bull; CN: <strong>{selectedOrderDetails.trackingNumber}</strong></span>
                      </div>
                      {getCourierTrackingUrl(selectedOrderDetails.courier, selectedOrderDetails.trackingNumber) && (
                        <a
                          href={getCourierTrackingUrl(selectedOrderDetails.courier, selectedOrderDetails.trackingNumber)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            backgroundColor: '#0f172a',
                            color: '#ffffff',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            textDecoration: 'none'
                          }}
                        >
                          Live Track ↗
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Items Breakdown */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '10px' }}>
                Ordered Products
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                {selectedOrderDetails.items && selectedOrderDetails.items.length > 0 ? (
                  selectedOrderDetails.items.map((it, idx) => (
                    <div key={idx} style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: idx < selectedOrderDetails.items.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '0.9rem', color: '#0f172a' }}>{it.name}</div>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Qty: {it.quantity}</span>
                      </div>
                      <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#0f172a' }}>
                        {it.price}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '14px 16px', color: '#334155' }}>
                    {selectedOrderDetails.productName}
                  </div>
                )}
              </div>
            </div>

            {/* Total / Breakdown */}
            <div style={{ padding: '12px 0', borderTop: '2px dashed #e2e8f0', marginBottom: '20px' }}>
              {(() => {
                const pNum = (v) => parseInt(String(v || '').replace(/[^0-9]/g, ''), 10) || 0;
                const grand = pNum(selectedOrderDetails.price);
                const itemsSub = (selectedOrderDetails.items || []).reduce((acc, it) => acc + (pNum(it.price) * (parseInt(it.quantity || 1, 10) || 1)), 0);
                const rawSub = pNum(selectedOrderDetails.subtotal);
                const sub = (rawSub > 0 && rawSub >= grand) ? rawSub : (itemsSub > 0 ? itemsSub : grand);
                const rawDisc = pNum(selectedOrderDetails.discountAmount || selectedOrderDetails.discount_amount);
                const disc = rawDisc > 0 ? rawDisc : Math.max(0, sub - grand);

                if (disc > 0) {
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.875rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                        <span>Subtotal:</span>
                        <span>Rs. {sub.toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#15803d', fontWeight: '700' }}>
                        <span>Promo Discount:</span>
                        <span>- Rs. {disc.toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid #f1f5f9' }}>
                        <span style={{ fontWeight: '700', fontSize: '1rem', color: '#0f172a' }}>Total Amount</span>
                        <span style={{ fontWeight: '800', fontSize: '1.25rem', color: 'var(--orange)' }}>Rs. {grand.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                }
                return (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', fontSize: '1rem', color: '#0f172a' }}>Total Amount</span>
                    <span style={{ fontWeight: '800', fontSize: '1.25rem', color: 'var(--orange)' }}>{selectedOrderDetails.price}</span>
                  </div>
                );
              })()}
            </div>

            {/* Shipping Info */}
            <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '8px', fontSize: '0.85rem', color: '#475569', marginBottom: '20px' }}>
              <div><strong>Recipient:</strong> {selectedOrderDetails.userName || user.name}</div>
              <div><strong>Email:</strong> {selectedOrderDetails.userEmail || user.email}</div>
              {selectedOrderDetails.phone && <div><strong>Phone:</strong> {selectedOrderDetails.phone}</div>}
              {selectedOrderDetails.shippingAddress && <div><strong>Address:</strong> {selectedOrderDetails.shippingAddress}</div>}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsReceiptOpen(true)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                Print Receipt
              </button>
              <button
                type="button"
                onClick={() => setSelectedOrderDetails(null)}
                className="btn btn--primary"
                style={{ flex: 1, padding: '12px', borderRadius: '8px', fontWeight: '700' }}
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Printable Receipt Modal */}
      {isReceiptOpen && selectedOrderDetails && (
        <CustomerReceiptModal
          order={selectedOrderDetails}
          user={user}
          onClose={() => setIsReceiptOpen(false)}
        />
      )}

    </div>
  );
}
