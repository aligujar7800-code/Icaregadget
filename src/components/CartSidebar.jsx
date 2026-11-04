import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { useNavigate } from 'react-router-dom';

export default function CartSidebar() {
  const { cart, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart, clearCart, placeOrder, user } = useStore();
  const navigate = useNavigate();

  // Checkout Options
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Address Options
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('profile');
  const [customAddress, setCustomAddress] = useState(user?.address || '');
  const [customCity, setCustomCity] = useState(user?.city || 'Lahore');
  const [customPhone, setCustomPhone] = useState(user?.phone || '');
  const [customRecipient, setCustomRecipient] = useState(user?.name || '');

  // Payment Options
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [activeCartSessionId, setActiveCartSessionId] = useState(null);

  const parsePrice = (priceStr) => parseInt(String(priceStr).replace(/[^0-9]/g, ''), 10) || 0;
  const subtotal = cart.reduce((acc, item) => acc + (parsePrice(item.price) * item.quantity), 0);
  const finalTotal = Math.max(0, subtotal - couponDiscount);

  const userId = user?.id || user?.email;

  // Load saved addresses when user is logged in
  useEffect(() => {
    if (user && userId && isCartOpen) {
      fetch(`/api/customer/addresses?userId=${encodeURIComponent(userId)}`)
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          setSavedAddresses(data);
          const def = data.find(a => a.is_default);
          if (def) {
            setSelectedAddressId(def.id);
          } else if (data.length > 0) {
            setSelectedAddressId(data[0].id);
          } else {
            setSelectedAddressId('custom');
          }
        })
        .catch(() => setSelectedAddressId('custom'));

      if (user.address) setCustomAddress(user.address);
      if (user.city) setCustomCity(user.city);
      if (user.phone) setCustomPhone(user.phone);
      if (user.name) setCustomRecipient(user.name);
    }
  }, [user, userId, isCartOpen]);

  // Debounced auto-record abandoned cart when customer has items and contact details
  useEffect(() => {
    if (cart.length > 0 && (user || customPhone || customAddress)) {
      const timer = setTimeout(async () => {
        try {
          const res = await fetch('/api/abandoned-carts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user?.id || null,
              customerName: customRecipient || user?.name || 'Shopper',
              customerEmail: user?.email || '',
              customerPhone: customPhone || user?.phone || '',
              items: cart.map(i => ({ name: i.name || i.title, quantity: i.quantity, price: i.price })),
              cartValue: subtotal
            })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.id) setActiveCartSessionId(data.id);
          }
        } catch (e) {
          // Non-blocking background sync
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [cart, user, customPhone, customRecipient, subtotal]);

  // Recalculate or auto-remove coupon if cart subtotal changes
  useEffect(() => {
    if (appliedCoupon) {
      const minReq = Number(appliedCoupon.coupon?.min_order_value || appliedCoupon.min_order_value || 0);
      if (minReq > 0 && subtotal < minReq) {
        setAppliedCoupon(null);
        setCouponDiscount(0);
        setCouponError(`Coupon removed: Minimum cart value of Rs. ${minReq.toLocaleString()} required`);
      } else if (appliedCoupon.type === 'percentage') {
        const pct = Number(appliedCoupon.value || appliedCoupon.coupon?.value || 0);
        let newDisc = Math.round((subtotal * pct) / 100);
        const maxDisc = Number(appliedCoupon.coupon?.max_discount || 0);
        if (maxDisc > 0 && newDisc > maxDisc) newDisc = maxDisc;
        newDisc = Math.min(newDisc, subtotal);
        setCouponDiscount(newDisc);
      }
    }
  }, [subtotal]);

  if (!isCartOpen) return null;

  // Apply Coupon
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    setCouponError('');

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.trim(),
          cartTotal: subtotal,
          orderSubtotal: subtotal
        })
      });

      const data = await res.json();
      if (res.ok && data.valid) {
        const disc = Number(data.discountAmount ?? data.discount ?? 0);
        setAppliedCoupon(data);
        setCouponDiscount(disc);
        setCouponError('');
      } else {
        setAppliedCoupon(null);
        setCouponDiscount(0);
        setCouponError(data.message || data.error || 'Invalid or expired promo code');
      }
    } catch (err) {
      setCouponError('Could not validate coupon. Please try again.');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      setIsCartOpen(false);
      navigate('/login');
      return;
    }
    if (cart.length === 0) return;

    // Guard: Prevent checkout if any cart item is out of stock
    const outOfStockItems = cart.filter(item => item.outOfStock || item.status === 'out_of_stock');
    if (outOfStockItems.length > 0) {
      alert(`The following item(s) are currently out of stock:\n${outOfStockItems.map(i => '• ' + i.name).join('\n')}\n\nPlease remove them from your cart to proceed with checkout.`);
      return;
    }

    setIsCheckingOut(true);

    // Resolve address
    let recipientName = customRecipient || user.name || 'Customer';
    let recipientPhone = customPhone || user.phone || '';
    let finalAddressStr = customAddress || user.address || 'Standard Delivery';

    if (selectedAddressId !== 'custom' && selectedAddressId !== 'profile') {
      const chosen = savedAddresses.find(a => a.id === selectedAddressId);
      if (chosen) {
        recipientName = chosen.recipient_name;
        recipientPhone = chosen.phone;
        finalAddressStr = `${chosen.house_number ? 'House #' + chosen.house_number + ', ' : ''}${chosen.street ? chosen.street + ', ' : ''}${chosen.area ? chosen.area + ', ' : ''}${chosen.city}${chosen.landmark ? ' (Near ' + chosen.landmark + ')' : ''}`;
      }
    }

    try {
      await placeOrder(user, cart, finalTotal, {
        name: recipientName,
        email: user.email,
        phone: recipientPhone,
        address: finalAddressStr,
        paymentMethod,
        subtotal,
        discountAmount: couponDiscount,
        shippingCharges: 0,
        couponCode: appliedCoupon?.code || appliedCoupon?.coupon?.code || couponCode.trim() || null
      });

      if (activeCartSessionId) {
        fetch(`/api/abandoned-carts/${activeCartSessionId}/recover`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Recovered' })
        }).catch(() => {});
      }

      clearCart();
      setIsCartOpen(false);
      navigate('/account');
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <>
      <div 
        className="cart-overlay-bg"
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999 }} 
        onClick={() => setIsCartOpen(false)}
      />
      <div className="cart-sidebar-container" style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '440px', maxWidth: '100%', backgroundColor: 'white', zIndex: 1000, display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 20px rgba(0,0,0,0.12)' }}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: '#0f172a' }}>Shopping Cart</h2>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{cart.length} unique item{cart.length !== 1 ? 's' : ''}</span>
          </div>
          <button onClick={() => setIsCartOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Scrollable Items & Details */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Cart Items List */}
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 10px', color: '#64748b' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🛒</div>
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: '600' }}>Your cart is empty.</p>
              <p style={{ fontSize: '0.825rem', color: '#94a3b8', marginTop: '4px' }}>Discover authentic gadgets and add them to your cart!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {cart.map(item => (
                <div key={item.id} style={{ display: 'flex', gap: '14px', alignItems: 'center', padding: '10px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                  <div style={{ width: '56px', height: '56px', backgroundColor: '#ffffff', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #e2e8f0' }}>
                    {item.image ? (
                      <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /></svg>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</h4>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.825rem', color: '#64748b', fontWeight: '600' }}>{item.price}</p>
                    {(item.outOfStock || item.status === 'out_of_stock') && (
                      <span style={{ fontSize: '0.7rem', backgroundColor: '#fee2e2', color: '#b91c1c', fontWeight: '700', padding: '1px 6px', borderRadius: '4px', border: '1px solid #fecaca', display: 'inline-block', marginTop: '2px' }}>
                        Out of Stock
                      </span>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#ffffff', opacity: (item.outOfStock || item.status === 'out_of_stock') ? 0.6 : 1 }}>
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ padding: '2px 8px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
                        <span style={{ fontSize: '0.8rem', padding: '0 6px', fontWeight: '700' }}>{item.quantity}</span>
                        <button disabled={item.outOfStock || item.status === 'out_of_stock'} onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ padding: '2px 8px', background: 'none', border: 'none', cursor: (item.outOfStock || item.status === 'out_of_stock') ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>+</button>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.75rem', cursor: 'pointer' }}>Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Checkout Extras (only if cart has items) */}
          {cart.length > 0 && (
            <>
              {/* Promo Coupon Box */}
              <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Have a Promo Code?
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="e.g. SAVE10"
                    disabled={appliedCoupon !== null}
                    style={{ flex: 1, padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.825rem', outline: 'none', textTransform: 'uppercase' }}
                  />
                  {appliedCoupon ? (
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedCoupon(null);
                        setCouponDiscount(0);
                        setCouponCode('');
                      }}
                      style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#b91c1c', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer' }}
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={validatingCoupon || !couponCode.trim()}
                      style={{ padding: '8px 14px', borderRadius: '6px', border: 'none', backgroundColor: '#0f172a', color: '#ffffff', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer' }}
                    >
                      {validatingCoupon ? 'Checking...' : 'Apply'}
                    </button>
                  )}
                </div>
                {couponError && (
                  <div style={{ color: '#b91c1c', fontSize: '0.75rem', marginTop: '6px' }}>
                    {couponError}
                  </div>
                )}
                {appliedCoupon && (
                  <div style={{ color: '#15803d', fontSize: '0.75rem', fontWeight: '700', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    ✓ Promo applied: - Rs. {couponDiscount.toLocaleString()}
                  </div>
                )}
              </div>

              {/* Delivery Address Selector */}
              {user && (
                <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Delivery Destination
                  </label>

                  {savedAddresses.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {savedAddresses.map(addr => (
                        <label
                          key={addr.id}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            backgroundColor: selectedAddressId === addr.id ? '#ffffff' : 'transparent',
                            border: selectedAddressId === addr.id ? '1px solid var(--orange, #ea580c)' : '1px solid #e2e8f0',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                        >
                          <input
                            type="radio"
                            name="addressSelection"
                            checked={selectedAddressId === addr.id}
                            onChange={() => setSelectedAddressId(addr.id)}
                            style={{ marginTop: '3px' }}
                          />
                          <div>
                            <span style={{ fontWeight: '700', color: '#0f172a' }}>{addr.label || 'Home'}</span> &bull; {addr.recipient_name} ({addr.city})
                            <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '2px' }}>
                              {addr.street}, {addr.area}
                            </div>
                          </div>
                        </label>
                      ))}

                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        <input
                          type="radio"
                          name="addressSelection"
                          checked={selectedAddressId === 'custom'}
                          onChange={() => setSelectedAddressId('custom')}
                        />
                        <span style={{ fontWeight: '600', color: '#475569' }}>Deliver to another address</span>
                      </label>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '6px' }}>
                      Enter your delivery address below:
                    </div>
                  )}

                  {(selectedAddressId === 'custom' || savedAddresses.length === 0) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                      <input
                        type="text"
                        placeholder="House / Street / Area"
                        value={customAddress}
                        onChange={e => setCustomAddress(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.825rem', boxSizing: 'border-box' }}
                      />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <input
                          type="text"
                          placeholder="City (e.g. Lahore)"
                          value={customCity}
                          onChange={e => setCustomCity(e.target.value)}
                          style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.825rem', boxSizing: 'border-box' }}
                        />
                        <input
                          type="tel"
                          placeholder="Phone / WhatsApp"
                          value={customPhone}
                          onChange={e => setCustomPhone(e.target.value)}
                          style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.825rem', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Payment Method Selector */}
              <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Payment Method
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {[
                    { key: 'Cash on Delivery', label: 'Cash on Delivery (COD)', hint: 'Pay cash when courier delivers parcel' },
                    { key: 'Bank Transfer', label: 'Direct Bank Transfer', hint: 'Transfer to official Meezan Bank account' },
                    { key: 'JazzCash / Easypaisa', label: 'JazzCash / Easypaisa', hint: 'Instant mobile wallet payment' }
                  ].map(m => (
                    <label
                      key={m.key}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        backgroundColor: paymentMethod === m.key ? '#ffffff' : 'transparent',
                        border: paymentMethod === m.key ? '1px solid var(--orange, #ea580c)' : '1px solid #e2e8f0',
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="radio"
                        name="paymentMethodSelection"
                        checked={paymentMethod === m.key}
                        onChange={() => setPaymentMethod(m.key)}
                        style={{ marginTop: '3px' }}
                      />
                      <div>
                        <div style={{ fontSize: '0.825rem', fontWeight: '700', color: '#0f172a' }}>{m.label}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{m.hint}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

        </div>

        {/* Footer Summary & Checkout Button */}
        <div style={{ padding: '20px 24px', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
              <span>Subtotal:</span>
              <span>Rs. {subtotal.toLocaleString()}</span>
            </div>
            {couponDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#15803d', fontWeight: '700' }}>
                <span>Discount:</span>
                <span>- Rs. {couponDiscount.toLocaleString()}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
              <span>Delivery Charges:</span>
              <span style={{ color: '#16a34a', fontWeight: '700' }}>FREE</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #e5e7eb', fontSize: '1.15rem', fontWeight: '900', color: '#0f172a' }}>
              <span>Total Payable:</span>
              <span style={{ color: 'var(--orange, #ea580c)' }}>Rs. {finalTotal.toLocaleString()}</span>
            </div>
          </div>

          {cart.some(item => item.outOfStock || item.status === 'out_of_stock') && (
            <div style={{ marginBottom: '10px', padding: '8px 12px', borderRadius: '6px', backgroundColor: '#fee2e2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '0.78rem', fontWeight: '600', textAlign: 'center' }}>
              Please remove out-of-stock items to proceed
            </div>
          )}

          <button 
            onClick={handleCheckout} 
            disabled={cart.length === 0 || isCheckingOut || cart.some(item => item.outOfStock || item.status === 'out_of_stock')}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: (cart.length === 0 || cart.some(item => item.outOfStock || item.status === 'out_of_stock')) ? '#9ca3af' : 'var(--orange, #ea580c)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: (cart.length === 0 || isCheckingOut || cart.some(item => item.outOfStock || item.status === 'out_of_stock')) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: cart.length > 0 && !cart.some(item => item.outOfStock || item.status === 'out_of_stock') ? '0 4px 12px rgba(234, 88, 12, 0.3)' : 'none'
            }}
          >
            {isCheckingOut ? 'Placing Order...' : (cart.some(item => item.outOfStock || item.status === 'out_of_stock') ? 'Out of Stock Items in Cart' : (user ? 'Confirm & Place Order' : 'Login to Checkout'))}
          </button>
        </div>

      </div>
    </>
  );
}
