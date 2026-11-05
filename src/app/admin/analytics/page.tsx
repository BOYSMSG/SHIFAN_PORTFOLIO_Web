'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  Calendar,
  Users,
  Eye,
  Globe,
  Smartphone,
  Compass,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { AnalyticsMetrics } from '@/lib/analytics';

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [range, setRange] = useState<'7d' | '30d' | '90d' | 'all'>('7d');
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [sourceEngine, setSourceEngine] = useState<'umami' | 'supabase'>('supabase');

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?range=${range}`);
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setConfigured(Boolean(data.configured));
        setStatusMessage(data.message || '');
        setMetrics(data.metrics || null);
        if (data.source) setSourceEngine(data.source);
      } else {
        setConfigured(false);
        setStatusMessage('Unauthorized or server error');
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setConfigured(false);
      setStatusMessage('Network connectivity error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [range]);

  const ranges = [
    { id: '7d', label: 'Last 7 Days' },
    { id: '30d', label: 'Last 30 Days' },
    { id: '90d', label: 'Last 90 Days' },
    { id: 'all', label: 'All Time' },
  ];

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-electric-blue uppercase tracking-wider">
              Privacy-First Telemetry
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                sourceEngine === 'umami'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-electric-ice text-electric-blue border-electric-blue/30'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  sourceEngine === 'umami' ? 'bg-emerald-500 animate-pulse' : 'bg-electric-blue'
                }`}
              />
              {sourceEngine === 'umami' ? 'Live Umami Engine' : 'Native Platform Telemetry'}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-midnight-900 tracking-tight mt-1">
            Visitor &amp; Engagement Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Aggregated traffic metrics, geographic distribution, and interactive component funnels.
          </p>
        </div>

        {/* Range Selector */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-2xs self-start sm:self-auto">
          {ranges.map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id as '7d' | '30d' | '90d' | 'all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                range === r.id
                  ? 'bg-electric-blue text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-midnight-900 hover:bg-slate-50'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Unconfigured State Banner / Notice */}
      {!loading && (!configured || !metrics) ? (
        <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-2xs text-center max-w-xl mx-auto my-12">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200 shadow-2xs">
            <BarChart3 className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-midnight-900 mb-2">
            Analytics Not Configured
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
            {statusMessage || 'Live telemetry requires server-side Umami credentials. Real-time metrics will populate automatically once configured.'}
          </p>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-left text-xs font-mono text-slate-600 space-y-1">
            <p className="font-sans font-bold text-slate-700 mb-2">Required Server Environment Variables:</p>
            <p>UMAMI_WEBSITE_ID=your-website-uuid</p>
            <p>UMAMI_API_KEY=your-umami-api-key</p>
            <p>UMAMI_HOST_URL=https://cloud.umami.is</p>
          </div>
        </div>
      ) : (
        <>
          {/* Primary KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
              <span className="text-xs font-semibold text-slate-400">Total Pageviews</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-midnight-900 mt-2">
                {loading ? '...' : (metrics?.totalViews ?? 0).toLocaleString()}
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-block">
                Verified aggregate telemetry
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
              <span className="text-xs font-semibold text-slate-400">Unique Visitors</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-midnight-900 mt-2">
                {loading ? '...' : (metrics?.uniqueVisitors ?? 0).toLocaleString()}
              </div>
              <span className="text-[11px] text-indigo-600 font-semibold mt-1 inline-block">
                Unique sessions without tracking cookies
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
              <span className="text-xs font-semibold text-slate-400">Average Engagement</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-midnight-900 mt-2">
                {loading ? '...' : `${Math.floor((metrics?.avgEngagementSeconds || 0) / 60)}m ${(metrics?.avgEngagementSeconds || 0) % 60}s`}
              </div>
              <span className="text-[11px] text-amber-600 font-semibold mt-1 inline-block">
                Active session dwell time
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
              <span className="text-xs font-semibold text-slate-400">Feedback Conversion</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-midnight-900 mt-2">
                {loading ? '...' : `${metrics?.googleFeedbackCount || 0} Google / ${metrics?.guestFeedbackCount || 0} Guest`}
              </div>
              <span className="text-[11px] text-electric-blue font-semibold mt-1 inline-block">
                Verified feedback submissions
              </span>
            </div>
          </div>

          {/* Views Over Time Trend Visualizer */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-midnight-900">Traffic Trajectory Over Interval</h3>
                <p className="text-xs text-slate-500">Continuous daily volume for selected timeframe ({range})</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-electric-blue font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-electric-blue" />
                  <span>Pageviews</span>
                </span>
                <span className="flex items-center gap-1.5 text-electric-cyan font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-electric-cyan" />
                  <span>Visitors</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-3 items-end h-44 pt-4 border-b border-slate-100">
              {(metrics?.viewsOverTime || []).map((day) => {
                const maxViews = Math.max(1, ...((metrics?.viewsOverTime || []).map((d) => d.views)));
                const viewHeight = Math.max(12, Math.round((day.views / maxViews) * 100));
                const visitorHeight = Math.max(8, Math.round((day.visitors / maxViews) * 100));

                return (
                  <div key={day.date} className="flex flex-col items-center h-full justify-end group">
                    <div className="w-full max-w-[42px] flex items-end justify-center gap-1.5 h-full">
                      <div
                        className="w-1/2 bg-electric-blue rounded-t-lg transition-all group-hover:brightness-110"
                        style={{ height: `${viewHeight}%` }}
                        title={`${day.views} Views`}
                      />
                      <div
                        className="w-1/2 bg-electric-cyan rounded-t-lg transition-all group-hover:brightness-110"
                        style={{ height: `${visitorHeight}%` }}
                        title={`${day.visitors} Visitors`}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 mt-2">{day.date}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3-Column Distribution Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Device Breakdown */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs">
              <div className="flex items-center gap-2 mb-4">
                <Smartphone className="w-4 h-4 text-electric-blue" />
                <h3 className="text-sm font-bold text-midnight-900">Device Breakdown</h3>
              </div>
              <div className="space-y-3">
                {(metrics?.deviceBreakdown || []).map((dev) => (
                  <div key={dev.device}>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-700">{dev.device}</span>
                      <span className="text-slate-400 font-mono">{dev.percentage}% ({dev.count.toLocaleString()})</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-electric-blue to-electric-cyan"
                        style={{ width: `${dev.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Browser Breakdown */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs">
              <div className="flex items-center gap-2 mb-4">
                <Compass className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-midnight-900">Browser Distribution</h3>
              </div>
              <div className="space-y-3">
                {(metrics?.browserBreakdown || []).map((b) => (
                  <div key={b.browser}>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-700">{b.browser}</span>
                      <span className="text-slate-400 font-mono">{b.percentage}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{ width: `${b.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Geographic Overview */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-midnight-900">Top Geographic Regions</h3>
              </div>
              <div className="space-y-2.5">
                {(metrics?.countryBreakdown || []).map((c) => (
                  <div
                    key={c.code}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/60 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        {c.code}
                      </span>
                      <span className="font-semibold text-midnight-900">{c.country}</span>
                    </div>
                    <span className="font-mono text-slate-600 font-bold">{c.visitors.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </>
      )}

      {/* Privacy Guarantee Banner */}
      <div className="p-4 rounded-2xl bg-electric-ice/50 border border-electric-blue/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-electric-blue flex-shrink-0" />
          <span>
            <strong>GDPR &amp; CCPA Compliance:</strong> Analytics operate without cookie tracking, device fingerprinting, or raw IP retention.
          </span>
        </div>
        <span className="font-mono text-[11px] text-electric-blue">Umami Telemetry Engine Active</span>
      </div>

    </div>
  );
}
