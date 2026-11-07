import { NextRequest, NextResponse } from 'next/server';
import { getJournalEntryBySlug, incrementJournalViews, getProjectBySlug } from '@/lib/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: 'Slug parameter is required.' }, { status: 400 });
    }

    const entry = await getJournalEntryBySlug(slug, false);
    if (!entry) {
      return NextResponse.json({ error: 'Journal update not found.' }, { status: 404 });
    }

    // Increment views in background
    incrementJournalViews(slug).catch(() => {});

    let relatedProject = null;
    if (entry.project_id) {
      const p = await getProjectBySlug(entry.project_id);
      relatedProject = p.project;
    }

    return NextResponse.json(
      {
        success: true,
        entry,
        relatedProject,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to retrieve journal update.' },
      { status: 500 }
    );
  }
}
