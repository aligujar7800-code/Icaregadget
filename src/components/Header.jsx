import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

export default function Header() {
  const { user, logout, cart, setIsCartOpen, categories, setIsMobileMenuOpen } = useStore();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();
  const dropdownTimeout = useRef(null);

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  const navCategories = React.useMemo(() => {
    if (!categories) return [];
    
    const formattedCats = [];
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
      
      if (items.length > 0) {
        items.push({
          name: `View All ${catName}`,
          path: path
        });
      }
      
      formattedCats.push({
        id: catName,
        title: catName,
        path: path,
        items: items
      });
    });
    
    return formattedCats;
  }, [categories]);

  const handleDropdownEnter = (key) => {
    clearTimeout(dropdownTimeout.current);
    setActiveDropdown(key);
  };

  const handleDropdownLeave = () => {
    dropdownTimeout.current = setTimeout(() => setActiveDropdown(null), 150);
  };

  return (
    <header className="header">
      <div className="container header__inner" style={{ position: 'relative' }}>
        
        {/* Search Overlay */}
        <div className={`search-overlay ${showSearch ? 'search-overlay--active' : ''}`}>
          <form onSubmit={handleSearch} className="search-form">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input 
              type="text" 
              placeholder="Search for mobiles, audio, accessories..." 
              autoFocus={showSearch}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button 
              type="button" 
              onClick={() => setShowSearch(false)} 
              aria-label="Close Search"
              className="search-close-btn"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </form>
        </div>

        <div className="header__left">
          <button className="mobile-menu-btn" aria-label="Open menu" onClick={() => setIsMobileMenuOpen(true)}>
            <svg className="icon" viewBox="0 0 24 24">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link to="/" className="logo">
            icaregadget<span className="logo__dot">.</span>
          </Link>

          <nav className="desktop-nav">
            <Link to="/">Home</Link>

            {navCategories.map((cat) => {
              if (cat.items.length > 0) {
                return (
                  <div
                    key={cat.id}
                    className="nav-dropdown-wrapper"
                    onMouseEnter={() => handleDropdownEnter(cat.id)}
                    onMouseLeave={handleDropdownLeave}
                  >
                    <Link to={cat.path} className="nav-dropdown-trigger">
                      {cat.title}
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: '4px' }}>
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </Link>
                    <div className={`nav-dropdown ${activeDropdown === cat.id ? 'nav-dropdown--active' : ''}`}>
                      {cat.items.map((item) => (
                        <Link key={item.name} to={item.path} className="nav-dropdown__item" onClick={() => setActiveDropdown(null)}>
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              } else {
                return (
                  <Link key={cat.id} to={cat.path}>{cat.title}</Link>
                );
              }
            })}

            <Link to="/book-appointment" className="nav-highlight">Book Appointment</Link>
          </nav>
        </div>

        <div className="header__right">
          {/* Search Button */}
          <button aria-label="Search" onClick={() => setShowSearch(true)} className="nav-icon-btn">
            <svg className="icon" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>

          {/* User Account / Login Button */}
          {user ? (
            <div ref={userMenuRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                aria-label="User Account Menu"
                className="nav-icon-btn"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer',
                  padding: '4px'
                }}
                title={user.name ? `Signed in as ${user.name}` : 'My Account'}
              >
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: user.role === 'admin' ? '#0f172a' : 'var(--orange)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  overflow: 'hidden'
                }}>
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    (user.name || 'U').charAt(0)
                  )}
                </div>
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '230px',
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.08)',
                  border: '1px solid #e2e8f0',
                  padding: '12px',
                  zIndex: 9999,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <div style={{ padding: '6px 8px', borderBottom: '1px solid #f1f5f9', marginBottom: '4px' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '800', color: '#0f172a' }}>{user.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
                    <span style={{
                      display: 'inline-block',
                      marginTop: '4px',
                      fontSize: '0.65rem',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: user.role === 'admin' ? '#f1f5f9' : '#fff7ed',
                      color: user.role === 'admin' ? '#0f172a' : 'var(--orange)'
                    }}>
                      {user.role === 'admin' ? 'Administrator' : 'Customer Account'}
                    </span>
                  </div>

                  {user.role === 'admin' ? (
                    <Link
                      to="/admin"
                      onClick={() => setShowUserMenu(false)}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '6px', color: '#1e293b', fontSize: '0.85rem', fontWeight: '600', textDecoration: 'none' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                      Admin Dashboard
                    </Link>
                  ) : (
                    <Link
                      to="/account"
                      onClick={() => setShowUserMenu(false)}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '6px', color: '#1e293b', fontSize: '0.85rem', fontWeight: '600', textDecoration: 'none' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                      My Orders & Profile
                    </Link>
                  )}

                  <Link
                    to="/track"
                    onClick={() => setShowUserMenu(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '6px', color: '#1e293b', fontSize: '0.85rem', fontWeight: '600', textDecoration: 'none' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    Track Orders
                  </Link>

                  <div style={{ height: '1px', backgroundColor: '#f1f5f9', margin: '4px 0' }} />

                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                      navigate('/login');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      color: '#ef4444',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link 
              to="/login" 
              aria-label="User Account" 
              className="nav-icon-btn" 
              style={{ color: 'inherit', display: 'flex', alignItems: 'center' }} 
              title="Sign in / Register"
            >
              <svg className="icon" viewBox="0 0 24 24">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </Link>
          )}

          {/* Cart Button */}
          <button aria-label="Open shopping cart" className="nav-icon-btn" style={{ position: 'relative' }} onClick={() => setIsCartOpen(true)}>
            <svg className="icon" viewBox="0 0 24 24">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            {totalItems > 0 && (
              <span style={{ position: 'absolute', top: '-4px', right: '-4px', backgroundColor: 'var(--orange)', color: 'white', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 'bold' }}>
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
