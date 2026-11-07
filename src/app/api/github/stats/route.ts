import { NextRequest, NextResponse } from 'next/server';

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

const cache = new Map<string, { stats: GitHubRepoStats; expiresAt: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const repoParam = searchParams.get('repo');
    if (!repoParam) {
      return NextResponse.json({ error: 'Repository name or URL is required.' }, { status: 400 });
    }

    // Clean repo identifier (e.g., "shifangouri/pokefun" from "https://github.com/shifangouri/pokefun")
    let repoPath = repoParam.trim().replace(/^https?:\/\/github\.com\//i, '').replace(/\/+$/, '');
    const segments = repoPath.split('/');
    if (segments.length < 2) {
      return NextResponse.json({ error: 'Invalid repository format. Expected owner/repo.' }, { status: 400 });
    }
    const cleanRepo = `${segments[0]}/${segments[1]}`;

    // Check in-memory cache
    const cached = cache.get(cleanRepo);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json({ success: true, stats: cached.stats, cached: true });
    }

    const headers: Record<string, string> = {
      'User-Agent': 'Shifan-Portfolio-Bot/1.0',
      Accept: 'application/vnd.github.v3+json',
    };
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const response = await fetch(`https://api.github.com/repos/${cleanRepo}`, {
      headers,
      next: { revalidate: 600 },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Repository not found or private.' }, { status: 404 });
      }
      return NextResponse.json(
        { error: `GitHub API returned status ${response.status}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const stats: GitHubRepoStats = {
      name: data.name,
      fullName: data.full_name,
      description: data.description || '',
      stars: data.stargazers_count ?? 0,
      forks: data.forks_count ?? 0,
      openIssues: data.open_issues_count ?? 0,
      language: data.language || 'Code',
      updatedAt: data.updated_at,
      htmlUrl: data.html_url,
    };

    cache.set(cleanRepo, { stats, expiresAt: Date.now() + CACHE_TTL_MS });

    return NextResponse.json(
      { success: true, stats, cached: false },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to retrieve repository statistics.' },
      { status: 500 }
    );
  }
}
