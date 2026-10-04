import React from 'react';

export default function TrustBenefits() {
  return (
    <section className="trust">
      <div className="container">
        <div className="trust__grid">
          <div className="trust__item">
            <div className="trust__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div className="trust__title">Free Cash<br />on Delivery</div>
          </div>
          <div className="trust__item">
            <div className="trust__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <div className="trust__title">6-Month<br />Warranty</div>
          </div>
          <div className="trust__item">
            <div className="trust__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="trust__title">10,000+<br />Happy Customers</div>
          </div>
        </div>
      </div>
    </section>
  );
}
