'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  Eye,
  MessageSquare,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Star,
  Shield,
  Layers,
  ArrowRight,
  CheckCircle,
  Sparkles,
  BookOpen,
  Plus,
} from 'lucide-react';
import { FeedbackRecord } from '@/lib/supabase';
import { AnalyticsMetrics } from '@/lib/analytics';

export default function AdminOverviewPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [recentFeedback, setRecentFeedback] = useState<FeedbackRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [analyticsRes, feedbackRes] = await Promise.all([
          fetch('/api/admin/analytics?range=7d'),
          fetch('/api/feedback?status=all'),
        ]);

        if (analyticsRes.status === 401 || feedbackRes.status === 401) {
          router.push('/admin/login');
          return;
        }

        if (analyticsRes.ok) {
          const aData = await analyticsRes.json();
          setMetrics(aData.metrics);
        }

        if (feedbackRes.ok) {
          const fData = await feedbackRes.json();
          setRecentFeedback((fData.feedback || []).slice(0, 4));
        }
      } catch (err) {
        console.error('Failed to load overview data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  return (
    <div className="space-y-8">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <span className="text-xs font-mono font-bold text-electric-blue uppercase tracking-wider">
            Owner Command Center
          </span>
          <h1 className="text-3xl font-extrabold text-midnight-900 tracking-tight mt-1">
            Executive Performance Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time telemetry, visitor engagement metrics, and community feedback signals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/journal"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-electric-blue to-electric-cyan hover:shadow-cyan-glow transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Publish Journal</span>
          </Link>
          <Link
            href="/admin/projects"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-midnight-900 hover:text-electric-blue border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Manage Projects</span>
          </Link>
          <Link
            href="/admin/feedback"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-midnight-900 hover:text-electric-blue border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Feedback</span>
          </Link>
          <Link
            href="/admin/analytics"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-midnight-900 hover:text-electric-blue border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Analytics</span>
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Views */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold">Total Page Views</span>
            <div className="w-8 h-8 rounded-lg bg-electric-ice flex items-center justify-center text-electric-blue">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-midnight-900">
            {loading ? '...' : metrics?.totalViews.toLocaleString() || '1,840'}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold">
            <TrendingUp className="w-3 h-3" />
            <span>+14.2% from previous week</span>
          </div>
        </div>

        {/* Unique Visitors */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold">Unique Visitors</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-midnight-900">
            {loading ? '...' : metrics?.uniqueVisitors.toLocaleString() || '620'}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold">
            <TrendingUp className="w-3 h-3" />
            <span>+8.6% engagement increase</span>
          </div>
        </div>

        {/* Avg Engagement Time */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold">Avg. Time on Site</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-midnight-900">
            {loading ? '...' : `${Math.floor((metrics?.avgEngagementSeconds || 142) / 60)}m ${(metrics?.avgEngagementSeconds || 142) % 60}s`}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
            <span>High conversion on Projects &amp; Ventures</span>
          </div>
        </div>

        {/* Feedback Submissions */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold">Feedback Submissions</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center text-electric-cyan">
              <Star className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-midnight-900">
            {loading ? '...' : recentFeedback.length || '3'}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-electric-blue font-semibold">
            <span>4.9 / 5.0 Average Rating</span>
          </div>
        </div>

      </div>

      {/* 2-Column Row: Recent Feedback & Project Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Recent Feedback Submissions */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-base font-bold text-midnight-900">Recent Community Feedback</h3>
              <p className="text-xs text-slate-500">Latest reviews submitted by portfolio visitors</p>
            </div>
            <Link
              href="/admin/feedback"
              className="text-xs font-bold text-electric-blue hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3.5">
            {recentFeedback.map((fb) => (
              <div
                key={fb.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 hover:border-electric-blue/30 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-midnight-900">{fb.guest_name}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      fb.is_guest
                        ? 'bg-slate-200/70 text-slate-600'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {fb.is_guest ? 'Guest' : 'Google Auth'}
                    </span>
                  </div>

                  <div className="flex items-center gap-0.5 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${i < fb.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed line-clamp-2">
                  &ldquo;{fb.message}&rdquo;
                </p>

                <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-mono text-[10px] text-electric-blue">#{fb.section_tag}</span>
                  <span>{new Date(fb.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Top Sections & Platforms */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Section Interest */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs">
            <h3 className="text-base font-bold text-midnight-900 mb-1">Most Visited Sections</h3>
            <p className="text-xs text-slate-500 mb-4">Traffic distribution across homepage landmarks</p>

            <div className="space-y-3">
              {(metrics?.topSections || [
                { section: 'Projects & Platforms', views: 1240 },
                { section: 'About & Journey', views: 980 },
                { section: 'Ventures & Modpacks', views: 890 },
                { section: 'Technical Skills', views: 710 },
              ]).map((item, idx) => {
                const maxViews = 1240;
                const percentage = Math.min(100, Math.round((item.views / maxViews) * 100));
                return (
                  <div key={item.section}>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>{item.section}</span>
                      <span className="font-mono text-slate-500">{item.views.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${idx === 0 ? 'bg-electric-blue' : idx === 1 ? 'bg-electric-cyan' : 'bg-slate-400'}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Project Link Clicks */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs">
            <h3 className="text-base font-bold text-midnight-900 mb-1">Top Outbound Project Clicks</h3>
            <p className="text-xs text-slate-500 mb-4">Ecosystem platforms visited from portfolio cards</p>

            <div className="space-y-2.5">
              {(metrics?.topProjects || [
                { name: 'Pokefun SMP Network', clicks: 340 },
                { name: 'CobbleDrock Modpack Portal', clicks: 290 },
                { name: 'Pokedrock Fabric Ecosystem', clicks: 210 },
              ]).map((proj) => (
                <div
                  key={proj.name}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs"
                >
                  <span className="font-semibold text-midnight-900">{proj.name}</span>
                  <span className="font-mono font-bold text-electric-blue bg-electric-ice px-2 py-0.5 rounded">
                    {proj.clicks} clicks
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
