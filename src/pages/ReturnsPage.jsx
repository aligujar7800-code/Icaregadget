import React from 'react';

export default function ReturnsPage() {
  return (
    <main>
      <section className="section">
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="section__header">
            <h1 className="section__title">Returns & Exchanges</h1>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', fontSize: '1.125rem', color: 'var(--muted)', lineHeight: '1.7', marginTop: 'var(--space-6)' }}>
            <p>
              We want you to be completely satisfied with your purchase from <strong>icaregadget.</strong> If you are not completely satisfied, you can return the product to us.
            </p>
            
            <h3 style={{ color: 'var(--text)', fontSize: '1.25rem', marginTop: 'var(--space-4)' }}>7-Day Return Policy</h3>
            <p>
              You have 7 days from the date of delivery to initiate a return. The item must be in its original packaging, unused, and in the same condition that you received it.
            </p>
            
            <h3 style={{ color: 'var(--text)', fontSize: '1.25rem', marginTop: 'var(--space-4)' }}>How to Return</h3>
            <ol style={{ paddingLeft: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <li>Contact our support team via WhatsApp or Email to request a return.</li>
              <li>Provide your Order ID and reason for return.</li>
              <li>Our team will provide you with the return shipping address.</li>
              <li>Pack the item securely and ship it back to us.</li>
            </ol>
            
            <h3 style={{ color: 'var(--text)', fontSize: '1.25rem', marginTop: 'var(--space-4)' }}>Refunds</h3>
            <p>
              Once your return is received and inspected, we will notify you of the approval or rejection of your refund. If approved, the refund will be processed to your original method of payment within 5-7 business days.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
