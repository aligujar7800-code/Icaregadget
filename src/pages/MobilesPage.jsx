import React from 'react';
import { useStore } from '../context/StoreContext';
import ProductCard from '../components/ProductCard';

export default function MobilesPage() {
  const { products } = useStore();
  const mobileProducts = products.filter(p => p.category === 'Mobiles');

  return (
    <main>
      <section className="section">
        <div className="container">
          <div className="section__header">
            <h1 className="section__title">Mobiles</h1>
          </div>
          
          <div className="product-grid" style={{ marginTop: 'var(--space-6)' }}>
            {mobileProducts.length > 0 ? (
              mobileProducts.map((product) => (
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
