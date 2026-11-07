'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ExternalLink,
  Github,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Code,
  Tag,
  FolderGit2,
} from 'lucide-react';
import type { ProjectRecord, ProjectCategory, ProjectStatus } from '@/lib/supabase';

interface Props {
  initialProjects: ProjectRecord[];
}

const CATEGORIES: string[] = [
  'All',
  'Founder Venture',
  'Minecraft Architecture',
  'Web & Platform',
  'Open Source',
  'Infrastructure',
];

const STATUS_LABELS: Record<ProjectStatus, { label: string; color: string; bg: string }> = {
  active: { label: 'Active / Live', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  in_development: { label: 'In Development', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  completed: { label: 'Completed', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  planning: { label: 'Planning', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  paused: { label: 'Paused', color: 'text-slate-600', bg: 'bg-slate-100 border-slate-200' },
  archived: { label: 'Archived', color: 'text-slate-500', bg: 'bg-slate-50 border-slate-200' },
};

export default function ProjectsClientGallery({ initialProjects }: Props) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filtered = initialProjects.filter((p) => {
    if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
    if (selectedStatus !== 'all' && p.status !== selectedStatus) return false;
    return true;
  });

  return (
    <div>
      {/* Filters Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                type="button"
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  selectedCategory === cat
                    ? 'bg-electric-blue text-white shadow-sm'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Status selector */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-slate-400 font-medium">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-electric-blue"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active / Live</option>
              <option value="in_development">In Development</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 p-8">
          <FolderGit2 className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">No projects found</h3>
          <p className="text-xs text-slate-500 mt-1">Try selecting a different filter above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {filtered.map((project) => {
            const statusConfig = STATUS_LABELS[project.status] || STATUS_LABELS.active;

            return (
              <div
                key={project.id}
                className="group bg-white rounded-3xl border border-slate-200/90 hover:border-electric-blue/40 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden"
              >
                <div>
                  {/* Project Cover / Banner */}
                  <div className="relative h-48 sm:h-56 w-full bg-slate-900 overflow-hidden">
                    {project.cover_image ? (
                      <Image
                        src={project.cover_image}
                        alt={project.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#0B1524] via-[#102038] to-[#1677FF]/20 flex items-center justify-center">
                        <FolderGit2 className="w-16 h-16 text-electric-blue/30" />
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    {/* Badges on Top of Cover */}
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold text-white bg-black/50 backdrop-blur-md border border-white/20">
                        {project.category}
                      </span>

                      <div className="flex items-center gap-2">
                        {project.is_featured && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold text-white bg-electric-blue shadow-sm">
                            <Sparkles className="w-3 h-3" />
                            Featured
                          </span>
                        )}
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border backdrop-blur-md ${statusConfig.bg} ${statusConfig.color}`}
                        >
                          {statusConfig.label}
                        </span>
                      </div>
                    </div>

                    {/* Role Overlay Bottom */}
                    <div className="absolute bottom-3 left-4 right-4 text-xs font-semibold text-slate-200 truncate">
                      Role: <span className="text-electric-cyan font-bold">{project.role}</span>
                    </div>
                  </div>

                  {/* Project Content Body */}
                  <div className="p-6">
                    <h3 className="text-xl sm:text-2xl font-black text-midnight-900 group-hover:text-electric-blue transition-colors">
                      <Link href={`/projects/${project.slug}`}>{project.name}</Link>
                    </h3>

                    <p className="text-xs font-semibold text-slate-500 mt-1">{project.tagline}</p>

                    <p className="text-sm text-slate-600 mt-3 leading-relaxed line-clamp-3">
                      {project.short_description}
                    </p>

                    {/* Key Highlights */}
                    {project.highlights && project.highlights.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                        {project.highlights.slice(0, 3).map((hl, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2 text-xs text-slate-600 leading-snug"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-electric-blue flex-shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{hl}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Tech Badges */}
                    {project.technologies && project.technologies.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {project.technologies.slice(0, 5).map((tech) => (
                          <span
                            key={tech}
                            className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700"
                          >
                            {tech}
                          </span>
                        ))}
                        {project.technologies.length > 5 && (
                          <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-md text-slate-400">
                            +{project.technologies.length - 5}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action Links */}
                <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {project.demo_url && (
                      <a
                        href={project.demo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-electric-blue transition-colors"
                        title="Open Live Website / Platform"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Live Site</span>
                      </a>
                    )}

                    {project.github_url && (
                      <a
                        href={project.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-electric-blue transition-colors"
                        title="View GitHub Repository"
                      >
                        <Github className="w-3.5 h-3.5" />
                        <span>GitHub</span>
                      </a>
                    )}
                  </div>

                  <Link
                    href={`/projects/${project.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-electric-blue hover:text-electric-cyan hover:underline transition-colors"
                  >
                    <span>Case Study</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
