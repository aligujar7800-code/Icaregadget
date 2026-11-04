import React, { useState, useEffect } from 'react';

export default function AdminStaffTab() {
  const [staff, setStaff] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState('staff'); // 'staff' | 'audit'
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Support Agent');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStaffData = async () => {
    try {
      setLoading(true);
      const [staffRes, auditRes] = await Promise.all([
        fetch('/api/staff'),
        fetch('/api/audit-logs')
      ]);

      if (staffRes.ok) {
        const data = await staffRes.json();
        setStaff(Array.isArray(data) ? data : []);
      }
      if (auditRes.ok) {
        const logs = await auditRes.json();
        setAuditLogs(Array.isArray(logs) ? logs : []);
      }
    } catch (err) {
      console.error('Error fetching staff data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, []);

  const handleAddStaff = async (e) => {
    if (e) e.preventDefault();
    if (!name || !email) return alert('Name and email are required');
    try {
      setIsSubmitting(true);
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email: email.trim().toLowerCase(),
          role,
          permissions: [role]
        })
      });

      if (res.ok) {
        setShowAddModal(false);
        setName('');
        setEmail('');
        fetchStaffData();
      }
    } catch (err) {
      console.error('Error adding staff member:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStaff = async (id) => {
    if (!window.confirm('Revoke access for this staff member?')) return;
    try {
      const res = await fetch(`/api/staff/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setStaff(prev => prev.filter(s => s.id !== id));
      }
    } catch (err) {
      console.error('Error deleting staff:', err);
    }
  };

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '16px', border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: '#111827' }}>Staff & Role-Based Permissions</h2>
          <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#6b7280' }}>Manage store administrators, role assignments, and inspect security audit trail</p>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setSubTab('staff')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid ' + (subTab === 'staff' ? '#ea580c' : '#d1d5db'),
              backgroundColor: subTab === 'staff' ? '#ffedd5' : '#ffffff',
              color: subTab === 'staff' ? '#ea580c' : '#374151',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Staff Directory ({staff.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('audit')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid ' + (subTab === 'audit' ? '#ea580c' : '#d1d5db'),
              backgroundColor: subTab === 'audit' ? '#ffedd5' : '#ffffff',
              color: subTab === 'audit' ? '#ea580c' : '#374151',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Audit Logs ({auditLogs.length})
          </button>
          {subTab === 'staff' && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              style={{ padding: '6px 14px', borderRadius: '6px', backgroundColor: '#ea580c', color: '#ffffff', border: 'none', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
            >
              + Add Staff Member
            </button>
          )}
        </div>
      </div>

      {subTab === 'staff' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '11.5px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Staff Member</th>
                <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Email Address</th>
                <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Assigned Role</th>
                <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Primary Super Admin */}
              <tr style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: '#fffbeb' }}>
                <td style={{ padding: '8px 10px', fontWeight: '700', color: '#111827' }}>
                  Store Owner (Primary)
                </td>
                <td style={{ padding: '8px 10px', color: '#4b5563' }}>admin@icaregadget.store</td>
                <td style={{ padding: '8px 10px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 700, backgroundColor: '#fef3c7', color: '#b45309' }}>
                    Super Admin
                  </span>
                </td>
                <td style={{ padding: '8px 10px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 600, backgroundColor: '#dcfce7', color: '#15803d' }}>
                    Active
                  </span>
                </td>
                <td style={{ padding: '8px 10px', textAlign: 'right', color: '#9ca3af', fontSize: '11px' }}>
                  Master Account
                </td>
              </tr>

              {staff.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '8px 10px', fontWeight: '600', color: '#111827' }}>{s.name}</td>
                  <td style={{ padding: '8px 10px', color: '#4b5563' }}>{s.email}</td>
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 600, backgroundColor: '#f1f5f9', color: '#334155' }}>
                      {s.role}
                    </span>
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 600, backgroundColor: '#dcfce7', color: '#15803d' }}>
                      {s.status || 'Active'}
                    </span>
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => handleDeleteStaff(s.id)}
                      style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', backgroundColor: '#fee2e2', color: '#dc2626', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {subTab === 'audit' && (
        <div style={{ overflowX: 'auto' }}>
          {auditLogs.length === 0 ? (
            <div style={{ padding: '30px 0', textAlign: 'center', color: '#6b7280', fontSize: '12px' }}>
              No audit logs recorded yet. Administrative events will be logged here.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '11.5px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Timestamp</th>
                  <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Actor</th>
                  <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Action Event</th>
                  <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Entity Type & ID</th>
                  <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(log => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 10px', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {new Date(log.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '8px 10px', fontWeight: '600', color: '#111827' }}>
                      {log.user_email || 'System'}
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 600, backgroundColor: '#f1f5f9', color: '#1e293b' }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px', color: '#4b5563' }}>
                      {log.entity_type} {log.entity_id ? `(#${log.entity_id})` : ''}
                    </td>
                    <td style={{ padding: '8px 10px', color: '#64748b', maxWidth: '300px' }}>
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '440px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: '#111827' }}>Add New Staff Member</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#9ca3af' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddStaff} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Staff Name</label>
                <input
                  type="text"
                  placeholder="e.g. Tariq Khan"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Email Address</label>
                <input
                  type="email"
                  placeholder="staff@icaregadget.store"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Role & Permission Level</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none' }}
                >
                  <option value="Admin">Full Admin</option>
                  <option value="Order Manager">Order Manager (Orders & Dispatch)</option>
                  <option value="Inventory Manager">Inventory Manager (Stock & Catalog)</option>
                  <option value="Finance Manager">Finance Manager (P&L & Accounting)</option>
                  <option value="Marketing Manager">Marketing Manager (Coupons & Banners)</option>
                  <option value="Support Agent">Support Agent (Chat & Returns)</option>
                </select>
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
                  {isSubmitting ? 'Adding...' : 'Add Staff Member'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
