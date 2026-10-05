import React from 'react';
import { useStore } from '../context/StoreContext';

export default function VisitStore() {
  const { storeDetails } = useStore();
  return (
    <section className="section visit-shop">
      <div className="container">
        <div className="visit-shop__card">
          <div className="visit-shop__content">
            <div className="visit-shop__eyebrow">VISIT THE SHOP</div>
            <h2 className="visit-shop__title">See it before you buy it.</h2>
          </div>
          <div className="visit-shop__actions">
            <a href={`https://maps.google.com/?q=${encodeURIComponent(storeDetails.address + ', Faisalabad')}`} target="_blank" rel="noopener noreferrer" className="btn visit-shop__btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Get Directions
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
