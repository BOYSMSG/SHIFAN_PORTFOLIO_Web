'use client';

import React, { useState, useEffect } from 'react';
import CinematicIntro from '@/components/CinematicIntro';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import AboutSection from '@/components/AboutSection';
import JourneySection from '@/components/JourneySection';
import ProjectsSection from '@/components/ProjectsSection';
import VenturesSection from '@/components/VenturesSection';
import SkillsSection from '@/components/SkillsSection';
import ServicesSection from '@/components/ServicesSection';
import CommunitySection from '@/components/CommunitySection';
import ContactSection from '@/components/ContactSection';
import Footer from '@/components/Footer';
import SectionNavDock from '@/components/SectionNavDock';
import FeedbackModal from '@/components/FeedbackModal';

const SECTION_IDS = [
  'hero',
  'about',
  'journey',
  'projects',
  'ventures',
  'skills',
  'services',
  'community',
  'contact',
] as const;

export default function Home() {
  const [activeSection, setActiveSection] = useState('hero');
  const isNavigatingRef = React.useRef<{ targetId: string; targetY: number } | null>(null);
  const scrollIdleTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const maxSafetyTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Release navigation lock and clear timers
  const releaseNavigationLock = React.useCallback(() => {
    isNavigatingRef.current = null;
    if (scrollIdleTimerRef.current) {
      clearTimeout(scrollIdleTimerRef.current);
      scrollIdleTimerRef.current = null;
    }
    if (maxSafetyTimerRef.current) {
      clearTimeout(maxSafetyTimerRef.current);
      maxSafetyTimerRef.current = null;
    }
  }, []);

  // Determine active section using focal line reading calibration (140px below top)
  const determineActiveSection = React.useCallback(() => {
    // If programmatic smooth scrolling is active, preserve target section
    if (isNavigatingRef.current) return;

    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    // 1. Top of page anchor -> Hero
    if (scrollY < 120) {
      setActiveSection('hero');
      return;
    }

    // 2. Bottom of page anchor -> Contact
    if (windowHeight + scrollY >= documentHeight - 60) {
      setActiveSection('contact');
      return;
    }

    // 3. Focal-line detection: 140px from viewport top (below floating navbar)
    const focalY = 140;
    let matchedSection: string | null = null;

    for (const id of SECTION_IDS) {
      const el = document.getElementById(id);
      if (!el) continue;

      const rect = el.getBoundingClientRect();
      if (rect.top <= focalY && rect.bottom > focalY) {
        matchedSection = id;
        break;
      }
    }

    // 4. Fallback: closest section top to focal line
    if (!matchedSection) {
      let minDistance = Infinity;
      let closestId = 'hero';

      for (const id of SECTION_IDS) {
        const el = document.getElementById(id);
        if (!el) continue;

        const rect = el.getBoundingClientRect();
        const distance = Math.abs(rect.top - focalY);
        if (distance < minDistance) {
          minDistance = distance;
          closestId = id;
        }
      }
      matchedSection = closestId;
    }

    setActiveSection(matchedSection);
  }, []);

  const handleNavigate = React.useCallback(
    (id: string, updateHistory = true) => {
      const isTargetHero = id === 'hero';
      const element = isTargetHero ? null : document.getElementById(id);

      if (!isTargetHero && !element) return;

      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // 88px offset accounts for 56px navbar + 32px breathing padding
      const targetTop = isTargetHero
        ? 0
        : Math.max(0, element!.getBoundingClientRect().top + window.scrollY - 88);

      // Immediately set visual active state
      setActiveSection(id);
      isNavigatingRef.current = { targetId: id, targetY: targetTop };

      // Update browser history (supports browser Back/Forward navigation)
      if (updateHistory && typeof window !== 'undefined') {
        try {
          const newHash = `#${id}`;
          if (window.location.hash !== newHash) {
            window.history.pushState(null, '', newHash);
          }
        } catch {}
      }

      // Reset any pending timers
      if (scrollIdleTimerRef.current) clearTimeout(scrollIdleTimerRef.current);
      if (maxSafetyTimerRef.current) clearTimeout(maxSafetyTimerRef.current);

      // Perform smooth or instant scroll
      window.scrollTo({
        top: targetTop,
        behavior: prefersReduced ? 'instant' : 'smooth',
      });

      if (prefersReduced) {
        releaseNavigationLock();
        return;
      }

      // Safety ceiling: release lock after 2000ms max even on extremely long scrolls
      maxSafetyTimerRef.current = setTimeout(() => {
        releaseNavigationLock();
        determineActiveSection();
      }, 2000);
    },
    [determineActiveSection, releaseNavigationLock]
  );

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      // If navigating, check if we reached destination or settled
      if (isNavigatingRef.current) {
        const currentY = window.scrollY;
        const targetY = isNavigatingRef.current.targetY;

        // Destination reached within 3px
        if (Math.abs(currentY - targetY) <= 3) {
          releaseNavigationLock();
          determineActiveSection();
          return;
        }

        // Debounced idle detection: if scroll event ceases for 120ms, scrolling has finished
        if (scrollIdleTimerRef.current) clearTimeout(scrollIdleTimerRef.current);
        scrollIdleTimerRef.current = setTimeout(() => {
          releaseNavigationLock();
          determineActiveSection();
        }, 120);
        return;
      }

      if (!ticking) {
        window.requestAnimationFrame(() => {
          determineActiveSection();
          ticking = false;
        });
        ticking = true;
      }
    };

    // Native scrollend support (modern browsers)
    const handleScrollEnd = () => {
      if (isNavigatingRef.current) {
        releaseNavigationLock();
        determineActiveSection();
      }
    };

    // User interruption handler: if user scrolls via wheel, touch or keydown, immediately cancel lock
    const handleUserInterruption = (e: Event) => {
      if (isNavigatingRef.current) {
        // If user scrolls manually while programmatic navigation is in flight, release lock immediately
        releaseNavigationLock();
      }
    };

    // Browser back/forward navigation support
    const handlePopState = () => {
      const hash = window.location.hash.replace('#', '') || 'hero';
      if (SECTION_IDS.includes(hash as any)) {
        handleNavigate(hash, false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('scrollend', handleScrollEnd as EventListener, { passive: true });
    window.addEventListener('wheel', handleUserInterruption, { passive: true });
    window.addEventListener('touchstart', handleUserInterruption, { passive: true });
    window.addEventListener('keydown', handleUserInterruption, { passive: true });
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);

    // Initial load hash detection
    if (typeof window !== 'undefined' && window.location.hash) {
      const initialHash = window.location.hash.replace('#', '');
      if (SECTION_IDS.includes(initialHash as any)) {
        setTimeout(() => handleNavigate(initialHash, false), 150);
      }
    } else {
      determineActiveSection();
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scrollend', handleScrollEnd as EventListener);
      window.removeEventListener('wheel', handleUserInterruption);
      window.removeEventListener('touchstart', handleUserInterruption);
      window.removeEventListener('keydown', handleUserInterruption);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
      releaseNavigationLock();
    };
  }, [determineActiveSection, handleNavigate, releaseNavigationLock]);

  return (
    <div className="relative min-h-screen flex flex-col bg-ice-50 selection:bg-electric-cyan/30 selection:text-midnight-900">
      {/* 2.4s Fast Luxury Cinematic Intro Reveal */}
      <CinematicIntro />

      {/* Slim Floating Glass Navigation */}
      <Navbar activeSection={activeSection} onNavigate={handleNavigate} />

      {/* Minimalist Right Edge Section Dot Dock */}
      <SectionNavDock activeSection={activeSection} onNavigate={handleNavigate} />

      {/* Main Content Landmarks */}
      <main className="flex-1">
        {/* 1. Hero with Concentric Ripple Waves & Real Rooftop Portrait */}
        <HeroSection onNavigate={handleNavigate} />

        {/* 2. About & Jitter 'The Edit' Nested Images Collage */}
        <AboutSection />

        {/* 3. Journey & Education (Amity Online BCA) */}
        <JourneySection />

        {/* 4. Featured Projects with Jitter '3D Card Flip' Architecture Specs */}
        <ProjectsSection />

        {/* 5. Ventures with Jitter 'The Stack' Interactive Layered Cards */}
        <VenturesSection />

        {/* 6. Skills & Technical Arsenal */}
        <SkillsSection />

        {/* 7. Services — Coming Soon */}
        <ServicesSection onNavigate={handleNavigate} />

        {/* 8. Creator Footprint, YouTube & Communities */}
        <CommunitySection />

        {/* 9. Direct Inquiries & Contact Path */}
        <ContactSection />
      </main>

      {/* 10. Footer with Disclaimers & Top Navigation */}
      <Footer />

      {/* 11. Subtle Visitor Feedback Interaction Modal */}
      <FeedbackModal />
    </div>
  );
}
