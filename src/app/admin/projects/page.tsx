'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Sparkles,
  Save,
  X,
  AlertCircle,
  CheckCircle2,
  Search,
  Github,
} from 'lucide-react';
import type { ProjectRecord, ProjectCategory, ProjectStatus } from '@/lib/supabase';

const CATEGORIES: ProjectCategory[] = [
  'Founder Venture',
  'Minecraft Architecture',
  'Web & Platform',
  'Open Source',
  'Infrastructure',
];

const STATUSES: { label: string; value: ProjectStatus }[] = [
  { label: 'Active / Live', value: 'active' },
  { label: 'In Development', value: 'in_development' },
  { label: 'Completed', value: 'completed' },
  { label: 'Planning', value: 'planning' },
  { label: 'Paused', value: 'paused' },
  { label: 'Archived', value: 'archived' },
];

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [tagline, setTagline] = useState('');
  const [category, setCategory] = useState<ProjectCategory>('Web & Platform');
  const [role, setRole] = useState('Founder & Lead Developer');
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
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

    // If it's an ibb.co page link, auto-resolve it immediately in the background
    if (clean.includes('ibb.co/') && !clean.includes('i.ibb.co/')) {
      setIsResolvingImage(true);
      try {
        const res = await fetch('/api/resolve-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: clean })
        });
        const data = await res.json();
        if (data.resolved) {
          setCoverImage(data.resolved);
        }
      } catch (err) {
        console.warn('Auto image resolve failed:', err);
      } finally {
        setIsResolvingImage(false);
      }
    }
  };
  const [technologiesInput, setTechnologiesInput] = useState('');
  const [highlightsInput, setHighlightsInput] = useState('');
  const [startDate, setStartDate] = useState(new Date().getFullYear().toString());
  const [completionDate, setCompletionDate] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('active');
  const [githubUrl, setGithubUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [docsUrl, setDocsUrl] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [displayOrder, setDisplayOrder] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [tableSearch, setTableSearch] = useState('');

  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/projects');
      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      const data = await res.json();
      if (data.success) {
        setProjects(data.projects);
      }
    } catch {
      setError('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setSlug('');
    setTagline('');
    setCategory('Web & Platform');
    setRole('Founder & Lead Developer');
    setShortDescription('');
    setFullDescription('');
    setCoverImage('');
    setTechnologiesInput('');
    setHighlightsInput('');
    setStartDate(new Date().getFullYear().toString());
    setCompletionDate('');
    setStatus('active');
    setGithubUrl('');
    setDemoUrl('');
    setDocsUrl('');
    setIsFeatured(false);
    setDisplayOrder(0);
  };

  const handleEdit = (p: ProjectRecord) => {
    setEditingId(p.id);
    setName(p.name);
    setSlug(p.slug);
    setTagline(p.tagline || '');
    setCategory(p.category as ProjectCategory);
    setRole(p.role || 'Lead Developer');
    setShortDescription(p.short_description || '');
    setFullDescription(p.full_description || '');
    setCoverImage(p.cover_image || '');
    setTechnologiesInput(p.technologies?.join(', ') || '');
    setHighlightsInput(p.highlights?.join('\n') || '');
    setStartDate(p.start_date || '');
    setCompletionDate(p.completion_date || '');
    setStatus(p.status);
    setGithubUrl(p.github_url || '');
    setDemoUrl(p.demo_url || '');
    setDocsUrl(p.docs_url || '');
    setIsFeatured(Boolean(p.is_featured));
    setDisplayOrder(p.display_order || 0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    const technologies = technologiesInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const highlights = highlightsInput
      .split('\n')
      .map((h) => h.trim())
      .filter(Boolean);

    const payload = {
      name: name.trim(),
      slug: slug.trim() || undefined,
      tagline: tagline.trim(),
      category,
      role: role.trim(),
      short_description: shortDescription.trim(),
      full_description: fullDescription.trim(),
      cover_image: coverImage.trim() || null,
      technologies,
      highlights,
      start_date: startDate.trim(),
      completion_date: completionDate.trim() || null,
      status,
      github_url: githubUrl.trim() || null,
      demo_url: demoUrl.trim() || null,
      docs_url: docsUrl.trim() || null,
      is_featured: isFeatured,
      display_order: Number(displayOrder) || 0,
    };

    try {
      const url = '/api/admin/projects';
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId ? { id: editingId, ...payload } : payload;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save project.');
      }

      setSuccessMsg(editingId ? 'Project updated successfully!' : 'Project created successfully!');
      resetForm();
      loadProjects();
    } catch (err: any) {
      setError(err.message || 'An error occurred saving project.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, projectName: string) => {
    if (!window.confirm(`Are you sure you want to delete project "${projectName}"?`)) return;

    try {
      const res = await fetch(`/api/admin/projects?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Project deleted successfully.');
        setProjects((prev) => prev.filter((p) => p.id !== id));
      } else {
        setError(data.error || 'Failed to delete project.');
      }
    } catch {
      setError('Failed to delete project.');
    }
  };

  const filteredProjects = projects.filter((p) => {
    if (!tableSearch.trim()) return true;
    const s = tableSearch.toLowerCase();
    return p.name.toLowerCase().includes(s) || p.category.toLowerCase().includes(s);
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
              <span className="text-electric-blue font-semibold">Project Portfolio Manager</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-midnight-900 tracking-tight flex items-center gap-2.5">
              <Layers className="w-7 h-7 text-electric-blue" />
              <span>Manage Live Projects & Ventures</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Add, update, and showcase projects, server architectures, and open-source platforms.
            </p>
          </div>

          <Link
            href="/projects"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-electric-blue bg-electric-ice hover:bg-electric-blue hover:text-white transition-all shadow-xs"
          >
            <span>View Public Projects</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Notifications */}
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

        {/* Project Form */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-electric-blue" />
              <span>{editingId ? 'Edit Project Details' : 'Add New Portfolio Project'}</span>
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
            {/* Name, Slug, Category */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Pokefun Network & SMP"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Slug (URL)
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="leave blank to auto-generate"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ProjectCategory)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue bg-white"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tagline & Role */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Tagline
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Minecraft Community & Multiplayer Server Ecosystem"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Your Role / Contribution
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Founder & Lead Server Architect"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue"
                />
              </div>
            </div>

            {/* Short Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Short Description (Card Excerpt)
              </label>
              <textarea
                rows={2}
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="A concise overview shown on the projects gallery cards."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue"
              />
            </div>

            {/* Full Markdown Case Study */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Full Description / Case Study (Markdown)
              </label>
              <textarea
                rows={8}
                value={fullDescription}
                onChange={(e) => setFullDescription(e.target.value)}
                placeholder="## Architecture & Highlights&#10;&#10;- High-tickrate PaperMC server optimization...&#10;- Linux VPS administration..."
                className="w-full p-4 rounded-xl border border-slate-200 font-mono text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-electric-blue"
              />
            </div>

            {/* Technologies and Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Technologies (comma separated)
                </label>
                <input
                  type="text"
                  value={technologiesInput}
                  onChange={(e) => setTechnologiesInput(e.target.value)}
                  placeholder="Java, PaperMC, Linux, MySQL, Discord API"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Key Highlights (one per line)
                </label>
                <textarea
                  rows={3}
                  value={highlightsInput}
                  onChange={(e) => setHighlightsInput(e.target.value)}
                  placeholder="Tuned PaperMC configs for 20 TPS&#10;Connected automated rank store delivery&#10;Lead community moderation"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-electric-blue"
                />
              </div>
            </div>

            {/* Links and Cover Image */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Cover Image URL
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
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-electric-blue"
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
                  Live Demo URL
                </label>
                <input
                  type="url"
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  placeholder="https://pokefun.in"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-electric-blue"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  GitHub Repo URL
                </label>
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-electric-blue"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Documentation URL
                </label>
                <input
                  type="url"
                  value={docsUrl}
                  onChange={(e) => setDocsUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-electric-blue"
                />
              </div>
            </div>

            {/* Status, Display Order, Featured & Save */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-700">Status:</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 bg-white"
                  >
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-700">Order:</label>
                  <input
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(parseInt(e.target.value || '0', 10))}
                    className="w-16 px-2 py-1 rounded-lg border border-slate-200 text-xs"
                  />
                </div>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 text-electric-blue rounded focus:ring-electric-blue"
                  />
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-electric-blue" />
                    Feature on Homepage
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
                  <span>{submitting ? 'Saving...' : editingId ? 'Update Project' : 'Add Project'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Existing Projects Table */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Configured Projects ({projects.length})
              </h2>
              <p className="text-xs text-slate-500">
                Projects visible on the website and available to link in journal updates.
              </p>
            </div>

            <div className="relative max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Search projects..."
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-electric-blue"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs animate-pulse">
              Loading projects...
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No projects found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-mono uppercase text-[10px]">
                    <th className="pb-3 font-semibold">Order</th>
                    <th className="pb-3 font-semibold">Name & Category</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Featured</th>
                    <th className="pb-3 font-semibold">Links</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProjects.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 pr-3 font-mono text-slate-400">
                        #{p.display_order}
                      </td>

                      <td className="py-3.5 pr-4 max-w-xs">
                        <span className="font-bold text-slate-900 block truncate">{p.name}</span>
                        <span className="text-[11px] text-electric-blue font-semibold">
                          {p.category}
                        </span>
                      </td>

                      <td className="py-3.5 pr-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                          {p.status}
                        </span>
                      </td>

                      <td className="py-3.5 pr-4">
                        {p.is_featured ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-electric-blue">
                            <Sparkles className="w-3 h-3" />
                            Yes
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No</span>
                        )}
                      </td>

                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-2 text-slate-500">
                          {p.demo_url && (
                            <a
                              href={p.demo_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-electric-blue"
                              title="Demo Site"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {p.github_url && (
                            <a
                              href={p.github_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-electric-blue"
                              title="GitHub Repo"
                            >
                              <Github className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/projects/${p.slug}`}
                            target="_blank"
                            className="p-1.5 text-slate-400 hover:text-electric-blue hover:bg-slate-100 rounded-lg transition-colors"
                            title="View Public Page"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            onClick={() => handleEdit(p)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit project"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete project"
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
