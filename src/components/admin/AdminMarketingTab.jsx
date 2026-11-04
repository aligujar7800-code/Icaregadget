import React, { useState, useEffect } from 'react';

export default function AdminMarketingTab() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('banner');
  const [bannerImage, setBannerImage] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/marketing');
      if (res.ok) {
        const data = await res.json();
        setCampaigns(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleCreateCampaign = async (e) => {
    if (e) e.preventDefault();
    if (!title) return alert('Campaign title is required');
    try {
      setIsSubmitting(true);
      const res = await fetch('/api/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          type,
          bannerImage,
          targetUrl,
          couponCode: couponCode.trim().toUpperCase(),
          status: 'Active'
        })
      });

      if (res.ok) {
        setShowAddModal(false);
        setTitle('');
        setBannerImage('');
        setTargetUrl('');
        setCouponCode('');
        fetchCampaigns();
      }
    } catch (err) {
      console.error('Error creating campaign:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCampaign = async (id) => {
    if (!window.confirm('Delete this promotional campaign?')) return;
    try {
      const res = await fetch(`/api/marketing/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCampaigns(prev => prev.filter(c => c.id !== id));
      }
    } catch (err) {
      console.error('Error deleting campaign:', err);
    }
  };

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '16px', border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: '#111827' }}>Marketing & Campaigns</h2>
          <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#6b7280' }}>Manage homepage promo banners, voucher tie-ins, WhatsApp announcements, and featured sales</p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            style={{ padding: '6px 14px', borderRadius: '6px', backgroundColor: '#ea580c', color: '#ffffff', border: 'none', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
          >
            + New Promo Campaign
          </button>
          <button
            type="button"
            onClick={fetchCampaigns}
            style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#111827', color: '#ffffff', border: 'none', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '30px 0', textAlign: 'center', color: '#6b7280', fontSize: '12px' }}>Loading marketing campaigns...</div>
      ) : campaigns.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: '#6b7280', fontSize: '12px' }}>
          No marketing campaigns active currently. Click "+ New Promo Campaign" to launch a homepage banner or promotional push.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
          {campaigns.map(c => (
            <div key={c.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 600, backgroundColor: '#dcfce7', color: '#15803d' }}>
                    {c.status || 'Active'}
                  </span>
                  <span style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>{c.type}</span>
                </div>
                <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#111827', margin: '0 0 6px' }}>{c.title}</h4>
                {c.coupon_code && (
                  <div style={{ fontSize: '11.5px', color: '#ea580c', fontWeight: '600', marginBottom: '6px' }}>
                    Linked Voucher: <strong>{c.coupon_code}</strong>
                  </div>
                )}
                {c.target_url && (
                  <div style={{ fontSize: '10.5px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Destination: {c.target_url}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #e5e7eb' }}>
                <button
                  type="button"
                  onClick={() => handleDeleteCampaign(c.id)}
                  style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', backgroundColor: '#fee2e2', color: '#dc2626', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Remove Campaign
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Campaign Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '440px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: '#111827' }}>Create Promotional Campaign</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#9ca3af' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Campaign Title</label>
                <input
                  type="text"
                  placeholder="e.g. 20W Apple Fast Charger Mega Deal"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Campaign Channel</label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none' }}
                >
                  <option value="banner">Homepage Hero Banner</option>
                  <option value="announcement">Announcement Bar Flash Deal</option>
                  <option value="whatsapp">WhatsApp Broadcast Campaign</option>
                  <option value="featured">Featured Product Spotlight</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Banner Image URL (Optional)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={bannerImage}
                  onChange={e => setBannerImage(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Target Storefront Route</label>
                <input
                  type="text"
                  placeholder="e.g. /accessories or /mobiles"
                  value={targetUrl}
                  onChange={e => setTargetUrl(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Linked Voucher Code (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. FLASH20"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                />
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
                  {isSubmitting ? 'Launching...' : 'Launch Campaign'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
