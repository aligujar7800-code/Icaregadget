import React, { useState, useEffect } from 'react';

export default function AdminReturnsTab() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/returns');
      if (res.ok) {
        const data = await res.json();
        setReturns(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching returns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const openActionModal = (ret) => {
    setSelectedReturn(ret);
    setNewStatus(ret.status || 'Requested');
    setRefundAmount(ret.refund_amount || '0');
    setAdminNotes(ret.admin_notes || '');
  };

  const handleUpdateReturn = async (e) => {
    if (e) e.preventDefault();
    if (!selectedReturn) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/returns/${selectedReturn.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          refundAmount: parseFloat(refundAmount) || 0,
          adminNotes
        })
      });
      if (res.ok) {
        setReturns(prev => prev.map(r => r.id === selectedReturn.id ? { ...r, status: newStatus, refund_amount: refundAmount, admin_notes: adminNotes } : r));
        setSelectedReturn(null);
      }
    } catch (err) {
      console.error('Error updating return status:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'Requested':
        return { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' };
      case 'Approved':
        return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
      case 'Return in Transit':
        return { bg: '#fefce8', color: '#854d0e', border: '#fef08a' };
      case 'Received':
        return { bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe' };
      case 'Refund Pending':
        return { bg: '#fff1f2', color: '#be123c', border: '#fecdd3' };
      case 'Refunded':
        return { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' };
      case 'Rejected':
        return { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' };
      default:
        return { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' };
    }
  };

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '16px', border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: '#111827' }}>Returns & Refunds Management</h2>
          <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#6b7280' }}>Inspect return claims, approve warranty claims, and process customer refunds</p>
        </div>
        <button
          type="button"
          onClick={fetchReturns}
          style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#111827', color: '#ffffff', border: 'none', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '30px 0', textAlign: 'center', color: '#6b7280', fontSize: '12px' }}>Loading return requests...</div>
      ) : returns.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: '#6b7280', fontSize: '12px' }}>
          No return or refund requests currently active.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '11.5px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Return ID / Order</th>
                <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Customer</th>
                <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Reason & Item</th>
                <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Refund (PKR)</th>
                <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {returns.map(ret => {
                const b = getStatusBadge(ret.status);
                return (
                  <tr key={ret.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 10px' }}>
                      <div style={{ fontWeight: '700', color: '#111827' }}>RET-#{ret.id}</div>
                      <div style={{ color: '#64748b', fontSize: '10.5px' }}>Order #{String(ret.order_id).slice(-6)}</div>
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <div style={{ fontWeight: '600', color: '#111827' }}>{ret.user_name}</div>
                      <div style={{ color: '#64748b', fontSize: '10.5px' }}>{ret.user_phone || ret.user_email}</div>
                    </td>
                    <td style={{ padding: '8px 10px', maxWidth: '240px' }}>
                      <div style={{ fontWeight: '600', color: '#b91c1c' }}>{ret.reason}</div>
                      <div style={{ color: '#4b5563', fontSize: '10.5px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{ret.product_details}</div>
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 600, backgroundColor: b.bg, color: b.color, border: `1px solid ${b.border}` }}>
                        {ret.status}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px', fontWeight: '700', color: '#111827' }}>
                      {Number(ret.refund_amount) > 0 ? `Rs. ${Number(ret.refund_amount).toLocaleString()}` : '—'}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => openActionModal(ret)}
                        style={{ padding: '4px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#334155', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Review & Action
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Review & Status Transition Modal */}
      {selectedReturn && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '520px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: '#111827' }}>
                Review Return Request #{selectedReturn.id}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedReturn(null)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#9ca3af' }}
              >
                ✕
              </button>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '10px 12px', borderRadius: '6px', fontSize: '11.5px', marginBottom: '14px' }}>
              <div>Order: <strong>#{selectedReturn.order_id}</strong> &bull; Customer: <strong>{selectedReturn.user_name}</strong></div>
              <div>Product: {selectedReturn.product_details}</div>
              <div>Reason: <strong style={{ color: '#b91c1c' }}>{selectedReturn.reason}</strong></div>
              {selectedReturn.explanation && <div style={{ marginTop: '4px', color: '#475569' }}>Note: "{selectedReturn.explanation}"</div>}
            </div>

            <form onSubmit={handleUpdateReturn} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                  Return Status Workflow
                </label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none' }}
                >
                  <option value="Requested">Requested (New Claim)</option>
                  <option value="Approved">Approved (Awaiting Return Shipment)</option>
                  <option value="Return in Transit">Return in Transit</option>
                  <option value="Received">Received & Inspected</option>
                  <option value="Refund Pending">Refund Pending</option>
                  <option value="Refunded">Refunded (Record Financial Transaction)</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                  Refund Amount (PKR)
                </label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={e => setRefundAmount(e.target.value)}
                  placeholder="e.g. 3500"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                  Admin Notes & Inspection Feedback
                </label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  placeholder="e.g. Verified unboxing seal, approved full refund via bank transfer..."
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedReturn(null)}
                  style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', backgroundColor: '#111827', color: '#ffffff', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
                >
                  {isSubmitting ? 'Saving...' : 'Update Return'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
