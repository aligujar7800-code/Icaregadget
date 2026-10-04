import React from 'react';

export default function TrackOrderPage() {
  return (
    <main>
      <section className="section">
        <div className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="section__header">
            <h1 className="section__title">Track your order</h1>
          </div>
          
          <div style={{ marginTop: 'var(--space-6)' }}>
            <p style={{ color: 'var(--muted)', marginBottom: 'var(--space-6)', lineHeight: '1.6' }}>
              Enter your order ID and billing email address below to track your order status.
            </p>
            
            <form 
              style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}
              onSubmit={(e) => e.preventDefault()}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label htmlFor="orderId" style={{ fontWeight: '600', fontSize: '0.875rem' }}>Order ID</label>
                <input 
                  type="text" 
                  id="orderId" 
                  style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-gray)', fontFamily: 'inherit' }}
                  placeholder="e.g. 12345"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label htmlFor="email" style={{ fontWeight: '600', fontSize: '0.875rem' }}>Billing Email</label>
                <input 
                  type="email" 
                  id="email" 
                  style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-gray)', fontFamily: 'inherit' }}
                  placeholder="your@email.com"
                />
              </div>

              <button type="submit" className="btn btn--primary" style={{ marginTop: 'var(--space-2)' }}>
                Track Order
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
