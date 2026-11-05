import { NextRequest, NextResponse } from 'next/server';
import { resolveCallerIdentity } from '@/lib/auth';
import {
  insertReply,
  editReply,
  deleteReplyRecord,
  checkDbRateLimit,
} from '@/lib/supabase';

/**
 * Add Reply to a Feedback Thread
 */
export async function POST(req: NextRequest) {
  try {
    const adminCookie = req.cookies.get('shifan_admin_session')?.value;
    const identity = await resolveCallerIdentity(req, adminCookie);

    // Rate limit: max 10 replies per hour per identity (owner exempt)
    if (!identity.isOwner) {
      const rateKey = `reply:${identity.hash}`;
      const rateCheck = await checkDbRateLimit(rateKey, 10, 60 * 60 * 1000);
      if (!rateCheck.allowed) {
        return NextResponse.json(
          { error: 'Reply rate limit reached: Maximum 10 replies allowed per hour.' },
          { status: 429 }
        );
      }
    }

    const body = await req.json();
    const { feedback_id, content, author_name } = body;

    if (!feedback_id || typeof feedback_id !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid feedback_id.' }, { status: 400 });
    }

    if (!content || typeof content !== 'string' || content.trim().length < 2) {
      return NextResponse.json({ error: 'Reply content must be at least 2 characters long.' }, { status: 400 });
    }

    // Strict authentication requirement: Only logged-in users (Google or Owner) can reply to community threads
    if (identity.type !== 'google' && !identity.isOwner) {
      return NextResponse.json(
        { error: 'Authentication required: Please sign in with Google to reply to community threads.' },
        { status: 401 }
      );
    }

    const cleanAuthorName = identity.isOwner ? 'MSG — Owner' : identity.name;
    const authorType = identity.isOwner ? 'owner' : 'google';

    const result = await insertReply({
      feedback_id,
      content: content.trim().slice(0, 1000),
      author_name: cleanAuthorName,
      author_type: authorType,
      author_id_hash: identity.hash,
      is_owner: identity.isOwner,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to post reply.' }, { status: 400 });
    }

    const response = NextResponse.json({
      success: true,
      data: {
        ...result.data,
        author_id_hash: undefined, // Strip private hash
      },
      message: 'Reply added successfully.',
    });

    if (identity.isNewGuest && identity.guestToken) {
      response.cookies.set('shifan_guest_token', identity.guestToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 365 * 24 * 60 * 60,
      });
    }

    return response;
  } catch (err: unknown) {
    console.error('Replies POST error:', err);
    return NextResponse.json({ error: 'Internal server error while processing reply.' }, { status: 500 });
  }
}

/**
 * Edit Reply (Author within 24h or Owner)
 */
export async function PATCH(req: NextRequest) {
  try {
    const adminCookie = req.cookies.get('shifan_admin_session')?.value;
    const identity = await resolveCallerIdentity(req, adminCookie);
    const body = await req.json();
    const { id, content } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Missing reply ID.' }, { status: 400 });
    }

    if (!content || typeof content !== 'string' || content.trim().length < 2) {
      return NextResponse.json({ error: 'Updated reply must be at least 2 characters long.' }, { status: 400 });
    }

    const result = await editReply(id, content.trim().slice(0, 1000), identity.hash, identity.isOwner);
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to edit reply.' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      message: 'Reply edited successfully and revision saved.',
      data: {
        ...result.data,
        author_id_hash: undefined,
      },
    });
  } catch (err: unknown) {
    console.error('Replies PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error while editing reply.' }, { status: 500 });
  }
}

/**
 * Delete Reply (Admin or Author within 24h)
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing reply ID.' }, { status: 400 });
    }

    const adminCookie = req.cookies.get('shifan_admin_session')?.value;
    const identity = await resolveCallerIdentity(req, adminCookie);

    if (!identity.isOwner) {
      return NextResponse.json({ error: 'Unauthorized to delete reply.' }, { status: 401 });
    }

    const success = await deleteReplyRecord(id);
    if (!success) {
      return NextResponse.json({ error: 'Reply not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Reply deleted successfully.' });
  } catch (err: unknown) {
    console.error('Replies DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error while deleting reply.' }, { status: 500 });
  }
}
