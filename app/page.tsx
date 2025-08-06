'use client';

import { useState, useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

// Dynamically import components with no SSR
const HomeSection = dynamic(() => import('@/components/HomeSection'), { ssr: false });
const AboutSection = dynamic(() => import('@/components/AboutSection'), { ssr: false });
const ServicesSection = dynamic(() => import('@/components/ServicesSection'), { ssr: false });
const NewsSection = dynamic(() => import('@/components/NewsSection'), { ssr: false });
const SubscriptionSection = dynamic(() => import('@/components/SubscriptionSection'), { ssr: false });
const ContactSection = dynamic(() => import('@/components/ContactSection'), { ssr: false });
const BottomMenu = dynamic(() => import('@/components/BottomMenu'), { ssr: false });
const MapSection = dynamic(() => import('@/components/MapSection'), { ssr: false });
const FooterSection = dynamic(() => import('@/components/FooterSection'), { ssr: false });
const ExpandableChatDemo = dynamic(() => import('@/components/ExpandableChatDemo').then(mod => mod.ExpandableChatDemo), { ssr: false });


export default function Home() {
  const [showMap, setShowMap] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  
  const handleMapClick = () => setShowMap((v) => !v);

  useEffect(() => {
    if (showMap) {
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 350); // Wait for map to render and animate
    }
  }, [showMap]);

  return (
    <>
      <HomeSection />
      <AboutSection />
      <ServicesSection />
      <NewsSection />
      <SubscriptionSection />
      <ContactSection />
      <BottomMenu onMapClick={handleMapClick} />
      <AnimatePresence>
        {showMap && (
          <div ref={mapRef}>
            <MapSection key="map-section" />
          </div>
        )}
      </AnimatePresence>
      <FooterSection />
      <ExpandableChatDemo />
    </>
  );
}
