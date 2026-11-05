'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, ExternalLink, CheckCircle2, ShoppingBag, Gamepad2, Layers, ArrowRight } from 'lucide-react';
import { PORTFOLIO_DATA } from '@/data/portfolioData';

export default function VenturesSection() {
  const { ventures } = PORTFOLIO_DATA;
  const [activeStackIndex, setActiveStackIndex] = useState(0);

  return (
    <section id="ventures" className="py-24 bg-midnight-900 text-white relative overflow-hidden scroll-mt-28">
      {/* Background ambient light */}
      <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-electric-blue/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full bg-electric-cyan/15 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-midnight-800 border border-electric-cyan/30 text-electric-cyan text-xs font-semibold uppercase tracking-wider mb-3">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Ventures &amp; Operations</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Founder Leadership &amp; Enterprise Governance
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300">
            Real organizational experience spanning community server architecture and traditional retail operations.
          </p>

          {/* Stack Selector Pills (The Stack Navigation) */}
          <div className="flex justify-center gap-3 mt-8">
            {ventures.map((v, idx) => (
              <button
                key={v.title}
                onClick={() => setActiveStackIndex(idx)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                  activeStackIndex === idx
                    ? 'bg-electric-blue text-white shadow-lg shadow-electric-blue/30 scale-105'
                    : 'bg-midnight-800 text-slate-400 hover:text-white hover:bg-midnight-700'
                }`}
              >
                {idx === 0 ? <Gamepad2 className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />}
                <span>{v.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* JITTER "THE STACK" ANIMATION CONTAINER */}
        <div className="relative max-w-4xl mx-auto min-h-[460px] flex items-center justify-center">
          {ventures.map((venture, idx) => {
            const isTop = activeStackIndex === idx;
            const isBehind = !isTop;

            return (
              <motion.div
                key={venture.title}
                animate={{
                  scale: isTop ? 1 : 0.94,
                  y: isTop ? 0 : 24,
                  zIndex: isTop ? 20 : 10,
                  opacity: isTop ? 1 : 0.45,
                }}
                transition={{
                  duration: 0.6,
                  ease: [0.16, 1, 0.3, 1],
                }}
                onClick={() => setActiveStackIndex(idx)}
                className={`absolute inset-x-0 rounded-3xl p-8 sm:p-10 border transition-colors shadow-2xl cursor-pointer ${
                  isTop
                    ? idx === 0
                      ? 'bg-midnight-800 border-electric-blue/50 shadow-electric-blue/10'
                      : 'bg-midnight-800 border-amber-500/50 shadow-amber-500/10'
                    : 'bg-midnight-800/80 border-slate-700 pointer-events-auto'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                    idx === 0
                      ? 'bg-electric-blue/20 text-electric-cyan border-electric-cyan/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}>
                    {idx === 0 ? <Gamepad2 className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />}
                    <span>{venture.type}</span>
                  </span>
                  <span className="text-xs text-slate-400 font-medium">{venture.tag}</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-1">
                  {venture.title}
                </h3>
                <p className={`text-sm font-semibold mb-5 ${idx === 0 ? 'text-electric-blue' : 'text-amber-400'}`}>
                  {venture.role}
                </p>

                <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6">
                  {venture.description}
                </p>

                <div className="space-y-3 mb-8">
                  {venture.details.map((detail, dIdx) => (
                    <div key={dIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200">
                      <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${idx === 0 ? 'text-electric-cyan' : 'text-amber-400'}`} />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-slate-700/80 flex items-center justify-between">
                  <a
                    href={venture.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className={`inline-flex items-center gap-2 text-xs font-bold transition-colors ${
                      idx === 0 ? 'text-electric-cyan hover:text-white' : 'text-amber-300 hover:text-white'
                    }`}
                  >
                    <span>{venture.linkText}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <span className="text-xs text-slate-400">
                    {idx === 0 ? 'pokefun.in' : 'gourifashions.com'}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
