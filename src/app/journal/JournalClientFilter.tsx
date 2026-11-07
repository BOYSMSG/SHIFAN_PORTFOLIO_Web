'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  Filter,
  Pin,
  Calendar,
  Clock,
  Eye,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Layers,
  ChevronDown,
} from 'lucide-react';
import type { JournalEntryRecord, JournalCategory } from '@/lib/supabase';

interface Props {
  initialEntries: JournalEntryRecord[];
  initialTotal: number;
  initialHasMore: boolean;
}

const CATEGORIES: { label: string; value: string }[] = [
  { label: 'All Updates', value: 'All' },
  { label: 'Work Updates', value: 'Work Updates' },
  { label: 'Features', value: 'Features' },
  { label: 'Infrastructure', value: 'Infrastructure' },
  { label: 'Milestones', value: 'Milestones' },
  { label: 'Launches', value: 'Launches' },
  { label: 'Experiments', value: 'Experiments' },
  { label: 'Bug Fixes', value: 'Bug Fixes' },
];

export default function JournalClientFilter({
  initialEntries,
  initialTotal,
  initialHasMore,
}: Props) {
  const [entries, setEntries] = useState<JournalEntryRecord[]>(initialEntries);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Fetch with filters
  const applyFilters = async (cat: string, tag: string | null, search: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', '1');
      params.set('limit', '12');
      if (cat !== 'All') params.set('category', cat);
      if (tag) params.set('tag', tag);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/journal?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setEntries(data.entries);
        setHasMore(data.hasMore);
        setPage(1);
      }
    } catch (e) {
      console.error('Error filtering journal:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    applyFilters(cat, selectedTag, searchQuery);
  };

  const handleTagClick = (tag: string) => {
    const nextTag = selectedTag === tag ? null : tag;
    setSelectedTag(nextTag);
    applyFilters(selectedCategory, nextTag, searchQuery);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters(selectedCategory, selectedTag, searchQuery);
  };

  const loadMore = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const nextPage = page + 1;
      const params = new URLSearchParams();
      params.set('page', nextPage.toString());
      params.set('limit', '12');
      if (selectedCategory !== 'All') params.set('category', selectedCategory);
      if (selectedTag) params.set('tag', selectedTag);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/journal?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setEntries((prev) => [...prev, ...data.entries]);
        setHasMore(data.hasMore);
        setPage(nextPage);
      }
    } catch (e) {
      console.error('Error loading more updates:', e);
    } finally {
      setLoading(false);
    }
  };

  // Helper to format read time
  const getReadTime = (content: string) => {
    const words = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} min read`;
  };

  return (
    <div>
      {/* Search and Category Control Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search form */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search updates, keywords, technologies..."
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-electric-blue focus:bg-white transition-all"
            />
          </form>

          {/* Active Tag indicator */}
          {selectedTag && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Filtered by tag:</span>
              <button
                onClick={() => handleTagClick(selectedTag)}
                type="button"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-electric-ice text-electric-blue font-medium hover:bg-electric-blue hover:text-white transition-colors"
              >
                #{selectedTag} <span className="font-bold">×</span>
              </button>
            </div>
          )}
        </div>

        {/* Categories Pills */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => handleCategoryChange(cat.value)}
                type="button"
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-electric-blue text-white shadow-sm'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeline List */}
      {entries.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 p-8">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No journal entries found</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query or selecting a different category filter above.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setSelectedTag(null);
              setSearchQuery('');
              applyFilters('All', null, '');
            }}
            type="button"
            className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold text-electric-blue bg-electric-ice hover:bg-electric-blue hover:text-white transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="relative border-l-2 border-slate-200/80 ml-3 sm:ml-5 space-y-8 pl-5 sm:pl-8">
          {entries.map((entry) => {
            const dateStr = new Date(entry.published_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <article
                key={entry.id}
                className={`relative group bg-white rounded-2xl border transition-all duration-300 p-5 sm:p-6 shadow-sm hover:shadow-md ${
                  entry.is_pinned
                    ? 'border-electric-blue/40 ring-1 ring-electric-blue/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Timeline node icon */}
                <div
                  className={`absolute -left-[31px] sm:-left-[43px] top-6 w-5 h-5 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${
                    entry.is_pinned ? 'bg-electric-blue' : 'bg-slate-400 group-hover:bg-electric-blue'
                  } transition-colors`}
                />

                {/* Top Badges Bar */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs mb-3">
                  {entry.is_pinned && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-electric-blue text-white font-bold text-[11px] shadow-sm">
                      <Pin className="w-3 h-3" />
                      Pinned
                    </span>
                  )}

                  <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    {entry.category}
                  </span>

                  <span className="inline-flex items-center gap-1 text-slate-500">
                    <Calendar className="w-3.5 h-3.5" />
                    {dateStr}
                  </span>

                  <span className="inline-flex items-center gap-1 text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    {getReadTime(entry.content)}
                  </span>

                  {entry.views_count > 0 && (
                    <span className="inline-flex items-center gap-1 text-slate-400 ml-auto">
                      <Eye className="w-3.5 h-3.5" />
                      {entry.views_count.toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-electric-blue transition-colors leading-snug">
                  <Link href={`/journal/${entry.slug}`}>{entry.title}</Link>
                </h2>

                {/* Summary */}
                <p className="mt-2.5 text-sm sm:text-base text-slate-600 leading-relaxed line-clamp-3">
                  {entry.summary}
                </p>

                {/* Optional Cover Image */}
                {entry.cover_image && (
                  <div className="mt-4 relative h-48 sm:h-64 rounded-xl overflow-hidden border border-slate-100">
                    <Image
                      src={entry.cover_image}
                      alt={entry.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}

                {/* Tags and Linked Project */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {entry.project_name && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        <Layers className="w-3 h-3 text-electric-blue" />
                        {entry.project_name}
                      </span>
                    )}

                    {entry.tags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => handleTagClick(tag)}
                        type="button"
                        className={`text-xs px-2 py-0.5 rounded-md transition-colors ${
                          selectedTag === tag
                            ? 'bg-electric-blue text-white font-medium'
                            : 'bg-slate-50 text-slate-500 hover:bg-slate-200/70 hover:text-slate-800'
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>

                  {/* Read Link */}
                  <Link
                    href={`/journal/${entry.slug}`}
                    className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-electric-blue group-hover:text-electric-cyan hover:underline transition-colors"
                  >
                    <span>Read Details</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Load More Button */}
      {hasMore && (
        <div className="mt-12 text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            type="button"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-electric-blue to-electric-cyan hover:shadow-[0_0_20px_rgba(0,201,216,0.3)] transition-all duration-300 disabled:opacity-50"
          >
            {loading ? (
              <span>Loading updates...</span>
            ) : (
              <>
                <span>Load More Updates</span>
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
