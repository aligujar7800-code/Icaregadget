import React, { useState, useEffect } from 'react';

export default function CustomerAddressesTab({ user }) {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState({ text: '', type: '' });

  // Form State
  const [label, setLabel] = useState('Home');
  const [recipientName, setRecipientName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [city, setCity] = useState(user?.city || 'Lahore');
  const [area, setArea] = useState('');
  const [street, setStreet] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [landmark, setLandmark] = useState('');
  const [instructions, setInstructions] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const userId = user?.id || user?.email || '1';

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customer/addresses?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        setAddresses(data);
      } else {
        // Fallback to local default if table is initially empty
        if (user?.address) {
          setAddresses([{
            id: 'default-profile',
            user_id: userId,
            label: 'Home',
            recipient_name: user.name || 'Customer',
            phone: user.phone || '',
            city: user.city || 'Lahore',
            street: user.address || '',
            is_default: 1
          }]);
        }
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [user]);

  const openAddModal = () => {
    setEditingAddress(null);
    setLabel('Home');
    setRecipientName(user?.name || '');
    setPhone(user?.phone || '');
    setCity(user?.city || 'Lahore');
    setArea('');
    setStreet('');
    setHouseNumber('');
    setLandmark('');
    setInstructions('');
    setIsDefault(addresses.length === 0);
    setIsModalOpen(true);
  };

  const openEditModal = (addr) => {
    setEditingAddress(addr);
    setLabel(addr.label || 'Home');
    setRecipientName(addr.recipient_name || '');
    setPhone(addr.phone || '');
    setCity(addr.city || 'Lahore');
    setArea(addr.area || '');
    setStreet(addr.street || '');
    setHouseNumber(addr.house_number || '');
    setLandmark(addr.landmark || '');
    setInstructions(addr.instructions || '');
    setIsDefault(Boolean(addr.is_default));
    setIsModalOpen(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedbackMsg({ text: '', type: '' });

    const payload = {
      userId,
      label,
      recipientName,
      phone,
      city,
      area,
      street,
      houseNumber,
      landmark,
      instructions,
      isDefault
    };

    try {
      if (editingAddress && editingAddress.id !== 'default-profile') {
        const res = await fetch(`/api/customer/addresses/${editingAddress.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          setFeedbackMsg({ text: 'Address updated successfully!', type: 'success' });
          setIsModalOpen(false);
          fetchAddresses();
        } else {
          const err = await res.json();
          setFeedbackMsg({ text: err.error || 'Failed to update address', type: 'error' });
        }
      } else {
        const res = await fetch('/api/customer/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          setFeedbackMsg({ text: 'New delivery address saved!', type: 'success' });
          setIsModalOpen(false);
          fetchAddresses();
        } else {
          const err = await res.json();
          setFeedbackMsg({ text: err.error || 'Failed to save address', type: 'error' });
        }
      }
    } catch (err) {
      setFeedbackMsg({ text: 'Network error saving address.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Are you sure you want to delete this delivery address?')) return;
    try {
      const res = await fetch(`/api/customer/addresses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAddresses(prev => prev.filter(a => a.id !== id));
        setFeedbackMsg({ text: 'Address removed successfully.', type: 'success' });
      }
    } catch (err) {
      console.error('Delete address error:', err);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      const res = await fetch(`/api/customer/addresses/${id}/default`, { method: 'PUT' });
      if (res.ok) {
        fetchAddresses();
        setFeedbackMsg({ text: 'Default address updated.', type: 'success' });
      }
    } catch (err) {
      console.error('Set default error:', err);
    }
  };

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '10px',
      padding: '18px 20px',
      border: '1px solid #e2e8f0',
      boxShadow: 'none'
    }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
            Saved Delivery Addresses
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '4px 0 0 0' }}>
            Manage delivery destinations for fast, one-click checkout
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          style={{
            backgroundColor: 'var(--orange, #ea580c)',
            color: '#ffffff',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>+</span> Add New Address
        </button>
      </div>

      {feedbackMsg.text && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '0.875rem',
          marginBottom: '20px',
          backgroundColor: feedbackMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
          color: feedbackMsg.type === 'success' ? '#15803d' : '#b91c1c',
          border: `1px solid ${feedbackMsg.type === 'success' ? '#bbf7d0' : '#fecaca'}`
        }}>
          {feedbackMsg.text}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          Loading saved addresses...
        </div>
      ) : addresses.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '50px 20px',
          backgroundColor: '#f8fafc',
          borderRadius: '12px',
          border: '1px dashed #cbd5e1'
        }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: '#64748b' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1e293b', marginBottom: '6px' }}>No Saved Addresses</h3>
          <p style={{ color: '#64748b', fontSize: '0.875rem', maxWidth: '340px', margin: '0 auto 16px' }}>
            Add your home or office address to enable instant address autofill at checkout.
          </p>
          <button
            type="button"
            onClick={openAddModal}
            className="btn btn--primary"
            style={{ padding: '8px 20px', fontSize: '0.875rem' }}
          >
            Add Address Now
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {addresses.map(addr => {
            const isDef = Boolean(addr.is_default);
            return (
              <div
                key={addr.id}
                style={{
                  border: isDef ? '2px solid var(--orange, #ea580c)' : '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '20px',
                  backgroundColor: isDef ? '#fffdfb' : '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  position: 'relative'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{
                      backgroundColor: addr.label === 'Office' ? '#e0f2fe' : '#f1f5f9',
                      color: addr.label === 'Office' ? '#0369a1' : '#334155',
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      textTransform: 'uppercase'
                    }}>
                      {addr.label || 'Home'}
                    </span>
                    {isDef && (
                      <span style={{
                        backgroundColor: '#dcfce7',
                        color: '#15803d',
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        padding: '2px 8px',
                        borderRadius: '99px'
                      }}>
                        ✓ Default Delivery
                      </span>
                    )}
                  </div>

                  <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: '700', color: '#0f172a' }}>
                    {addr.recipient_name}
                  </h4>
                  <p style={{ margin: '0 0 10px 0', color: '#64748b', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                    {addr.phone}
                  </p>

                  <div style={{ color: '#334155', fontSize: '0.875rem', lineHeight: '1.5', marginBottom: '12px' }}>
                    {addr.house_number && <span>House #{addr.house_number}, </span>}
                    {addr.street && <span>{addr.street}, </span>}
                    {addr.area && <span>{addr.area}, </span>}
                    <strong>{addr.city}</strong>
                    {addr.landmark && (
                      <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        Near {addr.landmark}
                      </div>
                    )}
                    {addr.instructions && (
                      <div style={{ color: '#854d0e', backgroundColor: '#fefce8', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                        Note: {addr.instructions}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginTop: '10px' }}>
                  {!isDef ? (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(addr.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--orange, #ea580c)',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      Make Default
                    </button>
                  ) : <span />}

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => openEditModal(addr)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        fontSize: '0.78rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAddress(addr.id)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: '1px solid #fecaca',
                        backgroundColor: '#fff5f5',
                        color: '#b91c1c',
                        fontSize: '0.78rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div
          onClick={() => setIsModalOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 9999
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                {editingAddress ? 'Edit Delivery Address' : 'Add New Delivery Address'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAddress} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Address Label Pills */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>Address Tag</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['Home', 'Office', 'Other'].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setLabel(tag)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '6px',
                        border: label === tag ? '2px solid var(--orange, #ea580c)' : '1px solid #cbd5e1',
                        backgroundColor: label === tag ? '#fff7ed' : '#ffffff',
                        color: label === tag ? 'var(--orange, #ea580c)' : '#475569',
                        fontWeight: '700',
                        fontSize: '0.825rem',
                        cursor: 'pointer'
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Recipient Name *</label>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={e => setRecipientName(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+92 300 1234567"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>City *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="e.g. Lahore, Karachi, Faisalabad"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Area / Town / Sector</label>
                  <input
                    type="text"
                    value={area}
                    onChange={e => setArea(e.target.value)}
                    placeholder="e.g. DHA Phase 5, Gulberg"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Street / House Number *</label>
                <input
                  type="text"
                  required
                  value={street}
                  onChange={e => setStreet(e.target.value)}
                  placeholder="House / Flat #, Street #, Road"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Nearby Landmark (Optional)</label>
                <input
                  type="text"
                  value={landmark}
                  onChange={e => setLandmark(e.target.value)}
                  placeholder="e.g. Opposite City Hospital, Near Water Tank"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Courier Delivery Instructions</label>
                <textarea
                  rows={2}
                  value={instructions}
                  onChange={e => setInstructions(e.target.value)}
                  placeholder="e.g. Call before coming, leave at reception"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="chk-def"
                  checked={isDefault}
                  onChange={e => setIsDefault(e.target.checked)}
                />
                <label htmlFor="chk-def" style={{ fontSize: '0.85rem', color: '#334155', cursor: 'pointer' }}>
                  Set as my default delivery address
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '9px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '9px 20px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: 'var(--orange, #ea580c)',
                    color: '#ffffff',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  {submitting ? 'Saving...' : 'Save Address'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
