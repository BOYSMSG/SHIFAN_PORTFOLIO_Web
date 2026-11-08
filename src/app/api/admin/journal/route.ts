import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSessionFromRequest } from '@/lib/auth';
import { resolveCoverImageUrl } from '@/lib/imageResolver';
import {
  getAllJournalEntriesForAdmin,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  toggleJournalStatus,
  toggleJournalPin,
} from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const session = verifyAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized admin access.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;

    const entries = await getAllJournalEntriesForAdmin({ status, category, search });
    return NextResponse.json({ success: true, entries, total: entries.length });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch admin journal entries.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = verifyAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized admin access.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (!body || !body.title) {
      return NextResponse.json({ error: 'Journal title is required.' }, { status: 400 });
    }
    if (!body.content) {
      return NextResponse.json({ error: 'Journal markdown content is required.' }, { status: 400 });
    }

    if (body.cover_image) {
      body.cover_image = await resolveCoverImageUrl(body.cover_image);
    }

    const result = await createJournalEntry(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to create journal update.' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error creating journal update.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = verifyAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized admin access.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (!body || !body.id) {
      return NextResponse.json({ error: 'Journal entry ID is required.' }, { status: 400 });
    }

    const { id, ...updates } = body;
    if (updates.cover_image) {
      updates.cover_image = await resolveCoverImageUrl(updates.cover_image);
    }
    const result = await updateJournalEntry(id, updates);
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to update journal entry.' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error updating journal entry.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = verifyAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized admin access.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, action, value } = body;
    if (!id || !action) {
      return NextResponse.json({ error: 'ID and action are required.' }, { status: 400 });
    }

    let result;
    if (action === 'toggleStatus') {
      result = await toggleJournalStatus(id, value === 'published' ? 'published' : 'draft');
    } else if (action === 'togglePin') {
      result = await toggleJournalPin(id, Boolean(value));
    } else {
      return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to perform action.' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error processing patch.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = verifyAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized admin access.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Journal entry ID is required.' }, { status: 400 });
    }

    const result = await deleteJournalEntry(id);
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to delete journal entry.' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error deleting journal entry.' }, { status: 500 });
  }
}
