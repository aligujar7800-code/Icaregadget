import React from 'react';

export default function AboutPage() {
  return (
    <main>
      <section className="section">
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="section__header" style={{ marginBottom: 'var(--space-8)' }}>
            <h1 className="section__title" style={{ fontSize: 'clamp(2rem, 5vw, 4rem)' }}>
              Gadgets worth the upgrade.
            </h1>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', fontSize: '1.125rem', color: 'var(--muted)', lineHeight: '1.7' }}>
            <p>
              Welcome to <strong>icaregadget.</strong> We are your trusted neighborhood electronics and gadget store, originally starting as a physical shop you can walk into right here in Faisalabad, Pakistan.
            </p>
            <p>
              Our mission is simple: to bring you the best in modern consumer electronics. From the latest smartphones to high-fidelity audio equipment, smart home solutions, and premium accessories, we curate only the highest quality products that we believe are truly worth the upgrade.
            </p>
            <p>
              We pride ourselves on offering a premium shopping experience both in-store and online. We know how important trust is when buying electronics, which is why we offer cash on delivery, nationwide shipping across Pakistan, and reliable warranties on our products.
            </p>
            <p>
              See it before you buy it. You can always visit our Faisalabad store to try any product in person. We're here to help you make the best tech decisions.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
