import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const WORDS = [
  'the upgrade.',
  'every rupee.',
  'your trust.',
  'the hype.',
];

export default function Hero() {
  const [wordIndex, setWordIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = WORDS[wordIndex];
    let timer;

    if (!isDeleting && displayedText === currentWord) {
      // Pause on completed word before backspacing
      timer = setTimeout(() => {
        setIsDeleting(true);
      }, 2200);
    } else if (isDeleting && displayedText === '') {
      // Move to next word after completely deleting
      setIsDeleting(false);
      setWordIndex((prev) => (prev + 1) % WORDS.length);
      timer = setTimeout(() => {}, 350);
    } else {
      // Typing or deleting characters
      const speed = isDeleting ? 45 : 90;
      timer = setTimeout(() => {
        setDisplayedText((prev) =>
          isDeleting
            ? currentWord.substring(0, prev.length - 1)
            : currentWord.substring(0, prev.length + 1)
        );
      }, speed);
    }

    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, wordIndex]);

  // Render the orange brand dot if text ends with a period
  const renderContent = () => {
    if (displayedText.endsWith('.')) {
      return (
        <>
          {displayedText.slice(0, -1)}
          <span className="hero__typewriter-dot">.</span>
        </>
      );
    }
    return displayedText;
  };

  return (
    <section className="hero">
      <div className="container hero__inner">
        <div className="hero__content animate-in">
          <div className="hero__eyebrow">NEW IN STORE</div>
          <h1 className="hero__title">
            Gadgets worth<br />
            <span className="hero__typewriter-wrapper">
              <span className="hero__typewriter-text">{renderContent()}</span>
              <span className="hero__typewriter-cursor">|</span>
            </span>
          </h1>
          <p className="hero__text">Mobiles, audio and accessories from a shop you can walk into. Now online.</p>
          <div className="hero__actions">
            <a href="#new-arrivals" className="hero__action-btn">
              <span className="hero__action-text-wrapper">
                <span className="hero__action-text">Explore New Arrivals</span>
                <span className="hero__action-text hero__action-text--clone" aria-hidden="true">Explore New Arrivals</span>
              </span>
              <span className="hero__action-arrow-wrapper">
                <svg className="hero__action-arrow hero__action-arrow--primary" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
                <svg className="hero__action-arrow hero__action-arrow--clone" aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </span>
            </a>
            <a href="#best-sellers" className="hero__action-btn">
              <span className="hero__action-text-wrapper">
                <span className="hero__action-text">Best Sellers</span>
                <span className="hero__action-text hero__action-text--clone" aria-hidden="true">Best Sellers</span>
              </span>
              <span className="hero__action-arrow-wrapper">
                <svg className="hero__action-arrow hero__action-arrow--primary" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
                <svg className="hero__action-arrow hero__action-arrow--clone" aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </span>
            </a>
          </div>
        </div>
        <div className="hero__image-wrapper animate-in" style={{ animationDelay: '0.1s' }}>
          <div className="hero__image-container hero__video-container">
            <video 
              autoPlay 
              loop 
              muted 
              playsInline
              poster="/hero-image.jpg"
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }}
            >
              <source src="https://cdn.pixabay.com/video/2024/02/11/200217-912416250_large.mp4" type="video/mp4" />
              {/* Fallback image if video fails */}
              <img src="/hero-image.jpg" alt="Premium Tech Gadgets" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
            </video>
            <div className="hero__video-overlay">
              <Link to="/search" className="btn btn--primary hero__video-btn">
                <svg className="hero__video-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ marginRight: '6px', flexShrink: 0 }}>
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                  <path d="M3 6h18" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                <span>Shop Now</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
