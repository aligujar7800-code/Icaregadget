import React from 'react';
import { useStore } from '../context/StoreContext';
import ProductCard from './ProductCard';

export default function BestSellersSection() {
  const { products } = useStore();
  const bestSellers = products.filter(p => p.bestSeller).slice(0, 4);

  return (
    <section className="section" id="best-sellers">
      <div className="container">
        <div className="section__header">
          <h2 className="section__title">Best sellers</h2>
          <a href="/search?q=" className="section__link">View all</a>
        </div>
        
        <div className="product-grid" style={{ marginTop: 'var(--space-6)' }}>
          {bestSellers.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
