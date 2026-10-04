import React from 'react';

export default function WarrantyPage() {
  return (
    <main>
      <section className="section">
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="section__header">
            <h1 className="section__title">Warranty Information</h1>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', fontSize: '1.125rem', color: 'var(--muted)', lineHeight: '1.7', marginTop: 'var(--space-6)' }}>
            <p>
              At <strong>icaregadget.</strong>, we stand behind the quality of the products we sell. Most of our gadgets and electronics come with a standard [X]-month warranty to give you peace of mind.
            </p>
            
            <h3 style={{ color: 'var(--text)', fontSize: '1.25rem', marginTop: 'var(--space-4)' }}>What is covered?</h3>
            <p>
              The warranty covers manufacturing defects and hardware malfunctions that occur under normal use during the warranty period.
            </p>
            
            <h3 style={{ color: 'var(--text)', fontSize: '1.25rem', marginTop: 'var(--space-4)' }}>What is NOT covered?</h3>
            <ul style={{ paddingLeft: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <li>Damage resulting from drops, falls, or physical impact.</li>
              <li>Water damage or exposure to moisture (unless the device is officially rated as waterproof).</li>
              <li>Normal wear and tear, including scratches and cosmetic damage.</li>
              <li>Damage caused by unauthorized repairs or modifications.</li>
            </ul>
            
            <h3 style={{ color: 'var(--text)', fontSize: '1.25rem', marginTop: 'var(--space-4)' }}>How to Claim Warranty</h3>
            <p>
              If your device experiences an issue covered by the warranty, please contact our support team. Provide your Order ID, a detailed description of the problem, and a photo or video if applicable. We will guide you through the repair or replacement process.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
