import { NextRequest, NextResponse } from 'next/server';
import { getClientIp, hashIp, resolveCallerIdentity } from '@/lib/auth';
import { toggleFeedbackLike, checkDbRateLimit } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const ipHash = hashIp(ip);

    // Rate limiting: max 40 like actions per hour per IP
    const rateCheck = await checkDbRateLimit(`like_rate:${ipHash}`, 40, 60 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Like rate limit reached. Please wait before liking again.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { feedbackId } = body;

    if (!feedbackId || typeof feedbackId !== 'string') {
      return NextResponse.json({ error: 'Feedback ID is required.' }, { status: 400 });
    }

    // Resolve voter identity hash
    const adminCookie = req.cookies.get('shifan_admin_session')?.value;
    const identity = await resolveCallerIdentity(req, adminCookie);
    const voterHash = identity.hash || ipHash;

    const result = await toggleFeedbackLike(feedbackId, voterHash);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to update like status.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      liked: result.liked,
      likesCount: result.likesCount,
    });
  } catch (err: any) {
    console.error('Like action exception:', err);
    return NextResponse.json({ error: 'Server error processing like action.' }, { status: 500 });
  }
}
