import React, { useState, useEffect } from 'react';

export default function CustomerAppointmentsTab({ user }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState({ text: '', type: '' });

  // Modal State
  const [serviceType, setServiceType] = useState('Product Demo & Trial');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('14:00');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const userEmail = (user?.email || '').toLowerCase().trim();

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/appointments');
      if (res.ok) {
        const data = await res.json();
        const mine = data.filter(a => (a.customer_email || '').toLowerCase().trim() === userEmail);
        setAppointments(mine);
      }
    } catch (err) {
      console.error('Fetch appointments error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [user]);

  const getStatusBadge = (st = 'Pending') => {
    switch (st.toLowerCase()) {
      case 'confirmed':
        return { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' };
      case 'completed':
        return { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' };
      case 'cancelled':
        return { bg: '#fee2e2', text: '#b91c1c', border: '#fecaca' };
      default:
        return { bg: '#fef3c7', text: '#b45309', border: '#fde68a' };
    }
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (!appointmentDate) {
      setFeedbackMsg({ text: 'Please choose an appointment date.', type: 'error' });
      return;
    }
    setSubmitting(true);
    setFeedbackMsg({ text: '', type: '' });

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: user?.name || 'Customer',
          customerEmail: user?.email,
          customerPhone: user?.phone || '',
          serviceType,
          appointmentDate,
          appointmentTime,
          notes
        })
      });

      if (res.ok) {
        setFeedbackMsg({ text: 'Appointment booked successfully! We will confirm via WhatsApp or email.', type: 'success' });
        setIsModalOpen(false);
        setNotes('');
        fetchAppointments();
      } else {
        const err = await res.json();
        setFeedbackMsg({ text: err.error || 'Failed to book appointment', type: 'error' });
      }
    } catch (err) {
      setFeedbackMsg({ text: 'Network error booking appointment.', type: 'error' });
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
            Gadget Service & In-Store Bookings
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '4px 0 0 0' }}>
            Schedule a physical checkup, live demo, or consultation at our store
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
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
          <span>+</span> Book Service / Demo
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
          Loading your scheduled appointments...
        </div>
      ) : appointments.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '50px 20px',
          backgroundColor: '#f8fafc',
          borderRadius: '12px',
          border: '1px dashed #cbd5e1'
        }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: '#64748b' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1e293b', marginBottom: '6px' }}>No Upcoming Appointments</h3>
          <p style={{ color: '#64748b', fontSize: '0.875rem', maxWidth: '380px', margin: '0 auto 16px' }}>
            Need gadget inspection, trial of high-end accessories, or personal consultation? Schedule an appointment with our expert technicians.
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="btn btn--primary"
            style={{ padding: '8px 20px', fontSize: '0.875rem' }}
          >
            Book an Appointment
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {appointments.map(apt => {
            const badge = getStatusBadge(apt.status);
            return (
              <div
                key={apt.id}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '20px',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{
                    backgroundColor: '#f1f5f9',
                    color: '#334155',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    padding: '3px 8px',
                    borderRadius: '4px'
                  }}>
                    {apt.service_type || 'Consultation'}
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
                    {apt.status || 'Pending'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#0f172a' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  </span>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#0f172a' }}>
                      {apt.appointment_date}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Time: {apt.appointment_time || 'TBD'}
                    </div>
                  </div>
                </div>

                {apt.notes && (
                  <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '6px', fontSize: '0.8rem', color: '#475569', marginTop: '10px' }}>
                    <strong>Notes:</strong> {apt.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Appointment Modal */}
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
                Schedule Service or Consultation
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBook} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Service Type *</label>
                <select
                  value={serviceType}
                  onChange={e => setServiceType(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem', backgroundColor: '#ffffff' }}
                >
                  <option value="Product Demo & Trial">Product Demo & Hands-on Trial</option>
                  <option value="Gadget Inspection & Repair">Gadget Inspection & Repair</option>
                  <option value="AI Consultation">AI Consultation & Setup</option>
                  <option value="Bulk Order Consultation">Bulk / Corporate Order</option>
                  <option value="General Support">General Support</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Date *</label>
                  <input
                    type="date"
                    required
                    value={appointmentDate}
                    onChange={e => setAppointmentDate(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Time Slot *</label>
                  <input
                    type="time"
                    required
                    value={appointmentTime}
                    onChange={e => setAppointmentTime(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Notes / Device Details (Optional)</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Tell us what you want to test or what issue you are experiencing..."
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
                  {submitting ? 'Confirming...' : 'Confirm Appointment'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
