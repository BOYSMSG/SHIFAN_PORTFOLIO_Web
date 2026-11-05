'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, Server, Code, Cpu, Layers, Clock, ArrowRight } from 'lucide-react';
import { PORTFOLIO_DATA } from '@/data/portfolioData';

interface ServicesProps {
  onNavigate?: (id: string) => void;
}

export default function ServicesSection({ onNavigate }: ServicesProps) {
  const { servicesComingSoon } = PORTFOLIO_DATA;

  const iconMap: Record<string, React.ElementType> = {
    Server: Server,
    Code: Code,
    Cpu: Cpu,
    Layers: Layers,
  };

  return (
    <section id="services" className="py-24 bg-white relative scroll-mt-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold uppercase tracking-wider mb-3">
            <Clock className="w-3.5 h-3.5 text-electric-blue" />
            <span>Consulting &amp; Technical Services</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-midnight-900 tracking-tight">
            Specialized Offerings &mdash; Coming Soon
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600">
            Targeted technical advisories and custom digital solutions currently being prepared. Open to selected early collaborative discussions.
          </p>
        </div>

        {/* Services Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {servicesComingSoon.map((svc, idx) => {
            const Icon = iconMap[svc.icon] || Server;
            return (
              <motion.div
                key={svc.title}
                whileHover={{ y: -6 }}
                className="relative rounded-3xl bg-ice-50/70 border border-slate-200/80 p-6 flex flex-col justify-between hover:border-electric-blue/40 hover:shadow-glass transition-all duration-300 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-electric-blue group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      {svc.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-midnight-900 mb-2 group-hover:text-electric-blue transition-colors">
                    {svc.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {svc.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Scope on request</span>
                  <span className="font-semibold text-slate-500">Unpriced</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Policy Box */}
        <div className="max-w-3xl mx-auto rounded-2xl bg-electric-ice/40 border border-electric-blue/30 p-5 text-center flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="text-left">
            <h4 className="text-sm font-bold text-midnight-900">Need Early Guidance on a Project?</h4>
            <p className="text-xs text-slate-600">We do not publish fixed automated pricing. Direct inquiries are reviewed individually.</p>
          </div>
          <a
            href="#contact"
            onClick={(e) => {
              e.preventDefault();
              if (onNavigate) {
                onNavigate('contact');
              } else {
                document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-electric-blue to-electric-cyan hover:shadow-cyan-glow transition-all flex-shrink-0 active:scale-95"
          >
            <span>Discuss Early Scope</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

      </div>
    </section>
  );
}
