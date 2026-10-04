import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function BookAppointmentPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    service: 'AI Automation Consultation',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <section style={{ padding: '80px 0', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: '540px' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><path d="M20 6 9 17l-5-5" /></svg>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '12px' }}>Appointment Booked!</h1>
          <p style={{ color: 'var(--muted)', fontSize: '1.125rem', marginBottom: '32px' }}>
            Thank you, {formData.name}. We'll confirm your appointment via email or WhatsApp shortly.
          </p>
          <button onClick={() => navigate('/')} className="btn btn--primary" style={{ backgroundColor: 'var(--orange)', color: 'white', border: 'none' }}>
            Back to Home
          </button>
        </div>
      </section>
    );
  }

  return (
    <section style={{ padding: '60px 0 80px' }}>
      <div className="container" style={{ maxWidth: '620px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ color: 'var(--orange)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>SCHEDULE A SESSION</div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '12px' }}>Book an Appointment</h1>
          <p style={{ color: 'var(--muted)', fontSize: '1.125rem', maxWidth: '420px', margin: '0 auto' }}>
            Schedule a consultation for AI automation services or visit our store.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: 'var(--off-white)', padding: '32px', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '6px' }}>Full Name *</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Your full name" style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-gray)', fontFamily: 'inherit', fontSize: '0.9375rem', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '6px' }}>Email *</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="your@email.com" style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-gray)', fontFamily: 'inherit', fontSize: '0.9375rem', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '6px' }}>Phone / WhatsApp *</label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required placeholder="+92 300 1234567" style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-gray)', fontFamily: 'inherit', fontSize: '0.9375rem', boxSizing: 'border-box' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '6px' }}>Preferred Date *</label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} required style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-gray)', fontFamily: 'inherit', fontSize: '0.9375rem', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '6px' }}>Preferred Time *</label>
              <input type="time" name="time" value={formData.time} onChange={handleChange} required style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-gray)', fontFamily: 'inherit', fontSize: '0.9375rem', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '6px' }}>Service</label>
            <select name="service" value={formData.service} onChange={handleChange} style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-gray)', fontFamily: 'inherit', fontSize: '0.9375rem', backgroundColor: 'white', boxSizing: 'border-box' }}>
              <option>AI Automation Consultation</option>
              <option>Product Demo & Trial</option>
              <option>Bulk / Corporate Order</option>
              <option>Technical Support</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '6px' }}>Message (Optional)</label>
            <textarea name="message" value={formData.message} onChange={handleChange} rows="3" placeholder="Tell us about your requirements..." style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-gray)', fontFamily: 'inherit', fontSize: '0.9375rem', resize: 'vertical', boxSizing: 'border-box' }} />
          </div>

          <button type="submit" className="btn btn--primary" style={{ backgroundColor: 'var(--orange)', color: 'white', border: 'none', padding: '14px', fontSize: '1rem', marginTop: '8px' }}>
            Confirm Appointment
          </button>
        </form>
      </div>
    </section>
  );
}
