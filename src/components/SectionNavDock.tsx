'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface DockProps {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
}

const SECTIONS = [
  { id: 'hero', label: 'Hero' },
  { id: 'about', label: 'About & Ethos' },
  { id: 'journey', label: 'Education & Timeline' },
  { id: 'projects', label: 'Featured Systems' },
  { id: 'ventures', label: 'Ventures' },
  { id: 'skills', label: 'Skills Arsenal' },
  { id: 'services', label: 'Services' },
  { id: 'community', label: 'Community' },
  { id: 'contact', label: 'Contact' },
];

export default function SectionNavDock({ activeSection, onNavigate }: DockProps) {
  return (
    <aside
      aria-label="Section Navigation Dock"
      className="hidden xl:flex fixed right-6 top-1/2 -translate-y-1/2 z-40 flex-col items-end gap-2.5 select-none pointer-events-auto"
    >
      <div className="flex flex-col items-end gap-2 p-2 rounded-2xl bg-white/70 backdrop-blur-xl border border-electric-blue/15 shadow-glass">
        {SECTIONS.map((sec) => {
          const isActive = activeSection === sec.id;

          return (
            <button
              key={sec.id}
              onClick={() => onNavigate(sec.id)}
              className="group flex items-center gap-2.5 py-1 px-1.5 rounded-lg focus:outline-none"
              aria-label={`Jump to ${sec.label}`}
            >
              {/* Tooltip Label (slides out on hover) */}
              <span className="hidden group-hover:block text-[11px] font-semibold text-midnight-900 bg-white/95 px-2.5 py-0.5 rounded-md shadow-sm border border-slate-200 pointer-events-none transition-all">
                {sec.label}
              </span>

              {/* Indicator Dot / Pill */}
              <span
                className={`transition-all duration-300 rounded-full ${
                  isActive
                    ? 'w-5 h-2 bg-gradient-to-r from-electric-blue to-electric-cyan shadow-sm'
                    : 'w-2 h-2 bg-slate-300 group-hover:bg-electric-blue group-hover:scale-125'
                }`}
              />
            </button>
          );
        })}
      </div>
    </aside>
  );
}
