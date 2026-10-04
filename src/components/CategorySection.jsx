import React from 'react';
import { Link } from 'react-router-dom';

export default function CategorySection() {
  const categories = [
    {
      id: 'mobiles',
      name: 'Mobiles',
      icon: (
        <svg className="category-card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
          <path d="M12 18h.01" />
        </svg>
      )
    },
    {
      id: 'audio',
      name: 'Audio',
      icon: (
        <svg className="category-card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
          <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
        </svg>
      )
    },
    {
      id: 'accessories',
      name: 'Accessories',
      icon: (
        <svg className="category-card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 22v-5" />
          <path d="M9 8V2" />
          <path d="M15 8V2" />
          <path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z" />
        </svg>
      )
    },
    {
      id: 'smart-home',
      name: 'Smart home',
      icon: (
        <svg className="category-card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      )
    }
  ];

  return (
    <section className="section" id="categories">
      <div className="container">
        <div className="section__header">
          <h2 className="section__title">Shop by category</h2>
        </div>
        <div className="category-grid">
          {categories.map((cat) => (
            <Link key={cat.id} to={`/${cat.id}`} className="category-card">
              {cat.icon}
              <div className="category-card__bottom">
                <span className="category-card__title">{cat.name}</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
