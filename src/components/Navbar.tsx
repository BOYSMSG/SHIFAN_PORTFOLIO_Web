'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PORTFOLIO_DATA } from '@/data/portfolioData';

interface NavbarProps {
  activeSection?: string;
  onNavigate?: (id: string) => void;
}

const NAV_LINKS = [
  { label: 'About', id: 'about' },
  { label: 'Journal', id: 'journal', href: '/journal' },
  { label: 'Projects', id: 'projects', href: '/projects' },
  { label: 'Journey', id: 'journey' },
  { label: 'Ventures', id: 'ventures' },
  { label: 'Skills', id: 'skills' },
  { label: 'Services', id: 'services' },
  { label: 'Community', id: 'community' },
  { label: 'Contact', id: 'contact' },
];

export default function Navbar({ activeSection = 'hero', onNavigate }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const drawerRef = useRef<HTMLDivElement>(null);
  const hamburgerBtnRef = useRef<HTMLButtonElement>(null);
  const focusTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeDrawer = useCallback(() => {
    setMobileMenuOpen(false);
    document.body.style.overflow = '';
    
    // Clean up any pending timer and schedule reliable focus restoration to hamburger button
    if (focusTimerRef.current) {
      clearTimeout(focusTimerRef.current);
    }
    focusTimerRef.current = setTimeout(() => {
      hamburgerBtnRef.current?.focus();
      focusTimerRef.current = null;
    }, 50);
  }, []);

  // Accessibility: Handle Escape key & Focus Trapping
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!mobileMenuOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        closeDrawer();
        return;
      }

      // Keyboard Focus Trap inside the mobile drawer
      if (e.key === 'Tab' && drawerRef.current) {
        const focusables = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const firstEl = focusables[0];
        const lastEl = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl.focus();
          }
        } else {
          if (document.activeElement === lastEl) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen, closeDrawer]);

  // Accessibility: Lock background body scroll and manage initial focus
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';

      // Clear any pending timer before setting focus inside drawer
      if (focusTimerRef.current) {
        clearTimeout(focusTimerRef.current);
      }
      focusTimerRef.current = setTimeout(() => {
        if (drawerRef.current) {
          const firstFocusable = drawerRef.current.querySelector<HTMLElement>(
            'button, [href], [tabindex]:not([tabindex="-1"])'
          );
          firstFocusable?.focus();
        }
        focusTimerRef.current = null;
      }, 60);

      return () => {
        document.body.style.overflow = '';
        if (focusTimerRef.current) {
          clearTimeout(focusTimerRef.current);
          focusTimerRef.current = null;
        }
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [mobileMenuOpen]);

  // Unmount cleanup
  useEffect(() => {
    return () => {
      if (focusTimerRef.current) {
        clearTimeout(focusTimerRef.current);
      }
      document.body.style.overflow = '';
    };
  }, []);

  const handleLinkClick = (id: string, href?: string, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (onNavigate) {
      onNavigate(id);
    } else {
      const element = document.getElementById(id);
      if (element) {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const targetTop = Math.max(0, element.getBoundingClientRect().top + window.scrollY - 88);
        window.scrollTo({ top: targetTop, behavior: prefersReduced ? 'instant' : 'smooth' });
      } else if (href) {
        window.location.href = href;
      } else {
        window.location.href = `/${id === 'hero' ? '' : '#' + id}`;
      }
    }
    if (mobileMenuOpen) {
      closeDrawer();
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-3 sm:py-3.5 px-4 sm:px-6 xl:px-8 flex justify-center pointer-events-none">
        <nav
          aria-label="Main Navigation"
          className={`w-full max-w-6xl mx-auto flex items-center justify-between px-3.5 sm:px-5 h-14 rounded-2xl transition-all duration-300 pointer-events-auto flex-nowrap ${
            scrolled
              ? 'bg-white/80 backdrop-blur-xl border border-electric-blue/15 shadow-[0_4px_24px_-2px_rgba(22,119,255,0.08),0_2px_8px_-1px_rgba(0,0,0,0.03)]'
              : 'bg-white/70 backdrop-blur-lg border border-slate-200/70 shadow-[0_2px_16px_rgba(0,0,0,0.03)]'
          }`}
        >
          {/* 1. Brand Area (Left) */}
          <a
            href="#hero"
            onClick={(e) => handleLinkClick('hero', undefined, e)}
            className="flex items-center gap-2.5 flex-shrink-0 group rounded-lg py-1 pr-2 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-blue focus-visible:ring-offset-2"
          >
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-electric-cyan/70 shadow-sm transition-transform duration-300 group-hover:scale-105 flex-shrink-0">
              <Image
                src={PORTFOLIO_DATA.profile.avatar}
                alt="BOYS MSG Avatar"
                fill
                className="object-cover"
                sizes="32px"
                priority
              />
            </div>
            <div className="flex flex-col leading-tight whitespace-nowrap">
              <span className="font-extrabold tracking-tight text-midnight-900 text-sm group-hover:text-electric-blue transition-colors">
                BOYS MSG
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Mohd Shifan Gouri
              </span>
            </div>
          </a>

          {/* 2. Center Navigation Links (Desktop: 1024px, 1280px, 1365px, 1440px, 1920px) */}
          <div className="hidden lg:flex items-center justify-center gap-0.5 xl:gap-1.5 flex-nowrap min-w-0">
            {NAV_LINKS.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.id}
                  href={link.href || `#${link.id}`}
                  onClick={(e) => handleLinkClick(link.id, link.href, e)}
                  className={`relative px-2 lg:px-2.5 xl:px-3 py-1.5 rounded-xl text-xs xl:text-[13px] font-medium transition-all duration-200 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-blue focus-visible:ring-offset-1 ${
                    isActive
                      ? 'text-electric-blue font-semibold'
                      : 'text-slate-600 hover:text-midnight-900 hover:bg-slate-100/60'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavPill"
                      className="absolute inset-0 bg-electric-ice/80 border border-electric-blue/15 rounded-xl -z-10 shadow-sm"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  {link.label}
                </a>
              );
            })}
          </div>

          {/* 3. Right CTA Button */}
          <div className="hidden sm:flex items-center flex-shrink-0">
            <a
              href="#contact"
              onClick={(e) => handleLinkClick('contact', undefined, e)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 xl:px-4 xl:py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-electric-blue to-electric-cyan hover:shadow-[0_0_18px_rgba(0,201,216,0.28)] transition-all duration-300 active:scale-95 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-blue focus-visible:ring-offset-2"
            >
              <span>Let&apos;s Connect</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Mobile & Tablet Hamburger Toggle */}
          <div className="lg:hidden flex items-center">
            <button
              ref={hamburgerBtnRef}
              onClick={() => {
                if (mobileMenuOpen) {
                  closeDrawer();
                } else {
                  setMobileMenuOpen(true);
                }
              }}
              type="button"
              className="p-1.5 rounded-xl text-slate-700 hover:text-electric-blue hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-blue focus-visible:ring-offset-2"
              aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation-drawer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Drawer Menu & Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Accessible Backdrop Dimmer */}
            <motion.div
              initial={false}
              animate={{ opacity: 1 }}
              onClick={closeDrawer}
              className="lg:hidden fixed inset-0 bg-midnight-900/25 backdrop-blur-sm z-40"
              aria-hidden="true"
            />

            {/* Floating Glass Mobile Drawer with Focus Trap */}
            <motion.div
              id="mobile-navigation-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile Navigation Menu"
              ref={drawerRef}
              initial={false}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ y: -6, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="lg:hidden fixed inset-x-4 top-20 bg-white/95 backdrop-blur-2xl border border-electric-blue/20 rounded-2xl shadow-xl p-4 z-50 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 px-1">
                <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                  Menu
                </span>
                <span className="text-[11px] font-medium text-electric-blue">
                  shifan.pokefun.in
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {NAV_LINKS.map((link) => {
                  const isActive = activeSection === link.id;
                  return (
                    <button
                      key={link.id}
                      onClick={() => handleLinkClick(link.id, link.href)}
                      className={`text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-blue ${
                        isActive
                          ? 'bg-electric-ice text-electric-blue border border-electric-blue/20'
                          : 'text-slate-700 hover:bg-slate-100/80'
                      }`}
                    >
                      {link.label}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleLinkClick('contact')}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-electric-blue to-electric-cyan shadow-sm active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-blue focus-visible:ring-offset-2"
                >
                  <span>Let&apos;s Connect</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
