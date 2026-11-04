import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { getCourierTrackingUrl, getCourierBrandStyle } from '../utils/courier';

export default function TrackOrderPage() {
  const [searchParams] = useSearchParams();
  const { trackOrderPublic, storeDetails } = useStore();

  const [orderId, setOrderId] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [orderData, setOrderData] = useState(null);
  const [copied, setCopied] = useState(false);

  // Auto-search if ?orderId= is present in URL
  useEffect(() => {
    const paramId = searchParams.get('orderId');
    if (paramId) {
      setOrderId(paramId);
      performTrack(paramId, '');
    }
  }, [searchParams]);

  const performTrack = async (idToSearch, contactToSearch) => {
    if (!idToSearch || !idToSearch.trim()) {
      setErrorMsg('Please enter your Order ID.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setOrderData(null);

    try {
      const res = await trackOrderPublic(idToSearch.trim(), contactToSearch ? contactToSearch.trim() : '');
      if (res?.success && res?.order) {
        setOrderData(res.order);
      } else {
        setErrorMsg(res?.error || `Order #${idToSearch} could not be found. Please check the ID or contact support.`);
      }
    } catch (err) {
      setErrorMsg('Network error while looking up order. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    performTrack(orderId, contact);
  };

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Status mapping for the 4-step progress bar
  const getStepIndex = (statusStr) => {
    const s = String(statusStr || '').toLowerCase();
    if (s === 'delivered') return 4;
    if (s === 'shipped') return 3;
    if (s === 'processing') return 2;
    if (s === 'cancelled') return -1;
    return 1; // 'Pending' or default
  };

  const currentStep = orderData ? getStepIndex(orderData.status) : 0;
  const isCancelled = currentStep === -1;

  const courierUrl = orderData && orderData.trackingNumber
    ? getCourierTrackingUrl(orderData.courier, orderData.trackingNumber)
    : null;

  const courierStyle = orderData?.courier
    ? getCourierBrandStyle(orderData.courier)
    : { bg: '#f1f5f9', border: '#cbd5e1', text: '#334155', icon: '•' };

  return (
    <main style={{ backgroundColor: '#f8fafc', minHeight: '90vh', padding: '40px 16px' }}>
      <div style={{ maxWidth: '840px', margin: '0 auto' }}>
        
        {/* ================= HEADER ================= */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#fff7ed',
            color: 'var(--orange)',
            border: '1px solid #fed7aa',
            padding: '4px 12px',
            borderRadius: '99px',
            fontSize: '0.8rem',
            fontWeight: '700',
            marginBottom: '10px'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
            Live Order Tracker
          </span>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '800', color: '#0f172a', margin: '0 0 10px 0' }}>
            Track Your Order
          </h1>
          <p style={{ color: '#64748b', fontSize: '1rem', maxWidth: '520px', margin: '0 auto', lineHeight: '1.5' }}>
            Check the real-time shipping progress, courier consignment details, and estimated delivery timeline.
          </p>
        </div>

        {/* ================= SEARCH FORM CARD ================= */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '28px',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e2e8f0',
          marginBottom: '28px'
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '14px', alignItems: 'flex-end' }}>
            <div>
              <label htmlFor="orderIdInput" style={{ display: 'block', fontWeight: '600', fontSize: '0.85rem', color: '#334155', marginBottom: '6px' }}>
                Order ID <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                id="orderIdInput"
                placeholder="e.g. 179320"
                value={orderId}
                onChange={e => setOrderId(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label htmlFor="contactInput" style={{ display: 'block', fontWeight: '600', fontSize: '0.85rem', color: '#334155', marginBottom: '6px' }}>
                Billing Email or Phone <span style={{ color: '#94a3b8', fontWeight: '400' }}>(Optional)</span>
              </label>
              <input
                type="text"
                id="contactInput"
                placeholder="email@example.com or 0300..."
                value={contact}
                onChange={e => setContact(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn--primary"
              style={{
                height: '46px',
                padding: '0 24px',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '0.95rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                whiteSpace: 'nowrap'
              }}
            >
              {loading ? 'Searching...' : 'Track Order'}
            </button>
          </form>

          {errorMsg && (
            <div style={{
              marginTop: '16px',
              padding: '12px 16px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              borderRadius: '10px',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* ================= ORDER TRACKING RESULTS ================= */}
        {orderData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* 1. STATUS TIMELINE CARD */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '28px',
              boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', marginBottom: '24px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                      Order #{orderData.id}
                    </h2>
                    <span style={{
                      backgroundColor: isCancelled ? '#fee2e2' : currentStep >= 4 ? '#dcfce7' : currentStep === 3 ? '#f3e8ff' : '#e0f2fe',
                      color: isCancelled ? '#b91c1c' : currentStep >= 4 ? '#15803d' : currentStep === 3 ? '#7e22ce' : '#0369a1',
                      border: `1px solid ${isCancelled ? '#fca5a5' : currentStep >= 4 ? '#bbf7d0' : currentStep === 3 ? '#e9d5ff' : '#bae6fd'}`,
                      padding: '3px 10px',
                      borderRadius: '99px',
                      fontSize: '0.8rem',
                      fontWeight: '700'
                    }}>
                      {orderData.status || 'Pending'}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px', display: 'inline-block' }}>
                    Placed on: <strong>{orderData.date}</strong> &bull; Receiver: <strong>{orderData.userName}</strong>
                  </span>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a' }}>
                    {orderData.price}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '600' }}>
                    Cash on Delivery (COD)
                  </span>
                </div>
              </div>

              {/* Stepper Progress Bar */}
              {isCancelled ? (
                <div style={{ padding: '24px', backgroundColor: '#fef2f2', borderRadius: '12px', textAlign: 'center', border: '1px solid #fee2e2' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🚫</div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#991b1b', margin: '0 0 6px 0' }}>Order Cancelled</h3>
                  <p style={{ color: '#b91c1c', fontSize: '0.875rem', margin: 0 }}>
                    This order was cancelled. If you believe this is an error or would like to place a new order, please reach out to our team.
                  </p>
                </div>
              ) : (
                <div style={{ padding: '10px 0 20px 0' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', position: 'relative' }}>
                    {[
                      { step: 1, title: 'Order Placed', desc: 'Received & Confirmed' },
                      { step: 2, title: 'Processing', desc: 'Packed at Warehouse' },
                      { step: 3, title: 'Dispatched', desc: orderData.courier ? `With ${orderData.courier}` : 'Handed to Courier' },
                      { step: 4, title: 'Delivered', desc: 'Received by Customer' }
                    ].map((st, idx) => {
                      const isCompleted = currentStep >= st.step;
                      const isCurrent = currentStep === st.step;
                      return (
                        <div key={idx} style={{ textAlign: 'center', position: 'relative' }}>
                          {/* Circle Icon */}
                          <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            margin: '0 auto 10px auto',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1rem',
                            fontWeight: '700',
                            backgroundColor: isCompleted ? 'var(--orange)' : '#f1f5f9',
                            color: isCompleted ? '#ffffff' : '#94a3b8',
                            border: isCurrent ? '3px solid #ffedd5' : '1px solid #e2e8f0',
                            boxShadow: isCurrent ? '0 0 0 4px rgba(249, 115, 22, 0.2)' : 'none',
                            transition: 'all 0.3s ease'
                          }}>
                            {isCompleted ? '✓' : st.step}
                          </div>
                          <div style={{ fontSize: '0.85rem', fontWeight: isCompleted ? '700' : '600', color: isCompleted ? '#0f172a' : '#94a3b8' }}>
                            {st.title}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: isCompleted ? '#64748b' : '#cbd5e1', marginTop: '2px' }}>
                            {st.desc}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 2. COURIER CONSIGNMENT CARD (If shipped with tracking) */}
            {orderData.trackingNumber ? (
              <div style={{
                backgroundColor: courierStyle.bg,
                border: `1px solid ${courierStyle.border}`,
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}>
                    {courierStyle.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: courierStyle.text, letterSpacing: '0.5px' }}>
                      Official Courier Partner
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a' }}>
                      {orderData.courier || 'Courier Express'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                      <span style={{ fontSize: '0.85rem', color: '#475569' }}>
                        Consignment / Tracking #: <strong>{orderData.trackingNumber}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(orderData.trackingNumber)}
                        style={{
                          background: '#ffffff',
                          border: `1px solid ${courierStyle.border}`,
                          borderRadius: '4px',
                          padding: '2px 8px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: courierStyle.text,
                          cursor: 'pointer'
                        }}
                      >
                        {copied ? '✓ Copied!' : 'Copy CN'}
                      </button>
                    </div>
                  </div>
                </div>

                {courierUrl && (
                  <a
                    href={courierUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn--primary"
                    style={{
                      padding: '12px 20px',
                      borderRadius: '10px',
                      fontWeight: '700',
                      fontSize: '0.9rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      textDecoration: 'none'
                    }}
                  >
                    <span>Track Live on {orderData.courier}</span>
                    <span>↗</span>
                  </a>
                )}
              </div>
            ) : currentStep === 3 ? (
              <div style={{
                backgroundColor: '#fffbeb',
                border: '1px solid #fef3c7',
                borderRadius: '12px',
                padding: '16px 20px',
                fontSize: '0.875rem',
                color: '#92400e',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                <span>Your order has been dispatched! Consignment tracking number will be assigned shortly by the courier team.</span>
              </div>
            ) : null}

            {/* 3. ORDER DETAILS & ITEMS SUMMARY */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '28px',
              boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0f172a', margin: '0 0 16px 0' }}>
                Order Summary
              </h3>

              {/* Items List */}
              <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', marginBottom: '16px' }}>
                {orderData.items && orderData.items.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {orderData.items.map((it, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{
                            backgroundColor: '#f1f5f9',
                            color: '#334155',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontWeight: '700',
                            fontSize: '0.8rem'
                          }}>
                            {it.quantity || 1}x
                          </span>
                          <span style={{ fontWeight: '600', color: '#1e293b' }}>{it.name}</span>
                        </div>
                        <span style={{ color: '#475569', fontWeight: '600' }}>{it.price}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.95rem', color: '#1e293b', fontWeight: '500' }}>
                    {orderData.productName || 'Gadget Order'}
                  </div>
                )}
              </div>

              {/* Shipping Address */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.875rem' }}>
                <div>
                  <div style={{ color: '#64748b', marginBottom: '4px' }}>Delivery Address:</div>
                  <div style={{ color: '#1e293b', fontWeight: '600' }}>
                    {orderData.shippingAddress || 'Registered Store Address'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748b', marginBottom: '4px' }}>Payment Method:</div>
                  <div style={{ color: '#16a34a', fontWeight: '700' }}>
                    Cash on Delivery (Pay when rider arrives)
                  </div>
                </div>
              </div>
            </div>

            {/* 4. HELPLINE SUPPORT */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '20px 24px',
              border: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.95rem' }}>Have questions about your delivery?</div>
                <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Our customer service team is ready to assist you.</div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <a
                  href={`https://wa.me/923001234567?text=Hello%20I%20CARE%2C%20I%20want%20an%20update%20on%20my%20Order%20%23${orderData.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    backgroundColor: '#25d366',
                    color: '#ffffff',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    textDecoration: 'none'
                  }}
                >
                  WhatsApp Support
                </a>
                <Link
                  to="/account"
                  style={{
                    backgroundColor: '#f1f5f9',
                    color: '#1e293b',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    textDecoration: 'none'
                  }}
                >
                  My Account
                </Link>
              </div>
            </div>

          </div>
        )}

      </div>
    </main>
  );
}
