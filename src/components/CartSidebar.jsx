import React from 'react';
import { useStore } from '../context/StoreContext';
import { useNavigate } from 'react-router-dom';

export default function CartSidebar() {
  const { cart, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart, clearCart, placeOrder, user } = useStore();
  const navigate = useNavigate();

  if (!isCartOpen) return null;

  const parsePrice = (priceStr) => parseInt(priceStr.replace(/[^0-9]/g, ''), 10) || 0;
  const total = cart.reduce((acc, item) => acc + (parsePrice(item.price) * item.quantity), 0);

  const handleCheckout = () => {
    if (!user) {
      setIsCartOpen(false);
      navigate('/login');
      return;
    }
    if (cart.length === 0) return;
    
    placeOrder(user, cart, total);
    clearCart();
    alert('Order placed successfully! Check your account or the admin dashboard.');
    setIsCartOpen(false);
  };

  return (
    <>
      <div 
        className="cart-overlay-bg"
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999 }} 
        onClick={() => setIsCartOpen(false)}
      ></div>
      <div className="cart-sidebar-container" style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '400px', maxWidth: '100%', backgroundColor: 'white', zIndex: 1000, display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 15px rgba(0,0,0,0.1)' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Shopping Cart</h2>
          <button onClick={() => setIsCartOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {cart.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#6b7280', marginTop: '40px' }}>Your cart is empty.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {cart.map(item => (
                <div key={item.id} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ width: '64px', height: '64px', backgroundColor: '#f3f4f6', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.image ? (
                      <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: '600' }}>{item.name}</h4>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>{item.price}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: '4px' }}>
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ padding: '4px 8px', background: 'none', border: 'none', cursor: 'pointer' }}>-</button>
                        <span style={{ fontSize: '0.875rem', padding: '0 8px' }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ padding: '4px 8px', background: 'none', border: 'none', cursor: 'pointer' }}>+</button>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.875rem', cursor: 'pointer', textDecoration: 'underline' }}>Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: '24px', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '1.125rem', fontWeight: 'bold' }}>
            <span>Total</span>
            <span>Rs. {total.toLocaleString()}</span>
          </div>
          <button 
            onClick={handleCheckout} 
            disabled={cart.length === 0}
            style={{ width: '100%', padding: '14px', backgroundColor: cart.length === 0 ? '#d1d5db' : 'var(--orange)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: cart.length === 0 ? 'not-allowed' : 'pointer' }}
          >
            Checkout Securely
          </button>
        </div>
      </div>
    </>
  );
}
