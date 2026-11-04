import React from 'react';
import { useStore } from '../context/StoreContext';
import { useNavigate } from 'react-router-dom';

export default function ProductCard({ product }) {
  const { addToCart, setSelectedProduct } = useStore();

  const isOutOfStock = Boolean(product.outOfStock || product.status === 'out_of_stock');

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (isOutOfStock) return;
    addToCart(product);
  };

  const defaultIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '60px', height: '60px', color: 'var(--muted)' }}>
      <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
      <path d="M12 18h.01" />
    </svg>
  );

  const handleCardClick = (e) => {
    if (e.target.closest('.product-card__add')) return;
    setSelectedProduct(product);
  };

  return (
    <div className="product-card" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
      <div className="product-card__image-wrapper">
        {isOutOfStock ? (
          <div className="product-card__badge" style={{ backgroundColor: '#dc2626', color: '#ffffff', fontWeight: 'bold' }}>
            OUT OF STOCK
          </div>
        ) : (
          product.sale && <div className="product-card__badge">SALE</div>
        )}
        {product.image ? (
          <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
        ) : (
          defaultIcon
        )}
        {!product.image && <span className="product-card__caption">Product photo</span>}
        
        {isOutOfStock ? (
          <button 
            className="product-card__add" 
            aria-label={`${product.name} is out of stock`}
            disabled
            style={{
              backgroundColor: '#9ca3af',
              cursor: 'not-allowed',
              opacity: 0.7
            }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            title="Out of Stock"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
            </svg>
          </button>
        ) : (
          <button 
            className="product-card__add" 
            aria-label={`Add ${product.name} to cart`}
            onClick={handleAddToCart}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5v14" />
            </svg>
          </button>
        )}
      </div>
      <div className="product-card__info">
        <h3 className="product-card__title">{product.name}</h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <p className="product-card__price" style={{ margin: 0 }}>{product.price}</p>
          {isOutOfStock && (
            <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Out of Stock
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
