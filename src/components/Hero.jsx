import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="hero">
      <div className="container hero__inner">
        <div className="hero__content animate-in">
          <div className="hero__eyebrow">NEW IN STORE</div>
          <h1 className="hero__title">Gadgets worth<br />the upgrade.</h1>
          <p className="hero__text">Mobiles, audio and accessories from a shop you can walk into. Now online.</p>
          <div className="hero__actions">
            <Link to="/search" className="btn btn--primary">Shop Now</Link>
            <a href="#new-arrivals" className="btn btn--secondary">Explore New Arrivals</a>
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                  <path d="M3 6h18" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                Shop Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
