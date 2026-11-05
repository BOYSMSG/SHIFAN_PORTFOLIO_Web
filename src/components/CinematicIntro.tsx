'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function CinematicIntro() {
  // Always initialize true to match server SSR and prevent hydration mismatch
  const [visible, setVisible] = useState(true);

  const dismiss = () => {
    try {
      sessionStorage.setItem('shifan_intro_dismissed', 'true');
    } catch {}
    document.body.style.overflow = '';
    setVisible(false);
  };

  useEffect(() => {
    // If opening with a deep hash anchor (e.g. #community, #projects), suppress intro to jump straight to section
    if (typeof window !== 'undefined' && window.location.hash && window.location.hash.length > 1) {
      setVisible(false);
      document.body.style.overflow = '';
      return;
    }

    // If already dismissed in this tab session (e.g. reload), suppress in post-hydration effect
    try {
      if (sessionStorage.getItem('shifan_intro_dismissed') === 'true') {
        setVisible(false);
        document.body.style.overflow = '';
        return;
      }
    } catch {}

    // Mark as dismissed for subsequent reloads within this tab
    try {
      sessionStorage.setItem('shifan_intro_dismissed', 'true');
    } catch {}

    // Prevent background scrolling while intro is visible
    document.body.style.overflow = 'hidden';

    // Auto-dismiss smoothly after 1.5 seconds (~37.5% faster, avoiding prolonged holding)
    const timer = setTimeout(() => {
      dismiss();
    }, 1500);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          id="cinematic-intro-overlay"
          key="electric-luxury-intro"
          initial={{ opacity: 1 }}
          exit={{
            y: '-100%',
            opacity: 0.95,
            transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
          }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-b from-ice-50 via-white to-ice-100 overflow-hidden select-none"
        >
          {/* 1. JITTER RIPPLE EFFECT — Expanding Concentric Luxury Waves */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {[1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                initial={false}
                animate={{
                  scale: [0.2, 1.8 + i * 0.4],
                  opacity: [0.45, 0],
                }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  delay: i * 0.45,
                  ease: [0.215, 0.61, 0.355, 1],
                }}
                className={`absolute rounded-full border ${
                  i % 2 === 0
                    ? 'border-electric-blue/25 w-[380px] h-[380px]'
                    : 'border-electric-cyan/35 w-[320px] h-[320px]'
                }`}
              />
            ))}

            {/* Glowing Ethereal Ambient Halos (Electric Blue + Cyan) */}
            <motion.div
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.4, 0.6, 0.4],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-electric-ice via-electric-cyan/20 to-electric-blue/15 blur-3xl pointer-events-none"
            />
          </div>

          {/* 2. Central Luxury Monogram & Content Reveal */}
          <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-xl w-full">
            
            {/* Avatar Emblem with Glowing Ring */}
            <motion.div
              initial={false}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="relative mb-6"
            >
              <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-electric-blue via-electric-cyan to-electric-blue opacity-70 blur-md animate-pulse-subtle" />
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-white bg-white shadow-xl">
                <Image
                  src="/assets/boysmsg.png"
                  alt="BOYS MSG Emblem"
                  fill
                  priority
                  className="object-cover"
                  sizes="96px"
                />
              </div>
            </motion.div>

            {/* Staggered Name Reveal (Apple Keynote Masked Text) */}
            <div className="overflow-hidden mb-2">
              <motion.h1
                initial={false}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="text-3xl sm:text-5xl font-extrabold tracking-tight text-midnight-900"
              >
                MOHD SHIFAN GOURI
              </motion.h1>
            </div>

            {/* Glowing Animated Divider Beam */}
            <div className="w-44 h-[2px] bg-gradient-to-r from-transparent via-electric-blue to-transparent my-3 rounded-full" />

            {/* Handle & Positioning */}
            <div className="overflow-hidden mb-6">
              <motion.div
                initial={false}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center justify-center gap-2 flex-wrap"
              >
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-electric-ice text-electric-blue border border-electric-blue/20">
                  BOYS MSG
                </span>
                <span className="text-xs font-semibold tracking-wider uppercase text-slate-500">
                  Developer · Founder · Creator
                </span>
              </motion.div>
            </div>

            {/* Interactive "Enter Portfolio" Pill Button */}
            <motion.button
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              onClick={dismiss}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-electric-blue to-electric-cyan hover:shadow-cyan-glow transition-all duration-300 shadow-md active:scale-95 cursor-pointer pointer-events-auto"
            >
              <span>Explore Portfolio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          </div>

          {/* Top Right Quick Skip Button */}
          <button
            onClick={dismiss}
            className="absolute top-6 right-6 z-20 text-xs font-semibold text-slate-400 hover:text-electric-blue bg-white/80 hover:bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm transition-all pointer-events-auto cursor-pointer"
          >
            Skip Intro &rarr;
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
