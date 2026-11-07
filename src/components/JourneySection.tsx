'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { GraduationCap, Milestone, Award, Calendar, BookOpen, ArrowRight, Terminal } from 'lucide-react';
import { PORTFOLIO_DATA } from '@/data/portfolioData';

export default function JourneySection() {
  const { education } = PORTFOLIO_DATA;

  const timelineSteps = [
    {
      period: 'Academic Studies',
      title: 'Formal Computer Science Foundations',
      organization: 'Amity Online · BCA Program',
      statusNote: 'Pursuing BCA (Currently Enrolled)',
      description: 'Strengthening core theoretical foundations in data structures, algorithms, database systems, object-oriented software design, and web technology stacks.',
      icon: GraduationCap,
      accent: 'border-electric-blue text-electric-blue bg-electric-ice/70',
      tag: 'Academic Foundations',
    },
    {
      period: 'Server Management & Ecosystem Growth',
      title: 'Founding & Managing Pokefun Network',
      organization: 'Pokefun SMP & Bedrock Network',
      statusNote: 'Active Founder Venture',
      description: 'Coordinated Minecraft and Cobblemon game server operations, integrated community web links, and supported player store delivery while fostering an engaged community.',
      icon: Milestone,
      accent: 'border-electric-cyanDark text-electric-cyanDark bg-electric-cyan/15',
      tag: 'Pokefun Ecosystem',
    },
    {
      period: 'Family Enterprise Support',
      title: 'Family Business Operations & Systems',
      organization: 'Gouri Fashions',
      statusNote: 'Active Family Business Support',
      description: 'Assisting family business operations, digital catalog presentation, and customer inquiries for men&apos;s tailored formalwear, suits, coats, and custom traditional apparel.',
      icon: Award,
      accent: 'border-amber-500 text-amber-600 bg-amber-50',
      tag: 'Family Enterprise',
    },
    {
      period: 'Modern Full-Stack & Applied AI',
      title: 'AI-Augmented Engineering & Web Platforms',
      organization: 'Independent Engineering & Creative Lab',
      statusNote: 'Current Focus',
      description: 'Building modern Next.js applications, exploring specialized developer tooling, and deploying systematic LLM prompt verification workflows to build resilient software.',
      icon: BookOpen,
      accent: 'border-electric-blue text-electric-blue bg-electric-ice/70',
      tag: 'Full-Stack & AI',
    },
  ];

  return (
    <section id="journey" className="py-24 bg-ice-50 relative border-t border-slate-200/60 scroll-mt-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-electric-blue/30 text-electric-blue text-xs font-semibold uppercase tracking-wider mb-3 shadow-sm">
            <Milestone className="w-3.5 h-3.5" />
            <span>Path &amp; Milestones</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-midnight-900 tracking-tight">
            Academic Journey &amp; Hands-On Evolution
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600">
            A balanced trajectory combining formal academic principles with real production challenges in multiplayer infrastructure, family business, and software platforms.
          </p>
        </div>

        {/* Education Highlight Card */}
        <div className="max-w-4xl mx-auto mb-16 rounded-3xl bg-white border border-electric-blue/25 shadow-glass p-6 sm:p-8 relative overflow-hidden group hover:border-electric-blue/50 transition-all">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-electric-ice to-transparent rounded-bl-full pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-electric-ice border border-electric-blue/30 flex items-center justify-center text-electric-blue group-hover:scale-105 transition-transform">
                <GraduationCap className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-semibold text-electric-blue uppercase tracking-wider">Formal Academic Path</span>
                <h3 className="text-xl font-bold text-midnight-900">{education.institution}</h3>
                <p className="text-sm font-semibold text-slate-700">{education.degree}</p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-600">
              <Calendar className="w-3.5 h-3.5 text-electric-blue" />
              <span>Status: Pursuing / Online Degree</span>
            </div>
          </div>

          <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-600">
            <div>
              <p className="font-semibold text-midnight-900 mb-1">Key Curriculum Emphasis</p>
              <p>{education.focus}</p>
            </div>
            <div>
              <p className="font-semibold text-midnight-900 mb-1">Practical Synthesis</p>
              <p>{education.note}</p>
            </div>
          </div>
        </div>

        {/* Milestone Steps with clean spring physics */}
        <div className="max-w-4xl mx-auto space-y-6">
          {timelineSteps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={idx}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="relative flex flex-col sm:flex-row gap-6 p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-glass hover:border-electric-blue/40 transition-all duration-300 group"
              >
                <div className="flex sm:flex-col items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center group-hover:scale-110 transition-transform ${step.accent}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="hidden sm:block w-0.5 h-full bg-slate-200 rounded-full my-2" />
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {step.tag} · {step.period}
                    </span>
                    <span className="text-xs font-medium text-electric-blue bg-electric-ice/80 px-2.5 py-0.5 rounded-full border border-electric-blue/20">
                      {step.statusNote}
                    </span>
                  </div>

                  <h4 className="text-lg font-bold text-midnight-900 mb-0.5 group-hover:text-electric-blue transition-colors">
                    {step.title}
                  </h4>
                  <p className="text-xs font-semibold text-slate-500 mb-3">
                    {step.organization}
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Live Developer Journal Callout Banner */}
        <div className="max-w-4xl mx-auto mt-12 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-midnight-900 to-[#0e213b] text-white shadow-xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6 border border-electric-blue/30">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-electric-blue/20 border border-electric-cyan/30 text-electric-cyan text-xs font-bold">
              <Terminal className="w-3.5 h-3.5" />
              <span>Real-Time Development Activity</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Looking for Daily Work &amp; Progress Updates?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Explore the public Developer Journal to see what I built today, bugs I resolved, infrastructure upgrades, and live GitHub repositories in real-time.
            </p>
          </div>

          <Link
            href="/journal"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold text-midnight-900 bg-electric-cyan hover:bg-white hover:shadow-[0_0_20px_rgba(0,245,255,0.4)] transition-all flex-shrink-0"
          >
            <span>Open Dev Journal</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </section>
  );
}
