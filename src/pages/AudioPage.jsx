import React from 'react';
import { useStore } from '../context/StoreContext';
import ProductCard from '../components/ProductCard';

export default function AudioPage() {
  const { products } = useStore();
  const audioProducts = products.filter(p => p.category === 'Audio');

  return (
    <main>
      <section className="section">
        <div className="container">
          <div className="section__header">
            <h1 className="section__title">Audio</h1>
          </div>
          
          <div className="product-grid" style={{ marginTop: 'var(--space-6)' }}>
            {audioProducts.length > 0 ? (
              audioProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <p style={{ color: 'var(--muted)', gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0' }}>
                No products found in this category yet.
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
