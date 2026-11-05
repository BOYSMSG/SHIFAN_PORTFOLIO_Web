'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Mail, MessageCircle, Instagram, Github, Shield, ExternalLink, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { PORTFOLIO_DATA } from '@/data/portfolioData';

export default function ContactSection() {
  const { socials } = PORTFOLIO_DATA;

  const contactChannels = [
    {
      name: 'Instagram Direct Message',
      handle: '@shifangouri01',
      description: 'Primary channel for direct conversations, quick project inquiries, and personal networking.',
      href: socials.instagram,
      icon: Instagram,
      accent: 'text-pink-600 bg-pink-50 border-pink-100 hover:border-pink-300',
      badge: 'Direct Message',
      actionText: 'Open Instagram Profile',
    },
    {
      name: 'Pokefun Discord Community',
      handle: 'Discord Community Server',
      description: 'Ideal for Minecraft and Cobblemon server questions, community tickets, and real-time collaboration.',
      href: socials.discordPokefun,
      icon: MessageCircle,
      accent: 'text-indigo-600 bg-indigo-50 border-indigo-100 hover:border-indigo-300',
      badge: 'Community Hub',
      actionText: 'Join Discord Server',
    },
    {
      name: 'GitHub Developer Profile',
      handle: 'github.com/BOYSMSG',
      description: 'Explore active code repositories, submit technical discussions, or collaborate on open-source code.',
      href: socials.github,
      icon: Github,
      accent: 'text-slate-800 bg-slate-100 border-slate-200 hover:border-slate-400',
      badge: 'Code & Repos',
      actionText: 'View GitHub Profile',
    },
  ];

  const collaborationTopics = [
    'Minecraft server setup, modpack configurations, and community platform guidance',
    'Modern web application and landing page frontend development',
    'Practical AI-assisted engineering and code verification workflows',
    'General founder questions and networking',
  ];

  return (
    <section id="contact" className="py-24 bg-white relative scroll-mt-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-electric-ice text-electric-blue text-xs font-semibold uppercase tracking-wider mb-3">
            <Mail className="w-3.5 h-3.5" />
            <span>Direct Inquiries &amp; Collaboration</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-midnight-900 tracking-tight">
            Initiate a Discussion or Collaboration
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600">
            Reach out directly through Instagram, Discord, or GitHub for project discussions, community questions, or collaboration.
          </p>
        </div>

        {/* 3 Main Direct Channels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
          {contactChannels.map((channel) => {
            const Icon = channel.icon;

            return (
              <div
                key={channel.name}
                className="flex flex-col justify-between p-6 sm:p-7 rounded-3xl bg-ice-50/70 border border-slate-200/90 hover:border-electric-blue/40 shadow-sm hover:shadow-glass transition-all duration-300 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-transform group-hover:scale-105 ${channel.accent}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                      {channel.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-midnight-900 mb-1 group-hover:text-electric-blue transition-colors">
                    {channel.name}
                  </h3>
                  <p className="text-xs font-mono font-medium text-electric-blue mb-3">
                    {channel.handle}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed mb-6">
                    {channel.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-200/70">
                  <a
                    href={channel.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-electric-blue to-electric-cyan hover:shadow-cyan-glow transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-blue focus-visible:ring-offset-2"
                  >
                    <span>{channel.actionText}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Scope and Verified Response Notice Card */}
        <div className="max-w-4xl mx-auto rounded-3xl bg-white border border-electric-blue/20 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold text-electric-blue uppercase tracking-wider">Communication Policy</span>
              <h3 className="text-xl font-bold text-midnight-900 mt-1">Direct Communication Channels</h3>
              <p className="text-xs text-slate-600 mt-1">
                To streamline communication and avoid unmonitored form queues, all inquiries are received directly through the social and community links above.
              </p>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex-shrink-0">
              <Shield className="w-4 h-4 text-electric-blue" />
              <span>No Automated Sales / Spam</span>
            </div>
          </div>

          <div className="pt-6">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Typical Discussion Topics:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {collaborationTopics.map((topic, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-electric-cyan flex-shrink-0 mt-0.5" />
                  <span>{topic}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
