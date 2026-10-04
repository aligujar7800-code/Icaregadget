import React from 'react';
import { useStore } from '../context/StoreContext';
import { useNavigate } from 'react-router-dom';

export default function ProductCard({ product }) {
  const { addToCart, setSelectedProduct } = useStore();

  const handleAddToCart = (e) => {
    e.preventDefault();
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
        {product.sale && <div className="product-card__badge">SALE</div>}
        {product.image ? (
          <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
        ) : (
          defaultIcon
        )}
        {!product.image && <span className="product-card__caption">Product photo</span>}
        <button 
          className="product-card__add" 
          aria-label={`Add ${product.name} to cart`}
          onClick={handleAddToCart}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5v14" />
          </svg>
        </button>
      </div>
      <div className="product-card__info">
        <h3 className="product-card__title">{product.name}</h3>
        <p className="product-card__price">{product.price}</p>
      </div>
    </div>
  );
}
