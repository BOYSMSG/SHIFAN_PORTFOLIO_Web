import { NextRequest, NextResponse } from 'next/server';
import {
  getClientIp,
  hashIp,
  verifyAdminSessionFromRequest,
  resolveCallerIdentity,
} from '@/lib/auth';
import {
  insertFeedback,
  getPublicDiscussionList,
  getFeedbackList,
  updateFeedbackStatus,
  deleteFeedbackRecord,
  editFeedback,
  checkDbRateLimit,
} from '@/lib/supabase';

// Helper to check admin session from request cookies with IP binding verification
function checkAdminAuth(req: NextRequest): boolean {
  return verifyAdminSessionFromRequest(req) !== null;
}

/**
 * Public or Admin Feedback Fetching
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const isPublic = searchParams.get('public') === 'true';
  const isAdmin = checkAdminAuth(req);

  // If public request or not admin, return public discussion feed
  if (isPublic || !isAdmin) {
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const adminCookie = req.cookies.get('shifan_admin_session')?.value;
    const identity = await resolveCallerIdentity(req, adminCookie);
    const result = await getPublicDiscussionList(page, limit, identity);
    return NextResponse.json(result);
  }

  // Admin list with status filter
  const statusFilter = searchParams.get('status') || 'all';
  const list = await getFeedbackList(statusFilter);
  return NextResponse.json({ feedback: list });
}

/**
 * Submit Feedback
 */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const ipHash = hashIp(ip);
    const adminCookie = req.cookies.get('shifan_admin_session')?.value;
    const identity = await resolveCallerIdentity(req, adminCookie);

    // Rate-limiting check based on identity:
    // Guest: max 2 per 24 hours per guest identity and IP combination
    // Google: max 3 per 24 hours per authenticated user
    if (identity.type === 'guest') {
      const rateKey = `guest_fb:${identity.hash}_${ipHash}`;
      const rateCheck = await checkDbRateLimit(rateKey, 2, 24 * 60 * 60 * 1000);
      if (!rateCheck.allowed) {
        return NextResponse.json(
          { error: 'Guest limit reached: Maximum 2 feedback submissions allowed per 24 hours.' },
          { status: 429 }
        );
      }
    } else if (identity.type === 'google') {
      const rateKey = `google_fb:${identity.hash}`;
      const rateCheck = await checkDbRateLimit(rateKey, 3, 24 * 60 * 60 * 1000);
      if (!rateCheck.allowed) {
        return NextResponse.json(
          { error: 'Limit reached: Maximum 3 feedback submissions allowed per 24 hours.' },
          { status: 429 }
        );
      }
    }

    const body = await req.json();
    const { rating, message, section_tag, guest_name } = body;

    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be an integer between 1 and 5.' }, { status: 400 });
    }

    if (!message || typeof message !== 'string' || message.trim().length < 4) {
      return NextResponse.json({ error: 'Message must be at least 4 characters long.' }, { status: 400 });
    }

    const userAgent = req.headers.get('user-agent') || 'Web Browser';
    const shortUa = userAgent.includes('Mobile') ? 'Mobile Browser' : 'Desktop Browser';

    // Disallow spoofing identity name if Google verified
    const displayName = identity.type === 'google'
      ? identity.name
      : (guest_name && typeof guest_name === 'string' && guest_name.trim().length > 0)
        ? guest_name.trim().slice(0, 50)
        : 'Guest Visitor';

    const result = await insertFeedback({
      author_id_hash: identity.hash,
      author_type: identity.type === 'google' ? 'google' : 'guest',
      is_guest: identity.type === 'guest',
      guest_name: displayName,
      rating: Math.round(rating),
      message: message.trim().slice(0, 1500),
      section_tag: section_tag || 'projects',
      user_agent_short: shortUa,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to record feedback.' }, { status: 400 });
    }

    const response = NextResponse.json({
      success: true,
      data: {
        ...result.data,
        author_id_hash: undefined, // Never expose private hash
      },
      message: 'Feedback received securely. Thank you for contributing to the community!',
    });

    // Set HTTP-only guest identity cookie if new guest
    if (identity.isNewGuest && identity.guestToken) {
      response.cookies.set('shifan_guest_token', identity.guestToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 365 * 24 * 60 * 60, // 1 year
      });
    }

    return response;
  } catch (err: unknown) {
    console.error('Feedback POST error:', err);
    return NextResponse.json({ error: 'Internal server error while processing feedback.' }, { status: 500 });
  }
}

/**
 * Edit Feedback (Author within 24h) OR Update Status / Moderation (Admin)
 */
export async function PATCH(req: NextRequest) {
  try {
    const adminCookie = req.cookies.get('shifan_admin_session')?.value;
    const isAdmin = checkAdminAuth(req);
    const identity = await resolveCallerIdentity(req, adminCookie);
    const body = await req.json();
    const { id, message, status, is_hidden, is_spam } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing feedback ID.' }, { status: 400 });
    }

    // 1. Author or Admin Editing Feedback Text (within 24 hours for visitors)
    if (message !== undefined) {
      if (typeof message !== 'string' || message.trim().length < 4) {
        return NextResponse.json({ error: 'Updated message must be at least 4 characters long.' }, { status: 400 });
      }

      const editResult = await editFeedback(id, message.trim().slice(0, 1500), identity.hash, identity.isOwner);
      if (!editResult.success) {
        return NextResponse.json({ error: editResult.error || 'Failed to edit feedback.' }, { status: 403 });
      }

      return NextResponse.json({
        success: true,
        message: 'Feedback edited successfully and revision saved.',
        data: {
          ...editResult.data,
          author_id_hash: undefined,
        },
      });
    }

    // 2. Admin Updating Status / Moderation Flags
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized admin moderation.' }, { status: 401 });
    }

    if (status && !['new', 'reviewed', 'important', 'archived', 'spam', 'hidden'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status provided.' }, { status: 400 });
    }

    const success = await updateFeedbackStatus(id, status || 'reviewed', {
      is_hidden: typeof is_hidden === 'boolean' ? is_hidden : undefined,
      is_spam: typeof is_spam === 'boolean' ? is_spam : undefined,
    });

    if (!success) {
      return NextResponse.json({ error: 'Feedback record not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Feedback updated successfully.' });
  } catch (err: unknown) {
    console.error('Feedback PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error while updating feedback.' }, { status: 500 });
  }
}

/**
 * Admin: Delete Feedback
 */
export async function DELETE(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized admin access.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Feedback ID required.' }, { status: 400 });
  }

  const success = await deleteFeedbackRecord(id);
  if (!success) {
    return NextResponse.json({ error: 'Feedback record not found.' }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: 'Feedback record permanently removed.' });
}
