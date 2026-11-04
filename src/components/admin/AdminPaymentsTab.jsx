import React, { useState, useEffect } from 'react';

export default function AdminPaymentsTab() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [courierName, setCourierName] = useState('PostEx');
  const [settleAmount, setSettleAmount] = useState('');
  const [depositAccount, setDepositAccount] = useState('Bank Account');
  const [refNumber, setRefNumber] = useState('');
  const [settleNote, setSettleNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/payments');
      if (res.ok) {
        const data = await res.json();
        setPayments(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleRecordSettlement = async (e) => {
    if (e) e.preventDefault();
    if (!settleAmount || parseFloat(settleAmount) <= 0) return alert('Please enter a valid settlement amount');

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/payments/cod-settlement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courierName,
          amount: parseFloat(settleAmount),
          depositAccount,
          referenceNumber: refNumber || `SETTLE-${Date.now()}`,
          note: settleNote
        })
      });

      if (res.ok) {
        setShowSettleModal(false);
        setSettleAmount('');
        setRefNumber('');
        setSettleNote('');
        fetchPayments();
      }
    } catch (err) {
      console.error('Settlement error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '16px', border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: '#111827' }}>Payments & Transactions Ledger</h2>
          <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#6b7280' }}>Audit payment gateway receipts, Cash on Delivery bank settlements, and refund logs</p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setShowSettleModal(true)}
            style={{ padding: '6px 14px', borderRadius: '6px', backgroundColor: '#16a34a', color: '#ffffff', border: 'none', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
          >
            + Record Courier COD Settlement
          </button>
          <button
            type="button"
            onClick={fetchPayments}
            style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#111827', color: '#ffffff', border: 'none', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '30px 0', textAlign: 'center', color: '#6b7280', fontSize: '12px' }}>Loading payment logs...</div>
      ) : payments.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: '#6b7280', fontSize: '12px' }}>
          No financial transactions logged yet. Click "+ Record Courier COD Settlement" to record your first payout.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '11.5px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Date & Time</th>
                <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Transaction Type</th>
                <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Method / Courier</th>
                <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Reference #</th>
                <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Account</th>
                <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Amount</th>
                <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => {
                const isRefund = p.transaction_type === 'Refund';
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 10px', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {new Date(p.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '10.5px',
                        fontWeight: 600,
                        backgroundColor: isRefund ? '#fee2e2' : '#f0fdf4',
                        color: isRefund ? '#b91c1c' : '#15803d'
                      }}>
                        {p.transaction_type}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px', fontWeight: '600', color: '#111827' }}>
                      {p.payment_method}
                    </td>
                    <td style={{ padding: '8px 10px', color: '#64748b', fontFamily: 'monospace' }}>
                      {p.transaction_ref || '—'}
                    </td>
                    <td style={{ padding: '8px 10px', color: '#374151' }}>
                      {p.account}
                    </td>
                    <td style={{ padding: '8px 10px', fontWeight: '700', color: isRefund ? '#dc2626' : '#16a34a' }}>
                      {isRefund ? '-' : '+'}Rs. {Number(p.amount).toLocaleString()}
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 600, backgroundColor: '#dcfce7', color: '#15803d' }}>
                        {p.status || 'Completed'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Record Courier COD Settlement Modal */}
      {showSettleModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '440px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: '#111827' }}>Record Courier COD Settlement</h3>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Credits your Bank account and clears COD receivables</span>
              </div>
              <button
                type="button"
                onClick={() => setShowSettleModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#9ca3af' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordSettlement} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                  Courier Partner
                </label>
                <select
                  value={courierName}
                  onChange={e => setCourierName(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none' }}
                >
                  <option value="PostEx">PostEx Logistics</option>
                  <option value="Trax">Trax Logistics</option>
                  <option value="TCS">TCS Express</option>
                  <option value="Leopards">Leopards Courier</option>
                  <option value="M&P">M&P Logistics</option>
                  <option value="Call Courier">Call Courier</option>
                  <option value="Rider">Rider / Own Fleet</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                  Settled Amount (PKR)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 85000"
                  value={settleAmount}
                  onChange={e => setSettleAmount(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                  Deposit Destination Account
                </label>
                <select
                  value={depositAccount}
                  onChange={e => setDepositAccount(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none' }}
                >
                  <option value="Bank Account">Business Bank Account (Meezan / HBL)</option>
                  <option value="Cash in Hand">Physical Cash in Hand (Store Drawer)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                  Voucher / Bank Invoice Reference #
                </label>
                <input
                  type="text"
                  placeholder="e.g. PEX-INV-99214 or Cheque #8812"
                  value={refNumber}
                  onChange={e => setRefNumber(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                  Internal Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Weekly settlement for 18 dispatched parcels"
                  value={settleNote}
                  onChange={e => setSettleNote(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowSettleModal(false)}
                  style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', backgroundColor: '#16a34a', color: '#ffffff', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
                >
                  {isSubmitting ? 'Recording...' : 'Record Settlement'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
