import React, { useRef, useEffect, useState } from 'react';

export default function TrustBenefits() {
  const [isVisible, setIsVisible] = useState(false);
  const [customerCount, setCustomerCount] = useState(0);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.2,
        rootMargin: '0px 0px -20px 0px',
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) observer.unobserve(sectionRef.current);
    };
  }, []);

  // Number increasing counter animation for 10,000+ Happy Customers
  useEffect(() => {
    if (!isVisible) return;

    const duration = 1800; // 1.8s smooth duration
    const target = 10000;
    const startTime = performance.now();

    const animateCount = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // easeOutExpo easing curve for energetic start and silky smooth landing
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.floor(ease * target);
      setCustomerCount(current);

      if (progress < 1) {
        requestAnimationFrame(animateCount);
      } else {
        setCustomerCount(target);
      }
    };

    const frameId = requestAnimationFrame(animateCount);
    return () => cancelAnimationFrame(frameId);
  }, [isVisible]);

  return (
    <section className={`trust ${isVisible ? 'trust--active' : ''}`} ref={sectionRef}>
      <div className="container">
        <div className="trust__grid">
          {/* 1. Free Cash on Delivery: S curve first, then vertical cut line */}
          <div className="trust__item">
            <div className="trust__icon trust__icon--dollar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {/* S curve draws first */}
                <path
                  className="dollar-curve"
                  d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
                />
                {/* Cut line draws through S second */}
                <path
                  className="dollar-line"
                  d="M12 2v20"
                />
              </svg>
            </div>
            <div className="trust__title">Free Cash<br />on Delivery</div>
          </div>

          {/* 2. 10,000+ Happy Customers: Smooth counting animation */}
          <div className="trust__item">
            <div className="trust__icon trust__icon--customers">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="trust__title">
              <span className="trust__counter">{customerCount.toLocaleString()}+</span>
              <br />Happy Customers
            </div>
          </div>

          {/* 3. 6-Month Warranty: Shield draws, then checkmark tick pops */}
          <div className="trust__item">
            <div className="trust__icon trust__icon--warranty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path
                  className="shield-outline"
                  d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                />
                <path
                  className="shield-tick"
                  d="m9 12 2 2 4-4"
                />
              </svg>
            </div>
            <div className="trust__title">6-Month<br />Warranty</div>
          </div>
        </div>
      </div>
    </section>
  );
}
