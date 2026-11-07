import { NextRequest, NextResponse } from 'next/server';
import { getPublicJournalEntries } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const category = searchParams.get('category') || undefined;
    const tag = searchParams.get('tag') || undefined;
    const search = searchParams.get('search') || undefined;
    const projectId = searchParams.get('projectId') || undefined;

    const result = await getPublicJournalEntries(page, limit, {
      category,
      tag,
      search,
      projectId,
    });

    return NextResponse.json(
      {
        success: true,
        entries: result.entries,
        total: result.total,
        page,
        limit,
        hasMore: result.hasMore,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve journal updates.' },
      { status: 500 }
    );
  }
}
