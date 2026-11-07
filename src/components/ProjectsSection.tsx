'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, ExternalLink, CheckCircle, RotateCw, Sparkles, Server, ArrowRight } from 'lucide-react';
import { PORTFOLIO_DATA } from '@/data/portfolioData';

export default function ProjectsSection() {
  const { projects } = PORTFOLIO_DATA;
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  // Track which card is flipped in 3D
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  const categories = ['All', 'Founder Venture', 'Minecraft Architecture', 'Web & Platform'];

  const filteredProjects = selectedCategory === 'All'
    ? projects
    : projects.filter((p) => p.category === selectedCategory);

  const toggleFlip = (id: string) => {
    setFlippedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section id="projects" className="py-24 bg-white relative scroll-mt-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-electric-ice text-electric-blue text-xs font-semibold uppercase tracking-wider mb-3">
              <Layers className="w-3.5 h-3.5" />
              <span>Projects &amp; Ventures</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-midnight-900 tracking-tight">
              Featured Systems &amp; Platforms
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Interactive project cards. Click any card or the flip button to view project details, my role, and technologies used.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${
                  selectedCategory === cat
                    ? 'bg-electric-blue text-white shadow-md shadow-electric-blue/20 scale-105'
                    : 'bg-ice-100 text-slate-600 hover:bg-slate-200/70 hover:text-midnight-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 3D Flip Project Grid (Jitter Card Flip) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <AnimatePresence>
            {filteredProjects.map((project) => {
              const isFlipped = !!flippedCards[project.id];

              return (
                <div
                  key={project.id}
                  className="relative min-h-[440px] [perspective:1200px]"
                >
                  <motion.div
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                    className="relative w-full h-full [transform-style:preserve-3d] cursor-pointer"
                    onClick={() => toggleFlip(project.id)}
                  >
                    {/* FRONT OF CARD */}
                    <div className="absolute inset-0 [backface-visibility:hidden] flex flex-col rounded-3xl bg-white border border-slate-200/90 hover:border-electric-blue/40 shadow-sm hover:shadow-glass transition-all duration-300 overflow-hidden">
                      {project.image ? (
                        <div className="relative w-full aspect-video bg-slate-900 overflow-hidden">
                          <Image
                            src={project.image}
                            alt={`${project.title} Preview Art`}
                            fill
                            className="object-cover transition-transform duration-500 hover:scale-105"
                            sizes="(max-width: 768px) 100vw, 600px"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-midnight-900/80 via-transparent to-transparent" />
                          <div className="absolute top-4 left-4">
                            <span className="px-3 py-1 rounded-lg text-xs font-bold bg-white/95 backdrop-blur-md text-midnight-900 shadow-sm">
                              {project.badge || project.category}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 pb-0 flex items-center justify-between">
                          <span className="px-3 py-1 rounded-lg text-xs font-bold bg-electric-ice text-electric-blue border border-electric-blue/20">
                            {project.badge || project.category}
                          </span>
                        </div>
                      )}

                      <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h3 className="text-xl sm:text-2xl font-bold text-midnight-900">
                              {project.title}
                            </h3>
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-electric-blue bg-electric-ice px-2 py-0.5 rounded-md">
                              <RotateCw className="w-3 h-3" /> Flip
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-electric-cyanDark uppercase tracking-wider mb-2">
                            {project.tagline}
                          </p>
                          <div className="flex items-center gap-1.5 mb-3">
                            <span className="text-[11px] font-medium text-slate-500">Role:</span>
                            <span className="text-[11px] font-bold text-electric-blue bg-electric-ice px-2 py-0.5 rounded-md border border-electric-blue/20">
                              {project.role}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 leading-relaxed mb-4">
                            {project.description}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex flex-wrap gap-1.5">
                            {project.techStack.slice(0, 3).map((tech) => (
                              <span
                                key={tech}
                                className="px-2 py-0.5 rounded text-[11px] font-medium bg-ice-50 text-slate-700 border border-slate-200"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                          <span className="text-xs font-semibold text-electric-blue flex items-center gap-1">
                            View Details &rarr;
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* BACK OF CARD (REVEALED ON 3D FLIP) */}
                    <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-3xl bg-midnight-900 text-white p-7 sm:p-8 flex flex-col justify-between border border-electric-cyan/30 shadow-2xl">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-electric-blue/20 text-electric-cyan border border-electric-cyan/30">
                            Project Details &amp; Highlights
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFlip(project.id);
                            }}
                            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white"
                          >
                            <RotateCw className="w-3.5 h-3.5" /> Flip Back
                          </button>
                        </div>

                        <h3 className="text-xl font-bold text-white mb-0.5">
                          {project.title}
                        </h3>
                        <p className="text-xs text-electric-cyan font-mono mb-2">
                          Role: {project.role}
                        </p>
                        <p className="text-xs text-slate-400 mb-5">
                          {project.description}
                        </p>

                        <div className="space-y-3 mb-6">
                          {project.highlights.map((item, idx) => (
                            <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                              <CheckCircle className="w-4 h-4 text-electric-cyan flex-shrink-0 mt-0.5" />
                              <span className="leading-relaxed">{item}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {project.techStack.map((tech) => (
                            <span
                              key={tech}
                              className="px-2.5 py-1 rounded text-[11px] font-mono bg-midnight-800 text-slate-300 border border-slate-700"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-6 border-t border-slate-800 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          {project.url && (
                            <a
                              href={project.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-midnight-900 bg-white hover:bg-slate-100 transition-colors"
                            >
                              <span>Live Site</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <Link
                            href={`/projects/${project.id === 'pokefun' ? 'pokefun-network' : project.id === 'cobbledrock' ? 'cobbledrock' : project.id === 'pokedrock' ? 'pokedrock' : 'ai-workflow-engine'}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-electric-cyan border border-electric-cyan/40 hover:bg-electric-cyan hover:text-midnight-900 transition-colors"
                          >
                            <span>Case Study</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                        <span className="text-[11px] text-slate-400">Click to flip</span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Explore All Projects Banner Button */}
        <div className="mt-14 text-center">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-electric-blue to-electric-cyan hover:shadow-cyan-glow transition-all duration-300"
          >
            <Layers className="w-4 h-4" />
            <span>Explore All Projects &amp; Ventures Gallery</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </section>
  );
}
