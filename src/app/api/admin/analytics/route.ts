import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSessionFromRequest } from '@/lib/auth';
import { fetchRealAnalytics } from '@/lib/analytics';

export async function GET(req: NextRequest) {
  const session = verifyAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized admin access.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const rangeParam = searchParams.get('range') || '7d';
  const range = ['7d', '30d', '90d', 'all'].includes(rangeParam)
    ? (rangeParam as '7d' | '30d' | '90d' | 'all')
    : '7d';

  const result = await fetchRealAnalytics(range);

  if (!result.configured) {
    return NextResponse.json({
      configured: false,
      message: result.error || 'Analytics not configured',
      metrics: null,
      range,
    });
  }

  return NextResponse.json({
    configured: true,
    metrics: result.metrics,
    range,
    source: result.source || 'supabase',
  });
}
