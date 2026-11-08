'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Pin,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Save,
  X,
  Sparkles,
  Search,
  Filter,
} from 'lucide-react';
import MarkdownContent from '@/components/MarkdownContent';
import type { JournalEntryRecord, ProjectRecord, JournalCategory } from '@/lib/supabase';

const CATEGORIES: JournalCategory[] = [
  'Work Updates',
  'Features',
  'Infrastructure',
  'Milestones',
  'Launches',
  'Experiments',
  'Bug Fixes',
];

export default function AdminJournalPage() {
  const [entries, setEntries] = useState<JournalEntryRecord[]>([]);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState<JournalCategory>('Features');
  const [tagsInput, setTagsInput] = useState('');
  const [projectId, setProjectId] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [isResolvingImage, setIsResolvingImage] = useState(false);

  const handleCoverImageChange = async (val: string) => {
    let clean = val.trim();
    // Auto-extract from HTML snippet if user pasted full <img> or <a> code
    const imgMatch = clean.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch && imgMatch[1]) {
      clean = imgMatch[1].trim();
    }
    const aMatch = clean.match(/<a[^>]+href=["']([^"']+)["']/i);
    if (aMatch && aMatch[1] && (!imgMatch || imgMatch[1].endsWith('...'))) {
      clean = aMatch[1].trim();
    }
    const bbMatch = clean.match(/\[img\](.*?)\[\/img\]/i);
    if (bbMatch && bbMatch[1]) {
      clean = bbMatch[1].trim();
    }

    setCoverImage(clean);

    if (clean.includes('ibb.co/') && !clean.includes('i.ibb.co/')) {
      setIsResolvingImage(true);
      try {
        const res = await fetch('/api/resolve-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: clean })
        });
        const data = await res.json();
        if (data.resolved && data.resolved !== clean) {
          setCoverImage(data.resolved);
        }
      } catch (err) {
        console.warn('Auto image resolve failed:', err);
      } finally {
        setIsResolvingImage(false);
      }
    }
  };
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'published' | 'draft'>('published');
  const [isPinned, setIsPinned] = useState(false);
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [submitting, setSubmitting] = useState(false);

  // Search in table
  const [tableSearch, setTableSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [resEntries, resProjects] = await Promise.all([
        fetch('/api/admin/journal'),
        fetch('/api/admin/projects'),
      ]);

      if (resEntries.status === 401 || resProjects.status === 401) {
        window.location.href = '/admin/login';
        return;
      }

      const dataEntries = await resEntries.json();
      const dataProjects = await resProjects.json();

      if (dataEntries.success) setEntries(dataEntries.entries);
      if (dataProjects.success) setProjects(dataProjects.projects);
    } catch (err: any) {
      setError('Failed to fetch journal data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setSlug('');
    setCategory('Features');
    setTagsInput('');
    setProjectId('');
    setGithubUrl('');
    setDemoUrl('');
    setCoverImage('');
    setSummary('');
    setContent('');
    setStatus('published');
    setIsPinned(false);
    setActiveTab('write');
  };

  const handleEdit = (entry: JournalEntryRecord) => {
    setEditingId(entry.id);
    setTitle(entry.title);
    setSlug(entry.slug);
    setCategory(entry.category as JournalCategory);
    setTagsInput(entry.tags.join(', '));
    setProjectId(entry.project_id || '');
    setGithubUrl(entry.github_url || '');
    setDemoUrl(entry.demo_url || '');
    setCoverImage(entry.cover_image || '');
    setSummary(entry.summary || '');
    setContent(entry.content || '');
    setStatus(entry.status);
    setIsPinned(Boolean(entry.is_pinned));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const selectedProj = projects.find((p) => p.id === projectId);

    const payload = {
      title: title.trim(),
      slug: slug.trim() || undefined,
      category,
      tags,
      project_id: projectId || null,
      project_name: selectedProj ? selectedProj.name : null,
      github_url: githubUrl.trim() || null,
      demo_url: demoUrl.trim() || null,
      cover_image: coverImage.trim() || null,
      summary: summary.trim() || undefined,
      content: content.trim(),
      status,
      is_pinned: isPinned,
    };

    try {
      const url = '/api/admin/journal';
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId ? { id: editingId, ...payload } : payload;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save entry.');
      }

      setSuccessMsg(editingId ? 'Journal entry updated successfully!' : 'Journal entry published successfully!');
      resetForm();
      loadData();
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, titleStr: string) => {
    if (!window.confirm(`Are you sure you want to delete "${titleStr}"?`)) return;

    try {
      const res = await fetch(`/api/admin/journal?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Journal entry deleted.');
        setEntries((prev) => prev.filter((e) => e.id !== id));
      } else {
        setError(data.error || 'Failed to delete.');
      }
    } catch {
      setError('Failed to delete.');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: 'published' | 'draft') => {
    const nextStatus = currentStatus === 'published' ? 'draft' : 'published';
    try {
      const res = await fetch('/api/admin/journal', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'toggleStatus', value: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setEntries((prev) =>
          prev.map((e) => (e.id === id ? { ...e, status: nextStatus } : e))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTogglePin = async (id: string, currentPin: boolean) => {
    try {
      const res = await fetch('/api/admin/journal', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'togglePin', value: !currentPin }),
      });
      const data = await res.json();
      if (data.success) {
        setEntries((prev) =>
          prev.map((e) => (e.id === id ? { ...e, is_pinned: !currentPin } : e))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredEntries = entries.filter((e) => {
    if (!tableSearch.trim()) return true;
    const s = tableSearch.toLowerCase();
    return e.title.toLowerCase().includes(s) || e.category.toLowerCase().includes(s);
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link href="/admin" className="hover:text-electric-blue">
                Admin Console
              </Link>
              <span>/</span>
              <span className="text-electric-blue font-semibold">Developer Journal Publisher</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-midnight-900 tracking-tight flex items-center gap-2.5">
              <BookOpen className="w-7 h-7 text-electric-blue" />
              <span>Publish Developer Journal Updates</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Document daily work, features, infrastructure optimizations, and milestones.
            </p>
          </div>

          <Link
            href="/journal"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-electric-blue bg-electric-ice hover:bg-electric-blue hover:text-white transition-all shadow-xs"
          >
            <span>View Public Journal Feed</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs sm:text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Publisher Form Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-electric-blue" />
              <span>{editingId ? 'Edit Journal Entry' : 'Create New Journal Update'}</span>
            </h2>

            {editingId && (
              <button
                onClick={resetForm}
                type="button"
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg bg-slate-100"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title & Category */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Update Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. PaperMC Performance Tuning & 20 TPS Optimization"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as JournalCategory)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue bg-white"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Custom Slug & Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Custom Slug (optional)
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="leave empty to auto-slugify title"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="e.g. PaperMC, Linux, Java, Optimization"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue"
                />
              </div>
            </div>

            {/* Project Link, GitHub, Demo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Related Project (optional)
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue bg-white"
                >
                  <option value="">-- No Linked Project --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  GitHub Repo URL (optional)
                </label>
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username/repo"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Live Demo URL (optional)
                </label>
                <input
                  type="url"
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  placeholder="https://pokefun.in/team"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue"
                />
              </div>
            </div>

            {/* Cover Image & Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Cover Image URL (optional)
                  </label>
                  {isResolvingImage && (
                    <span className="text-[11px] text-electric-blue flex items-center gap-1 font-medium animate-pulse">
                      <span className="inline-block w-2 h-2 rounded-full bg-electric-blue animate-ping" />
                      Converting ImgBB...
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={coverImage}
                  onChange={(e) => handleCoverImageChange(e.target.value)}
                  onPaste={(e) => {
                    const text = e.clipboardData.getData('text');
                    if (text) {
                      e.preventDefault();
                      handleCoverImageChange(text);
                    }
                  }}
                  placeholder="Paste https://ibb.co/..., HTML, or direct image URL"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue"
                />
                {coverImage && (
                  <div className="mt-2 flex items-center gap-3 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="relative w-20 h-12 rounded-lg overflow-hidden bg-slate-900 border border-slate-200 flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={coverImage}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold text-slate-700 truncate">Preview</p>
                      <p className="text-[10px] text-slate-400 truncate">{coverImage}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Summary / Excerpt (optional)
                </label>
                <input
                  type="text"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Short excerpt for timeline cards"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue"
                />
              </div>
            </div>

            {/* Markdown Editor / Preview Tabs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Update Content (Markdown Supported) *
                </label>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setActiveTab('write')}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      activeTab === 'write' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    Write
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      activeTab === 'preview' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    Preview
                  </button>
                </div>
              </div>

              {activeTab === 'write' ? (
                <textarea
                  required
                  rows={12}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="## What I worked on today&#10;&#10;- Implemented custom plugin tuning&#10;- Ran load testing with 200 bot entities&#10;- Monitored GC pauses with Aikar flags..."
                  className="w-full p-4 rounded-2xl border border-slate-200 font-mono text-xs sm:text-sm text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-electric-blue"
                />
              ) : (
                <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50 min-h-[300px]">
                  <MarkdownContent content={content || '*No content to preview yet.*'} />
                </div>
              )}
            </div>

            {/* Status & Pin Toggles + Submit Bar */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-6">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={status === 'published'}
                    onChange={(e) => setStatus(e.target.checked ? 'published' : 'draft')}
                    className="w-4 h-4 text-electric-blue rounded focus:ring-electric-blue"
                  />
                  <span>Publish Immediately (Draft if unchecked)</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="w-4 h-4 text-electric-blue rounded focus:ring-electric-blue"
                  />
                  <span className="flex items-center gap-1">
                    <Pin className="w-3.5 h-3.5 text-electric-blue" />
                    Pin to top of timeline
                  </span>
                </label>
              </div>

              <div className="flex items-center gap-2.5">
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-electric-blue to-electric-cyan hover:shadow-md transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{submitting ? 'Saving...' : editingId ? 'Update Entry' : 'Publish Entry'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Existing Entries Table Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Published & Draft Updates ({entries.length})
              </h2>
              <p className="text-xs text-slate-500">
                Manage live journal posts, toggle drafts, or re-pin updates.
              </p>
            </div>

            <div className="relative max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Search entries..."
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-electric-blue"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs animate-pulse">
              Loading journal records...
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No journal entries found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-mono uppercase text-[10px]">
                    <th className="pb-3 font-semibold">Title & Category</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Pinned</th>
                    <th className="pb-3 font-semibold">Views</th>
                    <th className="pb-3 font-semibold">Published</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 pr-4 max-w-sm">
                        <span className="font-bold text-slate-900 block truncate">
                          {entry.title}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                          <span className="font-semibold text-electric-blue">{entry.category}</span>
                          {entry.project_name && <span>• {entry.project_name}</span>}
                        </div>
                      </td>

                      <td className="py-3.5 pr-4">
                        <button
                          onClick={() => handleToggleStatus(entry.id, entry.status)}
                          type="button"
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase transition-colors ${
                            entry.status === 'published'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          {entry.status}
                        </button>
                      </td>

                      <td className="py-3.5 pr-4">
                        <button
                          onClick={() => handleTogglePin(entry.id, Boolean(entry.is_pinned))}
                          type="button"
                          className={`p-1.5 rounded-lg transition-colors ${
                            entry.is_pinned
                              ? 'bg-electric-blue text-white shadow-2xs'
                              : 'text-slate-400 hover:bg-slate-100'
                          }`}
                          title={entry.is_pinned ? 'Unpin' : 'Pin to top'}
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                      </td>

                      <td className="py-3.5 pr-4 text-slate-500 font-mono">
                        {entry.views_count.toLocaleString()}
                      </td>

                      <td className="py-3.5 pr-4 text-slate-400">
                        {new Date(entry.published_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/journal/${entry.slug}`}
                            target="_blank"
                            className="p-1.5 text-slate-400 hover:text-electric-blue hover:bg-slate-100 rounded-lg transition-colors"
                            title="View public entry"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            onClick={() => handleEdit(entry)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit entry"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(entry.id, entry.title)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
