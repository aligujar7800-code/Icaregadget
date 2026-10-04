import React from 'react';
import { useStore } from '../context/StoreContext';
import ProductCard from '../components/ProductCard';

export default function SmartHomePage() {
  const { products } = useStore();
  const smartHomeProducts = products.filter(p => p.category === 'Smart Home');

  return (
    <main>
      <section className="section">
        <div className="container">
          <div className="section__header">
            <h1 className="section__title">Smart Home</h1>
          </div>
          
          <div className="product-grid" style={{ marginTop: 'var(--space-6)' }}>
            {smartHomeProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
