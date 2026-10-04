import React from 'react';
import { useStore } from '../context/StoreContext';

export default function ContactPage() {
  const { storeDetails } = useStore();
  return (
    <main>
      <section className="section">
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="section__header">
            <h1 className="section__title">Contact us</h1>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-8)', marginTop: 'var(--space-6)' }}>
            
            {/* Contact Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: 'var(--space-2)' }}>Visit our store</h3>
                <p style={{ color: 'var(--muted)', lineHeight: '1.6' }}>
                  {storeDetails.address}<br />
                  Faisalabad, Pakistan
                </p>
              </div>
              
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: 'var(--space-2)' }}>Opening hours</h3>
                <p style={{ color: 'var(--muted)', lineHeight: '1.6' }}>
                  {storeDetails.hours}
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: 'var(--space-2)' }}>Customer support</h3>
                <p style={{ color: 'var(--muted)', lineHeight: '1.6' }}>
                  WhatsApp: {storeDetails.phone}<br />
                  Email: support@icaregadget.com
                </p>
              </div>
            </div>

            {/* Contact Form */}
            <form 
              style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
              onSubmit={(e) => e.preventDefault()}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label htmlFor="name" style={{ fontWeight: '600', fontSize: '0.875rem' }}>Name</label>
                <input 
                  type="text" 
                  id="name" 
                  style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-gray)', fontFamily: 'inherit' }}
                  placeholder="Your name"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label htmlFor="email" style={{ fontWeight: '600', fontSize: '0.875rem' }}>Email</label>
                <input 
                  type="email" 
                  id="email" 
                  style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-gray)', fontFamily: 'inherit' }}
                  placeholder="your@email.com"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label htmlFor="message" style={{ fontWeight: '600', fontSize: '0.875rem' }}>Message</label>
                <textarea 
                  id="message" 
                  rows="4"
                  style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-gray)', fontFamily: 'inherit', resize: 'vertical' }}
                  placeholder="How can we help you?"
                ></textarea>
              </div>

              <button type="submit" className="btn btn--primary" style={{ marginTop: 'var(--space-2)' }}>
                Send Message
              </button>
            </form>

          </div>
        </div>
      </section>
    </main>
  );
}
