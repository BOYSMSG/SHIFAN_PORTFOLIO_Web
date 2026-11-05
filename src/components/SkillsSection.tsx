'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Wrench, Code2, Server, Cpu, Users } from 'lucide-react';
import { PORTFOLIO_DATA } from '@/data/portfolioData';

export default function SkillsSection() {
  const { skills } = PORTFOLIO_DATA;

  const categoryIcons: Record<string, React.ElementType> = {
    'Development & Languages': Code2,
    'Infrastructure & Systems': Server,
    'AI-Assisted Engineering': Cpu,
    'Leadership & Business': Users,
  };

  return (
    <section id="skills" className="py-24 bg-ice-50 relative scroll-mt-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-electric-blue/30 text-electric-blue text-xs font-semibold uppercase tracking-wider mb-3 shadow-sm">
            <Wrench className="w-3.5 h-3.5" />
            <span>Technical Capabilities</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-midnight-900 tracking-tight">
            Technical Stack &amp; Areas of Experience
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600">
            Core tools, languages, and practical areas of experience across web development, server setup, AI workflows, and business operations.
          </p>
        </div>

        {/* 4 Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {skills.map((categoryGroup, idx) => {
            const Icon = categoryIcons[categoryGroup.category] || Wrench;
            return (
              <motion.div
                key={categoryGroup.category}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.2 }}
                className="rounded-3xl bg-white border border-slate-200/90 p-6 shadow-sm hover:shadow-glass hover:border-electric-blue/40 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-electric-ice border border-electric-blue/30 flex items-center justify-center text-electric-blue mb-5 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>

                  <h3 className="text-lg font-bold text-midnight-900 mb-4 group-hover:text-electric-blue transition-colors">
                    {categoryGroup.category}
                  </h3>

                  <ul className="space-y-2.5">
                    {categoryGroup.skills.map((skill) => (
                      <li
                        key={skill.name}
                        className="flex items-center gap-2 text-xs font-medium text-slate-700 p-2 rounded-xl bg-ice-50/70 border border-slate-100 group-hover:border-slate-200 transition-colors"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-electric-cyan flex-shrink-0" />
                        <span>{skill.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
                  Areas of Experience
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
