import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  ChevronRight,
  ArrowLeft,
  ExternalLink,
  Github,
  BookOpen,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  Terminal,
  Pin,
  Clock,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MarkdownContent from '@/components/MarkdownContent';
import GitHubRepoCard from '@/components/GitHubRepoCard';
import { getProjectBySlug } from '@/lib/supabase';

interface Props {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { project } = await getProjectBySlug(slug);

  if (!project) {
    return {
      title: 'Project Not Found | Mohd Shifan Gouri',
    };
  }

  const pageUrl = `https://shifan.pokefun.in/projects/${project.slug}`;
  const images = project.cover_image ? [{ url: project.cover_image }] : [];

  return {
    title: `${project.name} — ${project.tagline} | Mohd Shifan Gouri`,
    description: project.short_description,
    openGraph: {
      title: `${project.name} | Mohd Shifan Gouri`,
      description: project.short_description,
      url: pageUrl,
      type: 'website',
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title: project.name,
      description: project.short_description,
      images: project.cover_image ? [project.cover_image] : undefined,
    },
    alternates: {
      canonical: pageUrl,
    },
  };
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const { project, relatedJournal } = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const pageUrl = `https://shifan.pokefun.in/projects/${project.slug}`;

  // Structured Data (JSON-LD)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: project.name,
    description: project.short_description,
    applicationCategory: project.category,
    author: {
      '@type': 'Person',
      name: 'Mohd Shifan Gouri',
      alternateName: 'BOYS MSG',
    },
    url: project.demo_url || pageUrl,
    image: project.cover_image || undefined,
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 antialiased selection:bg-electric-blue selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Navbar activeSection="projects" />

      <main className="pt-28 pb-20 px-4 sm:px-6 max-w-5xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between gap-4 mb-6 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 min-w-0">
            <Link href="/" className="hover:text-electric-blue transition-colors flex-shrink-0">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
            <Link href="/projects" className="hover:text-electric-blue transition-colors flex-shrink-0">
              Projects
            </Link>
            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="text-slate-800 font-semibold truncate">{project.name}</span>
          </div>

          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-electric-blue transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Projects</span>
          </Link>
        </div>

        {/* Case Study Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          {/* Header Cover Banner */}
          {project.cover_image && (
            <div className="relative h-64 sm:h-96 w-full bg-slate-900">
              <Image
                src={project.cover_image}
                alt={project.name}
                fill
                priority
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            </div>
          )}

          {/* Hero Content Section */}
          <div className="p-6 sm:p-10">
            {/* Top Badges */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs mb-4">
              <span className="px-3 py-1 rounded-full font-bold text-white bg-midnight-900">
                {project.category}
              </span>

              {project.is_featured && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full font-extrabold text-white bg-electric-blue">
                  <Sparkles className="w-3 h-3" />
                  Featured
                </span>
              )}

              <span className="px-3 py-1 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Status: {project.status.replace('_', ' ').toUpperCase()}
              </span>

              <span className="text-slate-400 ml-auto flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Since {project.start_date}
              </span>
            </div>

            {/* Title & Tagline */}
            <h1 className="text-3xl sm:text-5xl font-black text-midnight-900 tracking-tight leading-tight">
              {project.name}
            </h1>
            <p className="mt-2 text-base sm:text-xl font-medium text-slate-500">
              {project.tagline}
            </p>

            {/* Role & Links Action Bar */}
            <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  My Contribution & Role
                </span>
                <span className="font-extrabold text-slate-900 text-sm sm:text-base">
                  {project.role}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {project.demo_url && (
                  <a
                    href={project.demo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-electric-blue to-electric-cyan hover:shadow-md transition-all"
                  >
                    <span>Launch Live Site</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}

                {project.github_url && (
                  <a
                    href={project.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-800 bg-white border border-slate-200 hover:border-slate-300 transition-all shadow-sm"
                  >
                    <Github className="w-3.5 h-3.5" />
                    <span>View Repository</span>
                  </a>
                )}

                {project.docs_url && (
                  <a
                    href={project.docs_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-800 bg-white border border-slate-200 hover:border-slate-300 transition-all shadow-sm"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Documentation</span>
                  </a>
                )}
              </div>
            </div>

            {/* GitHub Repo Live Badge if applicable */}
            {project.github_url && (
              <div className="mt-6">
                <GitHubRepoCard repoUrl={project.github_url} />
              </div>
            )}

            {/* Architecture Highlights */}
            {project.highlights && project.highlights.length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Architecture & Engineering Highlights
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {project.highlights.map((hl, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs sm:text-sm text-slate-700"
                    >
                      <CheckCircle2 className="w-4 h-4 text-electric-blue flex-shrink-0 mt-0.5" />
                      <span>{hl}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Technologies */}
            {project.technologies && project.technologies.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Technologies & System Components
                </h3>
                <div className="flex flex-wrap gap-2">
                  {project.technologies.map((t) => (
                    <span
                      key={t}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-electric-ice text-electric-blue border border-electric-blue/20"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Description / Markdown */}
            {project.full_description && (
              <div className="mt-8 pt-8 border-t border-slate-100">
                <MarkdownContent content={project.full_description} />
              </div>
            )}
          </div>
        </div>

        {/* Related Work Journal Updates Section */}
        {relatedJournal && relatedJournal.length > 0 && (
          <section className="mt-14">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-electric-blue uppercase tracking-wider">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Engineering Logs</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-midnight-900">
                  Related Work Journal Updates
                </h2>
              </div>

              <Link
                href="/journal"
                className="text-xs sm:text-sm font-bold text-electric-blue hover:underline"
              >
                View all updates →
              </Link>
            </div>

            <div className="space-y-4">
              {relatedJournal.map((entry) => (
                <Link
                  key={entry.id}
                  href={`/journal/${entry.slug}`}
                  className="group block p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-electric-blue/40 hover:shadow-md transition-all"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mb-2">
                    <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {entry.category}
                    </span>
                    <span>
                      {new Date(entry.published_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-electric-blue transition-colors">
                    {entry.title}
                  </h3>

                  <p className="mt-1 text-xs sm:text-sm text-slate-600 line-clamp-2">
                    {entry.summary}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
