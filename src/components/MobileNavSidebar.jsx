import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

export default function MobileNavSidebar() {
  const { isMobileMenuOpen, setIsMobileMenuOpen, categories } = useStore();
  const [expandedCat, setExpandedCat] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setExpandedCat(null); // Reset when closed
    }
  }, [isMobileMenuOpen]);

  if (!isMobileMenuOpen) return null;

  const handleClose = () => setIsMobileMenuOpen(false);

  const handleNavigate = (path) => {
    handleClose();
    navigate(path);
  };

  const navCategories = [];
  if (categories) {
    Object.keys(categories).forEach(catName => {
      if (catName === 'Uncategorized') return;
      const subCats = categories[catName];
      const items = (subCats || []).map(sc => ({
        name: sc,
        path: `/search?q=${encodeURIComponent(sc)}`
      }));
      
      const hardcodedPaths = {
        'Mobiles': '/mobiles',
        'Audio': '/audio',
        'Accessories': '/accessories',
        'Smart Home': '/smart-home'
      };
      
      const path = hardcodedPaths[catName] || `/search?q=${encodeURIComponent(catName)}`;
      if (items.length > 0) items.push({ name: `View All ${catName}`, path });
      
      navCategories.push({ id: catName, title: catName, path, items });
    });
  }

  return (
    <div className="mobile-nav-overlay" onClick={handleClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999
    }}>
      <div className="mobile-nav-sidebar" onClick={e => e.stopPropagation()} style={{
        position: 'absolute', top: 0, left: 0, bottom: 0, width: '300px', backgroundColor: '#111827',
        color: '#fff', display: 'flex', flexDirection: 'column', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid #1f2937' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>icaregadget<span style={{ color: 'var(--orange)' }}>.</span></div>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <nav style={{ padding: '20px 0', display: 'flex', flexDirection: 'column' }}>
          <button onClick={() => handleNavigate('/')} style={{ background: 'none', border: 'none', color: '#fff', textAlign: 'left', padding: '16px 20px', fontSize: '1rem', fontWeight: '500', cursor: 'pointer', borderBottom: '1px solid #1f2937' }}>
            Home
          </button>

          {navCategories.map(cat => (
            <div key={cat.id} style={{ borderBottom: '1px solid #1f2937' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px' }}>
                <button onClick={() => handleNavigate(cat.path)} style={{ background: 'none', border: 'none', color: '#fff', textAlign: 'left', fontSize: '1rem', fontWeight: '500', cursor: 'pointer', flex: 1 }}>
                  {cat.title}
                </button>
                {cat.items.length > 0 && (
                  <button onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)} style={{ background: 'none', border: 'none', color: '#9ca3af', padding: '0 8px', cursor: 'pointer' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: expandedCat === cat.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                )}
              </div>
              
              {expandedCat === cat.id && cat.items.length > 0 && (
                <div style={{ backgroundColor: '#0f1422', padding: '8px 0' }}>
                  {cat.items.map(item => (
                    <button key={item.name} onClick={() => handleNavigate(item.path)} style={{ display: 'block', width: '100%', background: 'none', border: 'none', color: '#9ca3af', textAlign: 'left', padding: '12px 20px 12px 32px', fontSize: '0.9375rem', cursor: 'pointer' }}>
                      {item.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          <button onClick={() => handleNavigate('/book-appointment')} style={{ background: 'none', border: 'none', color: 'var(--orange)', textAlign: 'left', padding: '16px 20px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', borderBottom: '1px solid #1f2937' }}>
            Book Appointment
          </button>
        </nav>
      </div>
    </div>
  );
}
