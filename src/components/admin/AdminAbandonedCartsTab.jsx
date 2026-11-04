import React, { useState, useEffect } from 'react';

export default function AdminAbandonedCartsTab() {
  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCarts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/abandoned-carts');
      if (res.ok) {
        const data = await res.json();
        setCarts(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching abandoned carts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarts();
  }, []);

  const handleMarkRecovered = async (cartId) => {
    try {
      const res = await fetch(`/api/abandoned-carts/${cartId}/recover`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Recovered' })
      });
      if (res.ok) {
        setCarts(prev => prev.map(c => c.id === cartId ? { ...c, recovery_status: 'Recovered' } : c));
      }
    } catch (err) {
      console.error('Error updating cart:', err);
    }
  };

  const copyRecoveryLink = (token) => {
    const url = `${window.location.origin}/?recovery=${token}`;
    navigator.clipboard.writeText(url);
    alert(`Copied Recovery Link:\n${url}`);
  };

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '16px', border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: '#111827' }}>Abandoned Carts Recovery</h2>
          <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#6b7280' }}>Recover dropped checkouts, send direct WhatsApp links, and recover lost revenue</p>
        </div>
        <button
          type="button"
          onClick={fetchCarts}
          style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#111827', color: '#ffffff', border: 'none', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '30px 0', textAlign: 'center', color: '#6b7280', fontSize: '12px' }}>Loading cart sessions...</div>
      ) : carts.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: '#6b7280', fontSize: '12px' }}>
          No abandoned carts recorded currently. Active checkouts are converting normally.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '11.5px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Shopper</th>
                <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Cart Items</th>
                <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Cart Value</th>
                <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Last Active</th>
                <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {carts.map(c => {
                const isRecovered = c.recovery_status === 'Recovered';
                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 10px' }}>
                      <div style={{ fontWeight: '600', color: '#111827' }}>{c.customer_name || 'Guest Shopper'}</div>
                      <div style={{ color: '#64748b', fontSize: '10.5px' }}>{c.customer_phone || c.customer_email || 'No contact provided'}</div>
                    </td>
                    <td style={{ padding: '8px 10px', maxWidth: '240px' }}>
                      {Array.isArray(c.items) && c.items.length > 0 ? (
                        <div style={{ color: '#374151' }}>
                          {c.items.map((it, idx) => (
                            <span key={idx}>{it.name || it.title} (x{it.quantity || 1}){idx < c.items.length - 1 ? ', ' : ''}</span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#64748b' }}>Item details saved</span>
                      )}
                    </td>
                    <td style={{ padding: '8px 10px', fontWeight: '700', color: '#111827' }}>
                      Rs. {Number(c.cart_value || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '8px 10px', color: '#64748b' }}>
                      {c.last_activity ? new Date(c.last_activity).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '10.5px',
                        fontWeight: 600,
                        backgroundColor: isRecovered ? '#dcfce7' : '#fef2f2',
                        color: isRecovered ? '#15803d' : '#b91c1c'
                      }}>
                        {c.recovery_status || 'Abandoned'}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => copyRecoveryLink(c.recovery_token || c.id)}
                          style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#334155', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Copy Link
                        </button>
                        {c.customer_phone && (
                          <a
                            href={`https://wa.me/${c.customer_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${c.customer_name || 'there'}, we noticed you left items in your I Care Gadget cart! Complete your order here: ${window.location.origin}/?recovery=${c.recovery_token}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', backgroundColor: '#22c55e', color: '#ffffff', fontSize: '11px', fontWeight: 600, textDecoration: 'none' }}
                          >
                            WhatsApp
                          </a>
                        )}
                        {!isRecovered && (
                          <button
                            type="button"
                            onClick={() => handleMarkRecovered(c.id)}
                            style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #16a34a', backgroundColor: '#f0fdf4', color: '#16a34a', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                          >
                            Mark Recovered
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
