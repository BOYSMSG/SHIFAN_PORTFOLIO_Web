'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface TechStageWrapperProps {
  id: string;
  stageCode: string;
  stageName: string;
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
}

export default function TechStageWrapper({
  id,
  stageCode,
  stageName,
  children,
  className = '',
  dark = false,
}: TechStageWrapperProps) {
  return (
    <section
      id={id}
      className={`relative scroll-mt-20 overflow-hidden ${
        dark ? 'bg-midnight-900 text-white' : 'bg-white text-midnight-900'
      } ${className}`}
    >
      {/* Background Holographic Grid Accent */}
      <div className={`absolute inset-0 pointer-events-none opacity-40 ${dark ? 'bg-tech-dots' : 'bg-tech-grid'}`} />

      {/* High-Tech Stage Header Banner Indicator */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-2 relative z-10 flex items-center justify-between pointer-events-none select-none">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
            dark ? 'bg-midnight-800 text-electric-cyan border border-electric-cyan/30' : 'bg-electric-ice text-electric-blue border border-electric-blue/20'
          }`}>
            // STAGE {stageCode}
          </span>
          <span className={`text-[11px] font-mono font-semibold tracking-wider ${
            dark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            {stageName}
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-electric-cyan animate-pulse-subtle" />
          <span>STATUS: SYNCED</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Subtle Bottom Stage Divider Line */}
      <div className="absolute bottom-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-electric-blue/20 to-transparent pointer-events-none" />
    </section>
  );
}
