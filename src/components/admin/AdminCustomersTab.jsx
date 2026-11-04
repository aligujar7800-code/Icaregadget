import React, { useState, useEffect } from 'react';

export default function AdminCustomersTab() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [notesInput, setNotesInput] = useState('');
  const [saveStatus, setSaveStatus] = useState('');

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/customers');
      if (res.ok) {
        const data = await res.json();
        setCustomers(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const openCustomerDetails = async (cust) => {
    setSelectedCustomer(cust);
    setCustomerDetails(null);
    setDetailsLoading(true);
    setNotesInput(cust.customer_notes || '');
    setSaveStatus('');
    try {
      const res = await fetch(`/api/customers/${cust.id}`);
      if (res.ok) {
        const data = await res.json();
        setCustomerDetails(data);
      }
    } catch (err) {
      console.error('Failed to load customer details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleToggleStatus = async (cust) => {
    const newStatus = cust.status === 'blocked' ? 'active' : 'blocked';
    if (!window.confirm(`Are you sure you want to mark ${cust.name} as ${newStatus}?`)) return;
    try {
      const res = await fetch(`/api/customers/${cust.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setCustomers(prev => prev.map(c => c.id === cust.id ? { ...c, status: newStatus } : c));
        if (selectedCustomer?.id === cust.id) {
          setSelectedCustomer(prev => ({ ...prev, status: newStatus }));
        }
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedCustomer) return;
    try {
      setSaveStatus('Saving...');
      const res = await fetch(`/api/customers/${selectedCustomer.id}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerNotes: notesInput })
      });
      if (res.ok) {
        setSaveStatus('Notes saved!');
        setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? { ...c, customer_notes: notesInput } : c));
        setTimeout(() => setSaveStatus(''), 2500);
      }
    } catch (err) {
      setSaveStatus('Error saving');
    }
  };

  const exportCSV = () => {
    if (customers.length === 0) return alert('No customers to export');
    const headers = ['ID', 'Name', 'Email', 'Phone', 'City', 'Total Orders', 'Total Spent (PKR)', 'Status', 'Registered Date'];
    const rows = customers.map(c => [
      c.id,
      `"${c.name || ''}"`,
      c.email,
      c.phone || '',
      c.city || '',
      c.totalOrders || 0,
      c.totalSpent || 0,
      c.status || 'active',
      c.created_at ? new Date(c.created_at).toLocaleDateString() : ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `customers_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredCustomers = customers.filter(c => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q) ||
      (c.city || '').toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '16px', border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: '#111827' }}>Customer Directory</h2>
          <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#6b7280' }}>Registered shoppers, lifetime purchase histories, and delivery profiles</p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={exportCSV}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: '#f1f5f9',
              color: '#334155',
              border: '1px solid #cbd5e1',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={fetchCustomers}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: '#111827',
              color: '#ffffff',
              border: 'none',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div style={{ marginBottom: '14px' }}>
        <input
          type="text"
          placeholder="Search by customer name, email, phone number, or city..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '420px',
            padding: '7px 12px',
            fontSize: '12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding: '30px 0', textAlign: 'center', color: '#6b7280', fontSize: '12px' }}>Loading customers...</div>
      ) : filteredCustomers.length === 0 ? (
        <div style={{ padding: '30px 0', textAlign: 'center', color: '#6b7280', fontSize: '12px' }}>
          {searchTerm ? 'No customers match your search.' : 'No customer accounts registered yet.'}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '11.5px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Customer</th>
                <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Phone & City</th>
                <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Orders</th>
                <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Total Spent</th>
                <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(cust => (
                <tr key={cust.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '8px 10px' }}>
                    <div style={{ fontWeight: '700', color: '#111827' }}>{cust.name}</div>
                    <div style={{ color: '#64748b', fontSize: '10.5px' }}>{cust.email}</div>
                  </td>
                  <td style={{ padding: '8px 10px', color: '#374151' }}>
                    <div>{cust.phone || 'N/A'}</div>
                    <div style={{ color: '#64748b', fontSize: '10.5px' }}>{cust.city || 'Pakistan'}</div>
                  </td>
                  <td style={{ padding: '8px 10px', fontWeight: '600', color: '#111827' }}>
                    {cust.totalOrders || 0}
                  </td>
                  <td style={{ padding: '8px 10px', fontWeight: '700', color: '#16a34a' }}>
                    Rs. {Number(cust.totalSpent || 0).toLocaleString()}
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '10.5px',
                      fontWeight: 600,
                      backgroundColor: cust.status === 'blocked' ? '#fee2e2' : '#dcfce7',
                      color: cust.status === 'blocked' ? '#b91c1c' : '#15803d'
                    }}>
                      {cust.status === 'blocked' ? 'Blocked' : 'Active'}
                    </span>
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => openCustomerDetails(cust)}
                        style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#334155', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Profile
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(cust)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: 'none',
                          backgroundColor: cust.status === 'blocked' ? '#f0fdf4' : '#fef2f2',
                          color: cust.status === 'blocked' ? '#16a34a' : '#dc2626',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {cust.status === 'blocked' ? 'Unblock' : 'Block'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Customer Profile & Address Modal */}
      {selectedCustomer && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: '#111827' }}>{selectedCustomer.name}</h3>
                <span style={{ fontSize: '11.5px', color: '#64748b' }}>{selectedCustomer.email} &bull; Customer #{selectedCustomer.id}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#9ca3af' }}
              >
                ✕
              </button>
            </div>

            {detailsLoading ? (
              <div style={{ padding: '30px 0', textAlign: 'center', color: '#6b7280' }}>Loading profile...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Stats summary */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Total Orders</div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>{customerDetails?.orders?.length || selectedCustomer.totalOrders || 0}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Lifetime Spent</div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#16a34a' }}>Rs. {Number(selectedCustomer.totalSpent || 0).toLocaleString()}</div>
                  </div>
                </div>

                {/* Saved Delivery Addresses */}
                <div>
                  <h4 style={{ fontSize: '12.5px', fontWeight: '700', margin: '0 0 8px', color: '#111827' }}>Saved Delivery Addresses</h4>
                  {!customerDetails?.addresses || customerDetails.addresses.length === 0 ? (
                    <div style={{ fontSize: '11.5px', color: '#64748b', fontStyle: 'italic' }}>
                      Primary address: {selectedCustomer.address || 'None entered yet'} ({selectedCustomer.city || 'No city'})
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {customerDetails.addresses.map(a => (
                        <div key={a.id} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', fontSize: '11.5px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <strong>{a.label} &bull; {a.recipient_name} ({a.phone})</strong>
                            {Boolean(a.is_default) && <span style={{ color: '#ea580c', fontWeight: '700', fontSize: '10.5px' }}>Default Address</span>}
                          </div>
                          <div style={{ color: '#475569', marginTop: '2px' }}>{a.street} {a.house_number}, {a.area}, {a.city}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Internal Admin Notes */}
                <div>
                  <h4 style={{ fontSize: '12.5px', fontWeight: '700', margin: '0 0 6px', color: '#111827' }}>Admin Notes (Internal Only)</h4>
                  <textarea
                    rows={3}
                    placeholder="Add customer preferences, verification notes, special requests..."
                    value={notesInput}
                    onChange={e => setNotesInput(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box', outline: 'none' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#16a34a' }}>{saveStatus}</span>
                    <button
                      type="button"
                      onClick={handleSaveNotes}
                      style={{ padding: '6px 14px', borderRadius: '6px', backgroundColor: '#111827', color: '#ffffff', border: 'none', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Save Notes
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
