import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSessionFromRequest } from '@/lib/auth';
import { getRevisions } from '@/lib/supabase';

function checkAdminAuth(req: NextRequest): boolean {
  return verifyAdminSessionFromRequest(req) !== null;
}

export async function GET(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized admin access.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const targetType = (searchParams.get('target_type') || 'feedback') as 'feedback' | 'reply';
  const targetId = searchParams.get('target_id');

  if (!targetId) {
    return NextResponse.json({ error: 'Missing target_id parameter.' }, { status: 400 });
  }

  const revisions = await getRevisions(targetType, targetId);
  return NextResponse.json({ revisions });
}
