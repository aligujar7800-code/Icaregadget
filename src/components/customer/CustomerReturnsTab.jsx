import React, { useState, useEffect } from 'react';

export default function CustomerReturnsTab({ user, orders }) {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState({ text: '', type: '' });

  // Only delivered orders are eligible for return or warranty claims
  const eligibleOrders = orders.filter(o => (o.status || '').toLowerCase() === 'delivered');

  // Modal Form State
  const [selectedOrderId, setSelectedOrderId] = useState(eligibleOrders[0]?.id || '');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [reason, setReason] = useState('Defective or not working');
  const [customerNotes, setCustomerNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const userEmail = (user?.email || '').toLowerCase().trim();
  const userName = (user?.name || '').toLowerCase().trim();

  const formatOrderLabel = (o) => {
    let itemsList = [];
    if (Array.isArray(o.items)) {
      itemsList = o.items;
    } else if (typeof o.items === 'string') {
      try { itemsList = JSON.parse(o.items || '[]'); } catch(e){}
    }

    let summary = '';
    if (itemsList.length > 1) {
      summary = `${itemsList[0]?.name || 'Item'} +${itemsList.length - 1} more (${itemsList.length} items)`;
    } else if (itemsList.length === 1) {
      summary = `${itemsList[0].quantity || 1}x ${itemsList[0].name}`;
    } else if (o.productName) {
      const parts = o.productName.split(',');
      if (parts.length > 1) {
        summary = `${parts[0].trim()} +${parts.length - 1} more`;
      } else {
        summary = parts[0].trim();
      }
    } else {
      summary = 'Gadget Purchase';
    }

    if (summary.length > 35) {
      summary = summary.substring(0, 32) + '...';
    }

    return `Order #${o.id} • ${summary} • ${o.price || ''}`;
  };

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/returns');
      if (res.ok) {
        const data = await res.json();
        // Filter to this customer's returns
        const curEmail = (user?.email || '').toLowerCase().trim();
        const curName = (user?.name || '').toLowerCase().trim();
        const mine = (Array.isArray(data) ? data : []).filter(r => {
          const rEmail = (r.user_email || r.customer_email || '').toLowerCase().trim();
          const rName = (r.user_name || r.customer_name || '').toLowerCase().trim();
          return (curEmail && rEmail === curEmail) || (curName && rName === curName);
        });
        setReturns(mine);
      }
    } catch (err) {
      console.error('Fetch returns error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, [user]);

  const getStatusBadge = (st = 'Requested') => {
    switch (st.toLowerCase()) {
      case 'approved':
      case 'refunded':
      case 'received':
        return { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' };
      case 'return in transit':
        return { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' };
      case 'rejected':
        return { bg: '#fee2e2', text: '#b91c1c', border: '#fecaca' };
      default:
        return { bg: '#fef3c7', text: '#b45309', border: '#fde68a' };
    }
  };

  const handleCreateReturn = async (e) => {
    e.preventDefault();
    if (!selectedOrderId) {
      setFeedbackMsg({ text: 'Please select an order to return.', type: 'error' });
      return;
    }
    setSubmitting(true);
    setFeedbackMsg({ text: '', type: '' });

    const orderObj = orders.find(o => String(o.id) === String(selectedOrderId));
    const itemsData = selectedProduct && selectedProduct !== 'all' 
      ? [{ name: selectedProduct, quantity: 1 }] 
      : (orderObj?.items || [{ name: orderObj?.productName || 'Gadget Item', quantity: 1 }]);

    const customerDisplayName = (user?.name || orderObj?.userName || 'Customer').trim();
    const customerDisplayEmail = (user?.email || orderObj?.userEmail || '').trim();
    const customerDisplayPhone = (user?.phone || orderObj?.phone || '').trim();
    const productDetailStr = selectedProduct && selectedProduct !== 'all'
      ? selectedProduct
      : (orderObj?.productName || 'All Items in Order');

    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrderId,
          userId: user?.id || orderObj?.userId || null,
          userName: customerDisplayName,
          customerName: customerDisplayName,
          userEmail: customerDisplayEmail,
          customerEmail: customerDisplayEmail,
          userPhone: customerDisplayPhone,
          customerPhone: customerDisplayPhone,
          productDetails: productDetailStr,
          items: itemsData,
          reason,
          explanation: customerNotes,
          customerNotes
        })
      });

      if (res.ok) {
        setFeedbackMsg({ text: 'Return request submitted successfully. Our team will review within 24 hours.', type: 'success' });
        setIsModalOpen(false);
        setCustomerNotes('');
        setSelectedProduct('');
        fetchReturns();
      } else {
        const err = await res.json();
        setFeedbackMsg({ text: err.error || err.message || 'Failed to submit return request', type: 'error' });
      }
    } catch (err) {
      setFeedbackMsg({ text: 'Network error submitting return request.', type: 'error' });
    } finally {
      setSubmitting(false);
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
            Returns & Warranty Claims
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '4px 0 0 0' }}>
            Request replacement, repair, or refund for eligible purchases
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (eligibleOrders.length === 0) {
              alert('Only delivered orders can be submitted for return or warranty claims. If your order is currently pending or in transit, please wait until delivery or contact support.');
              return;
            }
            setSelectedOrderId(eligibleOrders[0]?.id || '');
            setSelectedProduct('');
            setIsModalOpen(true);
          }}
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
          <span>+</span> Request Return / Exchange
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
          Checking warranty and return records...
        </div>
      ) : returns.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '50px 20px',
          backgroundColor: '#f8fafc',
          borderRadius: '12px',
          border: '1px dashed #cbd5e1'
        }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: '#64748b' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1e293b', marginBottom: '6px' }}>No Active Returns</h3>
          <p style={{ color: '#64748b', fontSize: '0.875rem', maxWidth: '420px', margin: '0 auto 16px' }}>
            {eligibleOrders.length > 0
              ? 'All your delivered gadgets are verified and working. If you ever receive a damaged or incorrect item, you can submit a return claim here.'
              : 'You have no delivered orders yet. Return and warranty replacement claims become available once your parcel has been successfully delivered.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {returns.map(ret => {
            const badge = getStatusBadge(ret.status);
            return (
              <div
                key={ret.id}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '18px 20px',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '800', fontSize: '1rem', color: '#0f172a' }}>
                        Return Claim #{ret.id}
                      </span>
                      <span style={{
                        backgroundColor: badge.bg,
                        color: badge.text,
                        border: `1px solid ${badge.border}`,
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        padding: '2px 8px',
                        borderRadius: '6px'
                      }}>
                        {ret.status || 'Requested'}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.825rem', color: '#64748b', marginTop: '2px', display: 'inline-block' }}>
                      Associated with Order #{ret.order_id} &bull; Submitted {new Date(ret.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {ret.refund_amount > 0 && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#15803d' }}>
                        Rs. {Number(ret.refund_amount).toLocaleString()}
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Refund Amount</span>
                    </div>
                  )}
                </div>

                <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', color: '#334155', marginBottom: '8px' }}>
                  <div><strong>Reason:</strong> {ret.reason}</div>
                  {ret.product_details && <div style={{ marginTop: '3px' }}><strong>Item / Product:</strong> {ret.product_details}</div>}
                  {(ret.explanation || ret.customer_notes) && (
                    <div style={{ marginTop: '4px' }}><strong>Explanation:</strong> {ret.explanation || ret.customer_notes}</div>
                  )}
                  {ret.admin_notes && (
                    <div style={{ marginTop: '6px', color: '#1e40af', backgroundColor: '#eff6ff', padding: '6px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                      <strong>Store Response:</strong> {ret.admin_notes}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Return Request Modal */}
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
                Submit Return or Warranty Request
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateReturn} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Select Order *</label>
                <select
                  required
                  value={selectedOrderId}
                  onChange={e => {
                    setSelectedOrderId(e.target.value);
                    setSelectedProduct('');
                  }}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem', backgroundColor: '#ffffff' }}
                >
                  {eligibleOrders.map(o => (
                    <option key={o.id} value={o.id}>
                      {formatOrderLabel(o)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Item to Return / Claim *</label>
                {(() => {
                  const currOrder = eligibleOrders.find(o => String(o.id) === String(selectedOrderId)) || eligibleOrders[0];
                  let itemsList = [];
                  if (Array.isArray(currOrder?.items)) {
                    itemsList = currOrder.items;
                  } else if (typeof currOrder?.items === 'string') {
                    try { itemsList = JSON.parse(currOrder.items || '[]'); } catch(e){}
                  }

                  if (itemsList.length > 0) {
                    return (
                      <select
                        value={selectedProduct}
                        onChange={e => setSelectedProduct(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem', backgroundColor: '#ffffff' }}
                      >
                        <option value="">Entire Order ({itemsList.length} item{itemsList.length > 1 ? 's' : ''})</option>
                        {itemsList.map((it, idx) => (
                          <option key={idx} value={`${it.quantity || 1}x ${it.name}`}>
                            {it.quantity || 1}x {it.name}
                          </option>
                        ))}
                      </select>
                    );
                  }

                  return (
                    <input
                      type="text"
                      value={selectedProduct}
                      onChange={e => setSelectedProduct(e.target.value)}
                      placeholder="e.g. Entire Order or specific gadget"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem', boxSizing: 'border-box' }}
                    />
                  );
                })()}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Reason for Return *</label>
                <select
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem', backgroundColor: '#ffffff' }}
                >
                  <option value="Defective or not working">Defective or not working</option>
                  <option value="Received wrong item or color">Received wrong item or color</option>
                  <option value="Item damaged during transit">Item damaged during transit</option>
                  <option value="Item does not match description">Item does not match description</option>
                  <option value="Changed mind / No longer needed">Changed mind / No longer needed</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Detailed Explanation *</label>
                <textarea
                  required
                  rows={3}
                  value={customerNotes}
                  onChange={e => setCustomerNotes(e.target.value)}
                  placeholder="Please describe the issue in detail so our support staff can expedite your resolution..."
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
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
                  {submitting ? 'Submitting...' : 'Submit Claim'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
