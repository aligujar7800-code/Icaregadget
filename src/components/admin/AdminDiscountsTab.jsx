import React, { useState, useEffect } from 'react';

export default function AdminDiscountsTab() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [code, setCode] = useState('');
  const [type, setType] = useState('percentage');
  const [value, setValue] = useState('');
  const [minOrder, setMinOrder] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/coupons');
      if (res.ok) {
        const data = await res.json();
        setCoupons(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async (e) => {
    if (e) e.preventDefault();
    if (!code || !value) return alert('Code and Discount Value are required');
    try {
      setIsSubmitting(true);
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          type,
          value: parseFloat(value),
          minOrderValue: parseFloat(minOrder) || 0,
          maxDiscount: parseFloat(maxDiscount) || 0,
          expiryDate: expiryDate || null,
          usageLimit: parseInt(usageLimit, 10) || 0,
          category
        })
      });

      if (res.ok) {
        setShowAddModal(false);
        setCode('');
        setValue('');
        setMinOrder('');
        setMaxDiscount('');
        setExpiryDate('');
        setUsageLimit('');
        fetchCoupons();
      }
    } catch (err) {
      console.error('Error creating coupon:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      const res = await fetch(`/api/coupons/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus })
      });
      if (res.ok) {
        setCoupons(prev => prev.map(c => c.id === id ? { ...c, is_active: !currentStatus } : c));
      }
    } catch (err) {
      console.error('Error toggling coupon:', err);
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      const res = await fetch(`/api/coupons/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCoupons(prev => prev.filter(c => c.id !== id));
      }
    } catch (err) {
      console.error('Error deleting coupon:', err);
    }
  };

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '16px', border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: '#111827' }}>Discounts & Coupons Management</h2>
          <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#6b7280' }}>Manage promo vouchers, seasonal sales, cart minimums, and customer checkout discounts</p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            style={{ padding: '6px 14px', borderRadius: '6px', backgroundColor: '#ea580c', color: '#ffffff', border: 'none', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
          >
            + Create New Coupon
          </button>
          <button
            type="button"
            onClick={fetchCoupons}
            style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#111827', color: '#ffffff', border: 'none', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '30px 0', textAlign: 'center', color: '#6b7280', fontSize: '12px' }}>Loading coupons...</div>
      ) : coupons.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: '#6b7280', fontSize: '12px' }}>
          No promotional coupons created yet. Click "+ Create New Coupon" to set up your first voucher.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '11.5px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Coupon Code</th>
                <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Discount</th>
                <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Conditions</th>
                <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Expiry Date</th>
                <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Usage</th>
                <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map(c => {
                const isActive = Boolean(c.is_active);
                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{ fontWeight: '800', color: '#111827', letterSpacing: '0.5px', backgroundColor: '#f1f5f9', padding: '3px 8px', borderRadius: '4px', border: '1px dashed #cbd5e1' }}>
                        {c.code}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px', fontWeight: '700', color: '#ea580c' }}>
                      {c.type === 'percentage' ? `${c.value}% OFF` : `Rs. ${c.value} OFF`}
                    </td>
                    <td style={{ padding: '8px 10px', color: '#4b5563' }}>
                      <div>Min Order: {Number(c.min_order_value) > 0 ? `Rs. ${c.min_order_value}` : 'None'}</div>
                      {Number(c.max_discount) > 0 && <div style={{ fontSize: '10.5px', color: '#64748b' }}>Cap: Rs. {c.max_discount}</div>}
                    </td>
                    <td style={{ padding: '8px 10px', color: '#64748b' }}>
                      {c.expiry_date ? new Date(c.expiry_date).toLocaleDateString() : 'No Expiry'}
                    </td>
                    <td style={{ padding: '8px 10px', color: '#374151' }}>
                      {c.times_used || 0} {c.usage_limit > 0 ? `/ ${c.usage_limit}` : 'times'}
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '10.5px',
                        fontWeight: 600,
                        backgroundColor: isActive ? '#dcfce7' : '#fee2e2',
                        color: isActive ? '#15803d' : '#b91c1c'
                      }}>
                        {isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(c.id, isActive)}
                          style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#334155', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          {isActive ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCoupon(c.id)}
                          style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', backgroundColor: '#fee2e2', color: '#dc2626', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Coupon Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '460px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: '#111827' }}>Create Discount Coupon</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#9ca3af' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Coupon Code</label>
                <input
                  type="text"
                  placeholder="e.g. WELCOME10 or EID2026"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none', boxSizing: 'border-box', fontWeight: 'bold' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Discount Type</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none' }}
                  >
                    <option value="percentage">Percentage (% OFF)</option>
                    <option value="fixed">Fixed PKR (Rs. OFF)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Value ({type === 'percentage' ? '%' : 'PKR'})</label>
                  <input
                    type="number"
                    placeholder={type === 'percentage' ? '15' : '500'}
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Min Order (Rs.)</label>
                  <input
                    type="number"
                    placeholder="e.g. 2000"
                    value={minOrder}
                    onChange={e => setMinOrder(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Max Cap (Rs.)</label>
                  <input
                    type="number"
                    placeholder="e.g. 1000"
                    value={maxDiscount}
                    onChange={e => setMaxDiscount(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Expiry Date</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={e => setExpiryDate(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Total Usage Limit</label>
                  <input
                    type="number"
                    placeholder="0 = Unlimited"
                    value={usageLimit}
                    onChange={e => setUsageLimit(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', backgroundColor: '#ea580c', color: '#ffffff', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
                >
                  {isSubmitting ? 'Creating...' : 'Create Coupon'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
