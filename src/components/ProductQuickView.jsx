import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';

export default function ProductQuickView() {
  const { selectedProduct, setSelectedProduct, addToCart } = useStore();
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (selectedProduct) {
      document.body.style.overflow = 'hidden';
      setActiveImage(0); // reset to first image
      setQuantity(1); // reset quantity
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedProduct]);

  if (!selectedProduct) return null;

  const images = selectedProduct.images && selectedProduct.images.length > 0 
    ? selectedProduct.images 
    : (selectedProduct.image ? [selectedProduct.image] : []);

  const handleClose = () => setSelectedProduct(null);

  return (
    <div className="quickview-overlay" onClick={handleClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px',
      backdropFilter: 'blur(4px)'
    }}>
      <div className="quickview-modal" onClick={e => e.stopPropagation()} style={{
        backgroundColor: '#0a0a0a', width: '100%', maxWidth: '1100px', height: '85vh',
        borderRadius: '4px', display: 'flex', position: 'relative', overflow: 'hidden',
        color: 'white', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        <button onClick={handleClose} style={{
          position: 'absolute', top: '16px', right: '16px', zIndex: 20,
          background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer',
          padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'color 0.2s'
        }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Left: Gallery & Main Image */}
        <div style={{ flex: '1.2', display: 'flex', backgroundColor: '#ffffff', position: 'relative' }}>
          {/* Thumbnails Sidebar */}
          {images.length > 1 && (
            <div className="hide-scrollbar" style={{ 
              width: '100px', padding: '24px 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px',
              backgroundColor: '#0a0a0a', borderRight: '1px solid #1f2937'
            }}>
              {images.map((img, i) => (
                <button 
                  key={i} 
                  onClick={() => setActiveImage(i)}
                  style={{
                    padding: 0, border: 'none',
                    borderRadius: '0px', overflow: 'hidden', cursor: 'pointer', background: 'none',
                    opacity: activeImage === i ? 1 : 0.5,
                    transition: 'opacity 0.2s',
                    height: '80px', width: '100%'
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => { if(activeImage !== i) e.currentTarget.style.opacity = 0.5 }}
                >
                  <img src={img} alt={`Thumbnail ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
          {/* Main Image */}
          <div style={{ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', position: 'relative' }}>
            {selectedProduct.sale && (
              <div style={{ position: 'absolute', top: '24px', left: '24px', backgroundColor: '#ef4444', color: 'white', fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 12px', letterSpacing: '1px' }}>
                SALE
              </div>
            )}
            {images.length > 0 ? (
              <img src={images[activeImage]} alt={selectedProduct.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            ) : (
              <div style={{ color: '#9ca3af' }}>No Image Available</div>
            )}
          </div>
        </div>

        {/* Right: Details Section */}
        <div style={{ 
          width: '450px', padding: '48px 40px', display: 'flex', flexDirection: 'column', 
          backgroundColor: '#0a0a0a', overflowY: 'auto', position: 'relative'
        }} className="custom-scrollbar">
          
          <h2 style={{ fontSize: '1.75rem', fontWeight: '400', margin: '0 0 16px 0', fontFamily: 'inherit', letterSpacing: '0.02em', lineHeight: '1.2' }}>
            {selectedProduct.name}
          </h2>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
            <span style={{ fontSize: '1.25rem', color: '#fff', fontWeight: '500' }}>
              {selectedProduct.price}
            </span>
            {selectedProduct.sale && (
              <>
                <span style={{ fontSize: '1.125rem', color: '#6b7280', textDecoration: 'line-through' }}>
                  Rs. { (parseInt(selectedProduct.price.replace(/[^\d]/g, '')) * 1.4).toLocaleString() }
                </span>
                <span style={{ fontSize: '0.875rem', color: '#ef4444', fontWeight: '600' }}>Save 40%</span>
              </>
            )}
          </div>
          
          <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '24px' }}>Shipping calculated at checkout.</p>
          
          <div style={{ marginBottom: '32px' }}>
            <h4 style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>DESCRIPTION</h4>
            <p style={{ color: '#d1d5db', lineHeight: '1.7', fontSize: '0.9375rem', whiteSpace: 'pre-wrap', fontWeight: '300' }}>
              {selectedProduct.description || "Experience premium quality with this exclusive product. Designed for durability, performance, and everyday elegance. Carefully crafted with industry-leading materials to ensure maximum satisfaction."}
            </p>
          </div>
          
          <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>QUANTITY</h4>
            </div>
            <div style={{ display: 'flex', border: '1px solid #374151', width: 'fit-content', borderRadius: '2px' }}>
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ background: 'none', border: 'none', color: '#fff', padding: '12px 16px', cursor: 'pointer', fontSize: '1.25rem' }}>-</button>
              <input type="text" value={quantity} readOnly style={{ width: '40px', background: 'none', border: 'none', color: '#fff', textAlign: 'center', fontSize: '1rem', outline: 'none' }} />
              <button onClick={() => setQuantity(quantity + 1)} style={{ background: 'none', border: 'none', color: '#fff', padding: '12px 16px', cursor: 'pointer', fontSize: '1.25rem' }}>+</button>
            </div>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
            <button 
              onClick={() => { addToCart(selectedProduct, quantity); handleClose(); }}
              style={{ 
                width: '100%', padding: '16px', fontSize: '1rem', fontWeight: '600', 
                backgroundColor: '#fff', color: '#000', border: 'none', cursor: 'pointer',
                textTransform: 'uppercase', letterSpacing: '0.05em', transition: 'background-color 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e5e7eb'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fff'}
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0a0a0a; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #374151; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4b5563; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
