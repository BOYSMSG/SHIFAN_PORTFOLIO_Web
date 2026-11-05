import { NextRequest, NextResponse } from 'next/server';
import { getClientIp, hashIp, verifyAdminSessionFromRequest } from '@/lib/auth';
import { reportContent } from '@/lib/supabase';

function checkAdminAuth(req: NextRequest): boolean {
  return verifyAdminSessionFromRequest(req) !== null;
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const ipHash = hashIp(ip);
    const body = await req.json();
    const { target_type, target_id, reason } = body;

    if (!target_type || !['feedback', 'reply'].includes(target_type)) {
      return NextResponse.json({ error: 'Invalid target type.' }, { status: 400 });
    }

    if (!target_id || typeof target_id !== 'string') {
      return NextResponse.json({ error: 'Missing target ID.' }, { status: 400 });
    }

    const cleanReason = (reason && typeof reason === 'string')
      ? reason.trim().slice(0, 300)
      : 'Inappropriate or spam content';

    const result = await reportContent({
      target_type,
      target_id,
      reason: cleanReason,
      reporter_hash: ipHash,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to submit report.' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you for reporting. This item has been flagged for owner review.',
    });
  } catch (err: unknown) {
    console.error('Reports POST error:', err);
    return NextResponse.json({ error: 'Internal server error while reporting content.' }, { status: 500 });
  }
}
