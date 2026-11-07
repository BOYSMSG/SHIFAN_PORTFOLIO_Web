'use client';

import React, { useEffect, useState } from 'react';
import { Star, GitFork, AlertCircle, Code, ExternalLink, GitBranch } from 'lucide-react';

interface GitHubRepoStats {
  name: string;
  fullName: string;
  description: string;
  stars: number;
  forks: number;
  openIssues: number;
  language: string;
  updatedAt: string;
  htmlUrl: string;
}

interface GitHubRepoCardProps {
  repoUrl: string;
  className?: string;
}

export default function GitHubRepoCard({ repoUrl, className = '' }: GitHubRepoCardProps) {
  const [stats, setStats] = useState<GitHubRepoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!repoUrl) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/api/github/stats?repo=${encodeURIComponent(repoUrl)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success && data.stats) {
          setStats(data.stats);
        } else {
          setError(data.error || 'Failed to fetch repo stats');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError('Network error');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [repoUrl]);

  // Clean repo name from URL fallback
  const cleanName = repoUrl.replace(/^https?:\/\/github\.com\//i, '').replace(/\/+$/, '');

  return (
    <div
      className={`rounded-2xl border border-slate-200/90 bg-white/90 backdrop-blur-md p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-electric-blue/30 transition-all duration-300 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-slate-900 text-sm sm:text-base truncate hover:text-electric-blue transition-colors">
              <a href={stats?.htmlUrl || repoUrl} target="_blank" rel="noopener noreferrer">
                {stats?.fullName || cleanName}
              </a>
            </h4>
            <p className="text-xs text-slate-500 truncate">
              {stats?.description || 'GitHub Public Repository'}
            </p>
          </div>
        </div>

        <a
          href={stats?.htmlUrl || repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 text-slate-400 hover:text-electric-blue hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
          title="Open repository on GitHub"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {loading ? (
        <div className="mt-3 flex items-center gap-3 text-xs text-slate-400 animate-pulse">
          <div className="h-4 w-12 bg-slate-200 rounded"></div>
          <div className="h-4 w-16 bg-slate-200 rounded"></div>
          <div className="h-4 w-20 bg-slate-200 rounded"></div>
        </div>
      ) : stats ? (
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1 font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            {stats.stars.toLocaleString()} stars
          </span>

          {stats.forks > 0 && (
            <span className="inline-flex items-center gap-1 font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
              <GitFork className="w-3.5 h-3.5 text-slate-500" />
              {stats.forks.toLocaleString()} forks
            </span>
          )}

          {stats.language && (
            <span className="inline-flex items-center gap-1 font-medium text-electric-blue bg-electric-ice/50 px-2 py-0.5 rounded-full border border-electric-blue/20">
              <Code className="w-3 h-3 text-electric-blue" />
              {stats.language}
            </span>
          )}

          <span className="text-[11px] text-slate-400 ml-auto">
            Updated {new Date(stats.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      ) : (
        <div className="mt-2 text-xs text-slate-400 italic">
          Live repository link on GitHub
        </div>
      )}
    </div>
  );
}
