import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import ProductCard from '../components/ProductCard';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { products } = useStore();

  const searchResults = products.filter(p => {
    const nameMatch = p.name ? p.name.toLowerCase().includes(query.toLowerCase()) : false;
    const catMatch = p.category ? p.category.toLowerCase().includes(query.toLowerCase()) : false;
    const subCatMatch = p.subCategory ? p.subCategory.toLowerCase().includes(query.toLowerCase()) : false;
    return nameMatch || catMatch || subCatMatch;
  });

  return (
    <main>
      <section className="section">
        <div className="container">
          <div className="section__header">
            <h1 className="section__title">Search Results</h1>
          </div>
          
          <p style={{ color: 'var(--muted)', marginBottom: 'var(--space-6)' }}>
            Showing results for <strong>"{query}"</strong> ({searchResults.length} found)
          </p>

          {searchResults.length > 0 ? (
            <div className="product-grid">
              {searchResults.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 'var(--space-8) 0', color: 'var(--muted)' }}>
              <h3>No products found matching your search.</h3>
              <p style={{ marginTop: 'var(--space-2)' }}>Try checking for typos or searching for a different term.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
