import { NextRequest, NextResponse } from 'next/server';
import { getPublicProjectsList } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || undefined;
    const featuredOnly = searchParams.get('featured') === 'true';

    const projects = await getPublicProjectsList({
      category,
      featuredOnly,
    });

    return NextResponse.json(
      { success: true, projects, total: projects.length },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}
