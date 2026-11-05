'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Server, ShieldCheck, Sparkles, ExternalLink } from 'lucide-react';
import Hero3DCanvas from './Hero3DCanvas';
import { PORTFOLIO_DATA } from '@/data/portfolioData';

interface HeroProps {
  onNavigate?: (id: string) => void;
}

export default function HeroSection({ onNavigate }: HeroProps) {
  const { profile } = PORTFOLIO_DATA;

  const handleNav = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(id);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="hero"
      className="relative min-h-screen pt-28 pb-20 flex items-center justify-center overflow-hidden bg-gradient-to-b from-ice-50 via-white to-ice-100 scroll-mt-28"
    >
      {/* Refined Three.js Concentric Ripple Scene */}
      <Hero3DCanvas />

      {/* Jitter Ripple Background Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[650px] h-[400px] bg-gradient-to-tr from-electric-ice/60 via-electric-cyan/15 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Positioning & Headline */}
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 text-center lg:text-left flex flex-col items-center lg:items-start"
          >
            {/* Status Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-electric-blue/20 shadow-sm mb-6 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-electric-cyan opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-electric-cyan"></span>
              </span>
              <span className="text-xs font-semibold text-midnight-800">
                Systems Developer
              </span>
              <span className="inline-block w-1 h-1 rounded-full bg-slate-300" />
              <span className="text-xs text-electric-blue font-semibold">
                Founder @ Pokefun
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-midnight-900 leading-[1.14] mb-4">
              Building Systems, <br className="hidden sm:inline" />
              <span className="text-gradient-electric">Scaling Communities</span> &amp; <br className="hidden sm:inline" />
              Engineering with AI.
            </h1>

            {/* Identity & Sub-headline */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-5">
              <span className="text-lg sm:text-xl font-bold text-midnight-900">
                {profile.fullName}
              </span>
              <span className="text-slate-300 font-light">|</span>
              <span className="text-base sm:text-lg font-bold text-electric-blue bg-electric-ice/70 px-2.5 py-0.5 rounded-md border border-electric-blue/15">
                {profile.handle}
              </span>
            </div>

            {/* Positioning Statement */}
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed mb-8">
              {profile.tagline}. Dedicated to hands-on software development, hands-on Minecraft server management, family-business operations at Gouri Fashions, and practical AI-assisted workflows.
            </p>

            {/* CTAs with Ripple micro-animation */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 w-full sm:w-auto">
              <div className="relative group">
                {/* Ripple ring on hover */}
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-electric-blue to-electric-cyan opacity-30 blur group-hover:opacity-60 transition duration-500 group-hover:scale-105" />
                <a
                  href="#projects"
                  onClick={(e) => handleNav('projects', e)}
                  className="relative w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-electric-blue hover:bg-electric-blueHover shadow-md transition-all duration-300 active:scale-95"
                >
                  <span>Explore Systems</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>

              <a
                href="#ventures"
                onClick={(e) => handleNav('ventures', e)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm text-midnight-800 bg-white/95 hover:bg-slate-50 border border-slate-200/90 shadow-sm hover:border-electric-blue/40 transition-all active:scale-95"
              >
                <Server className="w-4 h-4 text-electric-blue" />
                <span>Founder Ecosystem</span>
              </a>

              <a
                href="#contact"
                onClick={(e) => handleNav('contact', e)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm text-slate-600 hover:text-midnight-900 bg-transparent hover:bg-white/70 transition-all"
              >
                <span>Direct Contact</span>
              </a>
            </div>

            {/* Facts Grid */}
            <div className="mt-10 pt-6 border-t border-slate-200/70 w-full grid grid-cols-2 sm:grid-cols-3 gap-4 text-left">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Education</p>
                <p className="text-sm font-bold text-midnight-900 mt-0.5">Amity Online BCA</p>
                <p className="text-[11px] text-slate-500">Pursuing / Foundation</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Venture</p>
                <p className="text-sm font-bold text-midnight-900 mt-0.5">Pokefun SMP</p>
                <p className="text-[11px] text-slate-500">Founder &amp; Community</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Enterprise</p>
                <p className="text-sm font-bold text-midnight-900 mt-0.5">Gouri Fashions</p>
                <p className="text-[11px] text-slate-500">Family Business Ops</p>
              </div>
            </div>

          </motion.div>

          {/* Right Column: Real Rooftop Portrait with Jitter Ripple Frame */}
          <motion.div
            initial={false}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 flex justify-center"
          >
            <div className="relative w-full max-w-md group">
              
              {/* Expanding Ripple Rings Behind Portrait */}
              <div className="absolute -inset-2 rounded-[32px] bg-gradient-to-r from-electric-blue/20 via-electric-cyan/20 to-electric-blue/20 blur-md opacity-60 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Glass Frame Container */}
              <div className="relative rounded-[28px] overflow-hidden bg-white/90 backdrop-blur-xl border border-white/80 shadow-2xl p-3 sm:p-4">
                
                {/* Real Rooftop Portrait Image */}
                <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden bg-slate-100 shadow-inner">
                  <Image
                    src={profile.heroImage}
                    alt="Mohd Shifan Gouri - Golden Hour Rooftop Portrait"
                    fill
                    priority
                    className="object-cover object-top group-hover:scale-102 transition-transform duration-700 ease-out"
                    sizes="(max-width: 768px) 100vw, 440px"
                  />
                  
                  {/* Subtle bottom gradient */}
                  <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-midnight-900/80 via-midnight-900/30 to-transparent" />
                  
                  {/* Overlaid Badge */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white px-3 py-2.5 rounded-xl bg-midnight-900/70 backdrop-blur-md border border-white/10">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-electric-cyan relative">
                        <Image
                          src={profile.avatar}
                          alt="BOYS MSG Logo badge"
                          fill
                          className="object-cover"
                          sizes="32px"
                        />
                      </div>
                      <div>
                        <p className="text-xs font-bold leading-tight">BOYS MSG</p>
                        <p className="text-[10px] text-slate-300">Creator &amp; Founder</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-white px-2.5 py-0.5 rounded bg-electric-blue/60 border border-electric-blue/30">
                      Developer
                    </span>
                  </div>
                </div>

                {/* Sub-card metadata */}
                <div className="mt-3 px-2 py-0.5 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-electric-blue" />
                    Confirmed Facts Only
                  </span>
                  <span className="text-[11px] text-slate-400">Official Profile</span>
                </div>

              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
