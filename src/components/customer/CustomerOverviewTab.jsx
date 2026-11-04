import React from 'react';
import { Link } from 'react-router-dom';
import { getCourierBrandStyle, getCourierTrackingUrl } from '../../utils/courier';

export default function CustomerOverviewTab({ 
  user, 
  orders, 
  setActiveTab, 
  setSelectedOrderDetails, 
  setIsCartOpen,
  cart 
}) {
  const parseAmount = (priceStr) => {
    if (!priceStr) return 0;
    const num = parseInt(String(priceStr).replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 0 : num;
  };

  const totalSpent = orders.reduce((sum, o) => sum + parseAmount(o.price), 0);
  const pendingOrders = orders.filter(o => {
    const s = (o.status || 'pending').toLowerCase();
    return s === 'pending' || s === 'processing' || s === 'shipped';
  });
  const deliveredOrders = orders.filter(o => (o.status || '').toLowerCase() === 'delivered');

  // Active shipment (if any)
  const activeShipment = orders.find(o => {
    const s = (o.status || '').toLowerCase();
    return s === 'shipped' || s === 'processing';
  });

  const recentOrders = orders.slice(0, 4);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      
      {/* Active Shipment Banner */}
      {activeShipment && (
        <div style={{
          backgroundColor: '#0f172a',
          color: '#ffffff',
          borderRadius: '10px',
          padding: '16px 20px',
          boxShadow: '0 4px 12px -2px rgba(15, 23, 42, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0, color: '#ffffff' }}>
                    Active Order #{activeShipment.id} is on the way!
                  </h3>
                  <span style={{
                    backgroundColor: 'var(--orange, #ea580c)',
                    color: '#ffffff',
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '99px',
                    textTransform: 'uppercase'
                  }}>
                    {activeShipment.status || 'In Transit'}
                  </span>
                </div>
                <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
                  {activeShipment.courier ? `Courier: ${activeShipment.courier}` : 'Dispatched via trusted partner'} 
                  {activeShipment.trackingNumber && ` • Tracking: ${activeShipment.trackingNumber}`}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {activeShipment.trackingNumber && getCourierTrackingUrl(activeShipment.courier, activeShipment.trackingNumber) && (
                <a
                  href={getCourierTrackingUrl(activeShipment.courier, activeShipment.trackingNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '0.825rem',
                    fontWeight: '700',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  Live Track ↗
                </a>
              )}
              <button
                type="button"
                onClick={() => setSelectedOrderDetails(activeShipment)}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.2)',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '0.825rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                View Details
              </button>
            </div>
          </div>

          {/* Mini progress tracker */}
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.06)',
            padding: '12px 16px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontSize: '0.825rem', fontWeight: '600' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              1. Placed
            </div>
            <div style={{ flex: 1, height: '2px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontSize: '0.825rem', fontWeight: '600' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              2. Confirmed
            </div>
            <div style={{ flex: 1, height: '2px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--orange, #f97316)', fontSize: '0.825rem', fontWeight: '700' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--orange, #f97316)', animation: 'pulse 1.5s infinite' }} />
              3. In Transit
            </div>
            <div style={{ flex: 1, height: '2px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.825rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#64748b' }} />
              4. Delivered
            </div>
          </div>
        </div>
      )}

      {/* Recent Orders Preview */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        padding: '16px 18px',
        border: '1px solid #e2e8f0',
        boxShadow: 'none'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
              Recent Orders
            </h3>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Latest purchases placed on your account</span>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--orange, #ea580c)',
              fontWeight: '700',
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            View All ({orders.length}) &rarr;
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b', fontSize: '0.9rem' }}>
            No recent orders. Explore our genuine gadgets and authentic accessories!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentOrders.map(order => (
              <div
                key={order.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: '700', fontSize: '0.95rem', color: '#0f172a' }}>#{order.id}</span>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      padding: '2px 7px',
                      borderRadius: '4px',
                      backgroundColor: (order.status || '').toLowerCase() === 'delivered' ? '#dcfce7' : '#fef3c7',
                      color: (order.status || '').toLowerCase() === 'delivered' ? '#15803d' : '#b45309'
                    }}>
                      {order.status || 'Pending'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.825rem', color: '#64748b', marginTop: '2px' }}>
                    {order.productName || 'Order Items'} &bull; {order.date || 'Recent'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span style={{ fontWeight: '800', fontSize: '1rem', color: '#0f172a' }}>{order.price}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedOrderDetails(order)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: '#0f172a',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
