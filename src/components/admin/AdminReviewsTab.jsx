import React, { useState, useEffect } from 'react';

export default function AdminReviewsTab() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState(null);
  const [replyText, setReplyText] = useState('');

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/reviews');
      if (res.ok) {
        const data = await res.json();
        setReviews(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await fetch(`/api/reviews/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setReviews(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      }
    } catch (err) {
      console.error('Error updating review status:', err);
    }
  };

  const handleSaveReply = async (id) => {
    try {
      const res = await fetch(`/api/reviews/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: selectedReview.status, adminReply: replyText })
      });
      if (res.ok) {
        setReviews(prev => prev.map(r => r.id === id ? { ...r, admin_reply: replyText } : r));
        setSelectedReview(null);
        setReplyText('');
      }
    } catch (err) {
      console.error('Error saving reply:', err);
    }
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm('Delete this review permanently?')) return;
    try {
      const res = await fetch(`/api/reviews/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setReviews(prev => prev.filter(r => r.id !== id));
      }
    } catch (err) {
      console.error('Error deleting review:', err);
    }
  };

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '16px', border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: '#111827' }}>Customer Reviews & Ratings</h2>
          <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#6b7280' }}>Moderate genuine shopper feedback, publish authentic testimonials, and reply to inquiries</p>
        </div>
        <button
          type="button"
          onClick={fetchReviews}
          style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#111827', color: '#ffffff', border: 'none', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '30px 0', textAlign: 'center', color: '#6b7280', fontSize: '12px' }}>Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: '#6b7280', fontSize: '12px' }}>
          No customer reviews submitted yet. Reviews submitted from the storefront will appear here for moderation.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '11.5px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Customer</th>
                <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Product</th>
                <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Rating</th>
                <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Review Comment</th>
                <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map(r => {
                const isApproved = r.status === 'Approved';
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 10px' }}>
                      <div style={{ fontWeight: '700', color: '#111827' }}>{r.user_name}</div>
                      <div style={{ color: '#64748b', fontSize: '10.5px' }}>{r.user_email || 'Verified Purchase'}</div>
                    </td>
                    <td style={{ padding: '8px 10px', fontWeight: '600', color: '#111827' }}>
                      {r.product_name}
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{ color: '#ea580c', fontWeight: '700' }}>
                        {'★'.repeat(r.rating || 5)}{'☆'.repeat(5 - (r.rating || 5))}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px', maxWidth: '300px' }}>
                      <div style={{ color: '#374151', fontStyle: 'italic' }}>"{r.comment}"</div>
                      {r.admin_reply && (
                        <div style={{ marginTop: '4px', padding: '4px 8px', backgroundColor: '#f0fdf4', borderRadius: '4px', color: '#166534', fontSize: '10.5px' }}>
                          <strong>Store Reply:</strong> {r.admin_reply}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '10.5px',
                        fontWeight: 600,
                        backgroundColor: isApproved ? '#dcfce7' : '#fee2e2',
                        color: isApproved ? '#15803d' : '#b91c1c'
                      }}>
                        {r.status || 'Pending'}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(r.id, isApproved ? 'Pending' : 'Approved')}
                          style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#334155', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          {isApproved ? 'Unpublish' : 'Approve'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setSelectedReview(r); setReplyText(r.admin_reply || ''); }}
                          style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ea580c', backgroundColor: '#fff7ed', color: '#ea580c', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Reply
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteReview(r.id)}
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

      {/* Reply Modal */}
      {selectedReview && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '440px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: '#111827' }}>Reply to Customer Review</h3>
              <button
                type="button"
                onClick={() => setSelectedReview(null)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#9ca3af' }}
              >
                ✕
              </button>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '10px 12px', borderRadius: '6px', fontSize: '11.5px', marginBottom: '14px' }}>
              <div><strong>{selectedReview.user_name}</strong> on <em>{selectedReview.product_name}</em>:</div>
              <div style={{ color: '#4b5563', marginTop: '4px' }}>"{selectedReview.comment}"</div>
            </div>

            <textarea
              rows={4}
              placeholder="Write an official store response thanking the customer or answering their inquiry..."
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '14px' }}>
              <button
                type="button"
                onClick={() => setSelectedReview(null)}
                style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveReply(selectedReview.id)}
                style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', backgroundColor: '#111827', color: '#ffffff', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
              >
                Post Reply
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
