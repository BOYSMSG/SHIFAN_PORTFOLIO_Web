'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { User, Video, Code2, Globe, HeartHandshake, Sparkles } from 'lucide-react';
import { PORTFOLIO_DATA } from '@/data/portfolioData';

export default function AboutSection() {
  const { profile } = PORTFOLIO_DATA;

  return (
    <section id="about" className="py-24 bg-white relative scroll-mt-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-electric-ice text-electric-blue text-xs font-semibold uppercase tracking-wider mb-3">
            <User className="w-3.5 h-3.5" />
            <span>Profile &amp; Background</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-midnight-900 tracking-tight">
            About Mohd Shifan Gouri
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Hands-on developer, Minecraft server founder, and operations partner in our family business. I focus on building functional web applications, managing community game servers, and using pragmatic AI workflows to write, review, and debug clean code.
          </p>
        </div>

        {/* Narrative & Video Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Story (7 Cols) */}
          <div className="lg:col-span-7 space-y-6 text-slate-700 leading-relaxed text-base">
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="p-6 sm:p-7 rounded-3xl bg-ice-50/80 border border-slate-200/80 shadow-sm hover:border-electric-blue/30 transition-colors"
            >
              <h3 className="text-lg font-bold text-midnight-900 mb-2 flex items-center gap-2">
                <Code2 className="w-5 h-5 text-electric-blue" />
                Minecraft Server Management &amp; Web Development
              </h3>
              <p>
                I founded the Pokefun community and handle daily game server setups, mod compatibility, and Linux system maintenance. Alongside server operations, I build clean, responsive web platforms and player portals using React, Next.js, and TypeScript, keeping systems practical, stable, and player-focused.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="p-6 sm:p-7 rounded-3xl bg-ice-50/80 border border-slate-200/80 shadow-sm hover:border-amber-400/40 transition-colors"
            >
              <h3 className="text-lg font-bold text-midnight-900 mb-2 flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-amber-500" />
                Family Business Operations at Gouri Fashions
              </h3>
              <p>
                Outside of tech, I actively assist with <strong className="text-midnight-900">Gouri Fashions</strong>, our family retail business specializing in men&apos;s tailored formalwear, suits, coats, and occasion apparel. My work includes inventory coordination, digital presentation, and customer communication—giving me valuable real-world grounding in business discipline and daily operational responsibility.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="p-6 sm:p-7 rounded-3xl bg-ice-50/80 border border-slate-200/80 shadow-sm hover:border-electric-cyanDark/40 transition-colors"
            >
              <h3 className="text-lg font-bold text-midnight-900 mb-2 flex items-center gap-2">
                <Globe className="w-5 h-5 text-electric-cyanDark" />
                Practical AI Tooling, Code Review &amp; Verification
              </h3>
              <p>
                I don&apos;t claim to build complex ML models. Instead, I use modern AI tools pragmatically: designing clear prompt workflows, selecting the right models for specific development tasks, and critically reviewing every line of AI-generated code. My emphasis is always on thorough verification, manual debugging, and ensuring the final software is clean and reliable.
              </p>
            </motion.div>
          </div>

          {/* Video Placeholder Card (5 Cols) */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-electric-blue/25 bg-gradient-to-b from-ice-100 to-white p-6 shadow-glass relative overflow-hidden group">
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-midnight-800 text-xs font-semibold border border-slate-200 shadow-sm">
                  <Video className="w-3.5 h-3.5 text-electric-blue" />
                  Introduction Video
                </span>
                <span className="text-[11px] font-mono text-slate-400">Owner Media Slot</span>
              </div>

              {/* Video Preview Frame */}
              <div className="relative aspect-video rounded-2xl bg-midnight-900 border border-slate-800 flex flex-col items-center justify-center text-center p-6 text-white overflow-hidden group-hover:border-electric-cyan/40 transition-colors">
                <div className="w-14 h-14 rounded-full bg-electric-blue/20 border border-electric-cyan/40 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Video className="w-6 h-6 text-electric-cyan" />
                </div>
                <h4 className="text-sm font-bold text-slate-100 mb-1">Personal Introduction Video</h4>
                <p className="text-xs text-slate-400 max-w-xs">
                  A personal video introduction by Mohd Shifan Gouri will be added here soon.
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200/60 text-xs text-slate-500 flex items-center justify-between">
                <span>Personal introduction &amp; journey</span>
                <span className="font-bold text-electric-blue">Coming Soon</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
