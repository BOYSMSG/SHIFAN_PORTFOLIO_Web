import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  Calendar,
  Clock,
  Pin,
  ChevronRight,
  ArrowLeft,
  ExternalLink,
  Layers,
  Eye,
  GitBranch,
  Terminal,
  Bookmark,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MarkdownContent from '@/components/MarkdownContent';
import GitHubRepoCard from '@/components/GitHubRepoCard';
import JournalShareButtons from './JournalShareButtons';
import {
  getJournalEntryBySlug,
  incrementJournalViews,
  getProjectBySlug,
  getPublicJournalEntries,
} from '@/lib/supabase';

interface Props {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60; // Revalidate every 60 seconds

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getJournalEntryBySlug(slug, false);

  if (!entry) {
    return {
      title: 'Update Not Found | Mohd Shifan Gouri',
    };
  }

  const pageUrl = `https://shifan.pokefun.in/journal/${entry.slug}`;
  const images = entry.cover_image ? [{ url: entry.cover_image }] : [];

  return {
    title: `${entry.title} | Mohd Shifan Gouri (BOYS MSG)`,
    description: entry.summary,
    openGraph: {
      title: entry.title,
      description: entry.summary,
      url: pageUrl,
      type: 'article',
      publishedTime: entry.published_at,
      authors: ['Mohd Shifan Gouri (BOYS MSG)'],
      tags: entry.tags,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title: entry.title,
      description: entry.summary,
      images: entry.cover_image ? [entry.cover_image] : undefined,
    },
    alternates: {
      canonical: pageUrl,
    },
  };
}

export default async function JournalSlugPage({ params }: Props) {
  const { slug } = await params;
  const entry = await getJournalEntryBySlug(slug, false);

  if (!entry) {
    notFound();
  }

  // Increment views
  incrementJournalViews(slug).catch(() => {});

  // Fetch linked project if any
  let relatedProject = null;
  if (entry.project_id) {
    const pData = await getProjectBySlug(entry.project_id);
    relatedProject = pData.project;
  }

  // Fetch recent updates for recommendations
  const recentFeed = await getPublicJournalEntries(1, 4);
  const otherUpdates = recentFeed.entries.filter((e) => e.slug !== entry.slug).slice(0, 3);

  const words = entry.content.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  const readTimeStr = `${minutes} min read`;

  const dateStr = new Date(entry.published_at).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const pageUrl = `https://shifan.pokefun.in/journal/${entry.slug}`;

  // Structured Data (JSON-LD)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: entry.title,
    description: entry.summary,
    image: entry.cover_image || undefined,
    datePublished: entry.published_at,
    author: {
      '@type': 'Person',
      name: 'Mohd Shifan Gouri',
      alternateName: 'BOYS MSG',
      url: 'https://shifan.pokefun.in',
    },
    publisher: {
      '@type': 'Organization',
      name: 'POKEDEVS',
      url: 'https://pokefun.in',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': pageUrl,
    },
    keywords: entry.tags.join(', '),
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 antialiased selection:bg-electric-blue selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Navbar activeSection="journal" />

      <main className="pt-28 pb-20 px-4 sm:px-6 max-w-4xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between gap-4 mb-6 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 min-w-0">
            <Link href="/" className="hover:text-electric-blue transition-colors flex-shrink-0">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
            <Link href="/journal" className="hover:text-electric-blue transition-colors flex-shrink-0">
              Journal
            </Link>
            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="text-slate-800 font-semibold truncate">{entry.title}</span>
          </div>

          <Link
            href="/journal"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-electric-blue transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Updates</span>
          </Link>
        </div>

        {/* Article Container */}
        <article className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-10">
          {/* Header Metadata */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs mb-4">
            {entry.is_pinned && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-electric-blue text-white font-bold shadow-sm">
                <Pin className="w-3 h-3" />
                Pinned Update
              </span>
            )}

            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-electric-ice text-electric-blue font-semibold border border-electric-blue/20">
              {entry.category}
            </span>

            <span className="inline-flex items-center gap-1 text-slate-500 font-medium">
              <Calendar className="w-3.5 h-3.5" />
              {dateStr}
            </span>

            <span className="inline-flex items-center gap-1 text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              {readTimeStr}
            </span>

            {entry.views_count > 0 && (
              <span className="inline-flex items-center gap-1 text-slate-400 ml-auto">
                <Eye className="w-3.5 h-3.5" />
                {entry.views_count.toLocaleString()} views
              </span>
            )}
          </div>

          {/* Article Main Title */}
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-midnight-900 tracking-tight leading-tight">
            {entry.title}
          </h1>

          {/* Summary Lead */}
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed font-medium pb-6 border-b border-slate-100">
            {entry.summary}
          </p>

          {/* Optional Cover Image */}
          {entry.cover_image && (
            <div className="my-6 relative h-64 sm:h-96 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
              <Image
                src={entry.cover_image}
                alt={entry.title}
                fill
                priority
                className="object-cover"
              />
            </div>
          )}

          {/* Linked Project Banner */}
          {(entry.project_name || relatedProject) && (
            <div className="my-6 p-4 rounded-2xl bg-gradient-to-r from-electric-ice/60 to-white border border-electric-blue/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-electric-blue text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-electric-blue uppercase tracking-wider block">
                    Related Project
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                    {relatedProject?.name || entry.project_name}
                  </h4>
                </div>
              </div>

              {relatedProject && (
                <Link
                  href={`/projects/${relatedProject.slug}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white text-xs font-bold text-electric-blue border border-electric-blue/20 hover:bg-electric-blue hover:text-white transition-all shadow-sm flex-shrink-0"
                >
                  <span>View Project Case Study</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          )}

          {/* Optional GitHub Repo Widget */}
          {entry.github_url && (
            <div className="my-6">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Repository Code
              </span>
              <GitHubRepoCard repoUrl={entry.github_url} />
            </div>
          )}

          {/* Demo Button if any */}
          {entry.demo_url && (
            <div className="my-4">
              <a
                href={entry.demo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-electric-blue to-electric-cyan hover:shadow-md transition-all"
              >
                <span>Open Live Demo</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Body Content */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <MarkdownContent content={entry.content} />
          </div>

          {/* Tags */}
          {entry.tags.length > 0 && (
            <div className="mt-10 pt-6 border-t border-slate-100 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 mr-1">Tags:</span>
              {entry.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/journal?tag=${encodeURIComponent(tag)}`}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-electric-ice hover:text-electric-blue transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* Social Share and Navigation Footer */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <JournalShareButtons title={entry.title} url={pageUrl} />

            <Link
              href="/journal"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-electric-blue hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to all updates</span>
            </Link>
          </div>
        </article>

        {/* Recommended Recent Updates */}
        {otherUpdates.length > 0 && (
          <section className="mt-14">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-5 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-electric-blue" />
              <span>More Developer Updates</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {otherUpdates.map((item) => (
                <Link
                  key={item.id}
                  href={`/journal/${item.slug}`}
                  className="group bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-electric-blue/40 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                      {item.category}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm group-hover:text-electric-blue transition-colors line-clamp-2">
                      {item.title}
                    </h4>
                    <p className="mt-2 text-xs text-slate-500 line-clamp-2">
                      {item.summary}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <span>
                      {new Date(item.published_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <span className="font-semibold text-electric-blue group-hover:translate-x-1 transition-transform">
                      Read →
                    </span>
                  </div>
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
