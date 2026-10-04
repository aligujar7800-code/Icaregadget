import React from 'react';
import { useStore } from '../context/StoreContext';
import ProductCard from './ProductCard';

export default function NewArrivalsSection() {
  const { products } = useStore();
  // Show the most recently added products (highest IDs = newest)
  const newArrivals = [...products].sort((a, b) => b.id - a.id).slice(0, 4);

  return (
    <section className="section" id="new-arrivals">
      <div className="container">
        <div className="section__header">
          <h2 className="section__title">New Arrivals</h2>
          <a href="/search?q=" className="section__link">View all</a>
        </div>
        <div className="product-grid" style={{ marginTop: 'var(--space-6)' }}>
          {newArrivals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
