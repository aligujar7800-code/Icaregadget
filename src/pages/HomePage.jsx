import React from 'react';
import Hero from '../components/Hero';
import TrustBenefits from '../components/TrustBenefits';
import NewArrivalsSection from '../components/NewArrivalsSection';
import BestSellersSection from '../components/BestSellersSection';
import VisitStore from '../components/VisitStore';
import Reveal from '../components/Reveal';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <Reveal><TrustBenefits /></Reveal>
      <Reveal><NewArrivalsSection /></Reveal>
      <Reveal><BestSellersSection /></Reveal>
      <Reveal><VisitStore /></Reveal>
    </main>
  );
}
