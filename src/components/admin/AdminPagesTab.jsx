import React, { useState, useEffect } from 'react';

export default function AdminPagesTab() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSlug, setActiveSlug] = useState('about-us');
  const [currentTitle, setCurrentTitle] = useState('');
  const [currentContent, setCurrentContent] = useState('');
  const [saveStatus, setSaveStatus] = useState('');

  const defaultSlugs = [
    { slug: 'about-us', label: 'About Us' },
    { slug: 'privacy-policy', label: 'Privacy Policy' },
    { slug: 'terms-and-conditions', label: 'Terms & Conditions' },
    { slug: 'shipping-policy', label: 'Shipping Policy' },
    { slug: 'return-refund-policy', label: 'Return & Refund Policy' },
    { slug: 'faqs', label: 'FAQs' }
  ];

  const fetchPages = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/pages');
      if (res.ok) {
        const data = await res.json();
        setPages(Array.isArray(data) ? data : []);
        const current = (data || []).find(p => p.slug === activeSlug);
        if (current) {
          setCurrentTitle(current.title || '');
          setCurrentContent(current.content || '');
        }
      }
    } catch (err) {
      console.error('Error fetching pages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const handleSelectSlug = (slug) => {
    setActiveSlug(slug);
    setSaveStatus('');
    const found = pages.find(p => p.slug === slug);
    if (found) {
      setCurrentTitle(found.title || '');
      setCurrentContent(found.content || '');
    } else {
      const def = defaultSlugs.find(s => s.slug === slug);
      setCurrentTitle(def ? def.label : slug);
      setCurrentContent('');
    }
  };

  const handleSavePage = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaveStatus('Saving page...');
      const res = await fetch(`/api/pages/${activeSlug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: currentTitle,
          content: currentContent
        })
      });

      if (res.ok) {
        setSaveStatus('Page published to storefront!');
        setPages(prev => {
          const idx = prev.findIndex(p => p.slug === activeSlug);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...next[idx], title: currentTitle, content: currentContent };
            return next;
          }
          return [...prev, { slug: activeSlug, title: currentTitle, content: currentContent }];
        });
        setTimeout(() => setSaveStatus(''), 3000);
      }
    } catch (err) {
      setSaveStatus('Error saving page');
    }
  };

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '16px', border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: '#111827' }}>Store Pages & Content (CMS)</h2>
          <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#6b7280' }}>Edit store policy articles, FAQs, Terms, and About Us pages rendered on the public storefront</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: '600' }}>{saveStatus}</span>
          <button
            type="button"
            onClick={handleSavePage}
            style={{ padding: '6px 14px', borderRadius: '6px', backgroundColor: '#111827', color: '#ffffff', border: 'none', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
          >
            Publish Page
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '16px', alignItems: 'start' }}>
        
        {/* Navigation Sidebar of Pages */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', paddingLeft: '8px' }}>
            Store Pages
          </span>
          {defaultSlugs.map(s => {
            const isActive = activeSlug === s.slug;
            return (
              <button
                key={s.slug}
                type="button"
                onClick={() => handleSelectSlug(s.slug)}
                style={{
                  textAlign: 'left',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: isActive ? '#ffedd5' : 'transparent',
                  color: isActive ? '#ea580c' : '#334155',
                  fontSize: '11.5px',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer'
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Content Editor */}
        <form onSubmit={handleSavePage} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
              Page Title
            </label>
            <input
              type="text"
              value={currentTitle}
              onChange={e => setCurrentTitle(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12.5px', fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
              Page Content (Supports plain text, bullet points, and paragraphs)
            </label>
            <textarea
              rows={14}
              value={currentContent}
              onChange={e => setCurrentContent(e.target.value)}
              placeholder="Write the full content of this policy or informational page..."
              style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', lineHeight: 1.6, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              style={{ padding: '8px 20px', borderRadius: '6px', backgroundColor: '#ea580c', color: '#ffffff', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
            >
              Save & Publish Changes
            </button>
          </div>
        </form>

      </div>

    </div>
  );
}
