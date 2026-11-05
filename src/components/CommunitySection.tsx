'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Youtube, Instagram, MessageSquare, Github, ExternalLink, Radio } from 'lucide-react';
import { PORTFOLIO_DATA } from '@/data/portfolioData';
import CommunityDiscussions from './CommunityDiscussions';

export default function CommunitySection() {
  const { socials, contentChannels } = PORTFOLIO_DATA;

  const discordLinks = [
    { name: 'Pokefun Community Discord', url: socials.discordPokefun, tag: 'Main Community' },
    { name: 'Pokedrock Discord Hub', url: socials.discordPokedrock, tag: 'Bedrock Modding' },
    { name: 'CobbleDrock Discord', url: socials.discordCobbleDrock, tag: 'Cobblemon Players' },
  ];

  return (
    <section id="community" className="py-24 bg-ice-50 relative border-t border-slate-200/60 scroll-mt-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-electric-blue/30 text-electric-blue text-xs font-semibold uppercase tracking-wider mb-3 shadow-sm">
            <Radio className="w-3.5 h-3.5" />
            <span>Channels &amp; Community</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-midnight-900 tracking-tight">
            Creator Footprint &amp; Player Communities
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600">
            Connecting through content, active gaming discords, open source repositories, and social channels.
          </p>
        </div>

        {/* Content Channels Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {contentChannels.map((ch, idx) => {
            const isYT = ch.platform === 'YouTube';
            return (
              <motion.a
                key={ch.name}
                href={ch.url}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -6 }}
                transition={{ duration: 0.2 }}
                className="group rounded-3xl bg-white border border-slate-200/90 p-6 shadow-sm hover:shadow-glass hover:border-electric-blue/40 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform ${
                      isYT ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-pink-50 text-pink-600 border border-pink-100'
                    }`}>
                      {isYT ? <Youtube className="w-6 h-6" /> : <Instagram className="w-6 h-6" />}
                    </div>
                    <span className="text-[11px] font-medium text-slate-400 group-hover:text-electric-blue flex items-center gap-1 transition-colors">
                      Follow <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-midnight-900 mb-1 group-hover:text-electric-blue transition-colors">
                    {ch.name}
                  </h3>
                  <p className="text-xs font-medium text-slate-500 mb-2">{ch.handle}</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{ch.focus}</p>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-100 text-[11px] text-electric-blue font-semibold">
                  Official {ch.platform} Channel &rarr;
                </div>
              </motion.a>
            );
          })}
        </div>

        {/* Discord & GitHub Hub */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Discords (7 Cols) */}
          <div
            className="lg:col-span-7 rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-midnight-900">Community Discord Servers</h3>
                <p className="text-xs text-slate-500">Real-time player discussion, support tickets, and server announcements</p>
              </div>
            </div>

            <div className="space-y-3">
              {discordLinks.map((disc) => (
                <div
                  key={disc.name}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-ice-50/70 border border-slate-200/70 gap-3 hover:border-indigo-200 transition-colors"
                >
                  <div>
                    <h4 className="text-sm font-bold text-midnight-900">{disc.name}</h4>
                    <span className="text-[11px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      {disc.tag}
                    </span>
                  </div>
                  <a
                    href={disc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white text-indigo-700 hover:bg-indigo-600 hover:text-white border border-slate-200 shadow-sm transition-all"
                  >
                    <span>Join Server</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>

            <p className="mt-4 text-[11px] text-slate-400 italic">
              Note: Discord invite URLs verified from official ecosystem portal links.
            </p>
          </div>

          {/* GitHub Box (5 Cols) */}
          <div
            className="lg:col-span-5 rounded-3xl bg-midnight-900 text-white p-6 sm:p-8 shadow-xl flex flex-col justify-between border border-slate-800"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                  <Github className="w-6 h-6" />
                </div>
                <span className="text-xs font-mono text-electric-cyan">Open Source</span>
              </div>

              <h3 className="text-xl font-bold text-white mb-2">GitHub: @BOYSMSG</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-6">
                Explore codebases, configuration repositories, utility tools, and ongoing software projects.
              </p>

              <div className="p-4 rounded-2xl bg-midnight-800/80 border border-slate-700 space-y-2 text-xs text-slate-300 font-mono">
                <p>&gt; git clone https://github.com/BOYSMSG</p>
                <p>&gt; status: active development</p>
                <p>&gt; stack: Next.js, TS, Java, Modpacks</p>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800 mt-6">
              <a
                href={socials.github}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-midnight-900 bg-white hover:bg-slate-100 transition-colors shadow-sm"
              >
                <span>Visit GitHub Profile</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

        </div>

        {/* Public Community Discussion & Feedback Threads Hub */}
        <CommunityDiscussions />

      </div>
    </section>
  );
}
