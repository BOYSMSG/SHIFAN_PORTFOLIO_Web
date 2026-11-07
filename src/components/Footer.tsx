'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUp, Github, Instagram, Youtube, Heart } from 'lucide-react';
import { PORTFOLIO_DATA } from '@/data/portfolioData';

export default function Footer() {
  const { profile, socials } = PORTFOLIO_DATA;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-midnight-900 text-slate-400 py-16 border-t border-slate-800 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-slate-800">
          
          {/* Identity & Mission (5 Cols) */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-electric-cyan relative">
                <Image
                  src={profile.avatar}
                  alt="BOYS MSG Logo"
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              </div>
              <div>
                <span className="font-extrabold text-white text-base tracking-tight">
                  MOHD SHIFAN GOURI
                </span>
                <p className="text-xs text-electric-cyan font-mono">{profile.handle} · {profile.subdomain}</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Engineering high-scale server environments, modern web architectures, applied AI workflows, and supporting family business operations.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <a
                href={socials.github}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-midnight-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href={socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-midnight-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={socials.youtubePersonal}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-midnight-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Nav (3 Cols) */}
          <div className="md:col-span-3 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Portfolio Map</h4>
            <ul className="space-y-1.5 text-xs">
              <li><Link href="#about" className="hover:text-electric-cyan transition-colors">About &amp; Ethos</Link></li>
              <li><Link href="#journey" className="hover:text-electric-cyan transition-colors">Journey &amp; Education</Link></li>
              <li><Link href="#projects" className="hover:text-electric-cyan transition-colors">Featured Systems</Link></li>
              <li><Link href="#ventures" className="hover:text-electric-cyan transition-colors">Ventures &amp; Operations</Link></li>
              <li><Link href="#skills" className="hover:text-electric-cyan transition-colors">Skills Arsenal</Link></li>
              <li><Link href="#services" className="hover:text-electric-cyan transition-colors">Services (Coming Soon)</Link></li>
              <li><Link href="#community" className="hover:text-electric-cyan transition-colors">Creator &amp; Communities</Link></li>
              <li><Link href="#contact" className="hover:text-electric-cyan transition-colors">Contact Path</Link></li>
            </ul>
          </div>

          {/* Verified Entities & External (4 Cols) */}
          <div className="md:col-span-4 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Associated Entities</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="https://pokefun.in/team" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center justify-between">
                  <span>Pokefun SMP Network</span>
                  <span className="text-[10px] font-mono text-electric-blue">Founder Ecosystem</span>
                </a>
              </li>
              <li>
                <a href="http://gourifashions.com/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center justify-between">
                  <span>Gouri Fashions</span>
                  <span className="text-[10px] font-mono text-amber-400">Family Business</span>
                </a>
              </li>
              <li>
                <a href="https://cobblemon.pokefun.in/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center justify-between">
                  <span>CobbleDrock Mod Platform</span>
                  <span className="text-[10px] font-mono text-slate-500">Live Service</span>
                </a>
              </li>
              <li>
                <a href="https://pokedrock.pokefun.in/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center justify-between">
                  <span>PokeDrock Documentation Hub</span>
                  <span className="text-[10px] font-mono text-slate-500">Live Service</span>
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Line & Legal Notice */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div className="space-y-1">
            <p>&copy; {new Date().getFullYear()} Mohd Shifan Gouri (BOYS MSG). All rights reserved.</p>
            <p className="text-[10px] text-slate-500">
              Privacy Notice: This website uses privacy-friendly telemetry (Umami) with zero cross-site tracking and never stores raw visitor IP addresses. Guest feedback tokens are securely stored in HTTP-only cookies.
            </p>
          </div>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-midnight-800 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white transition-all text-xs"
          >
            <span>Back to top</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </footer>
  );
}
