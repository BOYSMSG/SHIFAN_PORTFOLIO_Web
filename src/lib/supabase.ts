import { createClient, SupabaseClient } from '@supabase/supabase-js';

const isProduction = process.env.NODE_ENV === 'production';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export interface FeedbackReplyRecord {
  id: string;
  feedback_id: string;
  author_name: string;
  author_type: 'owner' | 'google' | 'guest';
  author_id_hash?: string; // Private hash, never leaked to public API
  content: string;
  is_owner: boolean;
  is_edited: boolean;
  edited_at?: string | null;
  is_hidden: boolean;
  is_spam: boolean;
  reports_count: number;
  created_at: string;
  updated_at?: string;
}

export interface FeedbackRevisionRecord {
  id: string;
  target_type: 'feedback' | 'reply';
  target_id: string;
  previous_content: string;
  new_content: string;
  editor_identity: string;
  editor_type: 'owner' | 'google' | 'guest';
  created_at: string;
}

export interface FeedbackReportRecord {
  id: string;
  target_type: 'feedback' | 'reply';
  target_id: string;
  reason: string;
  reporter_hash: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  created_at: string;
}

export interface FeedbackRecord {
  id: string;
  user_id?: string | null;
  author_id_hash?: string; // Private hash, never leaked to public API
  author_type: 'google' | 'guest';
  is_guest: boolean;
  guest_name: string;
  rating: number;
  message: string;
  section_tag: string;
  status: 'new' | 'reviewed' | 'important' | 'archived' | 'spam' | 'hidden';
  user_agent_short?: string;
  is_edited: boolean;
  edited_at?: string | null;
  is_hidden: boolean;
  is_spam: boolean;
  reports_count: number;
  replies_count: number;
  replies?: FeedbackReplyRecord[];
  created_at: string;
  updated_at?: string;
}

const globalForDev = globalThis as unknown as {
  __devMemoryFeedbackStore?: FeedbackRecord[];
  __devMemoryRevisionsStore?: FeedbackRevisionRecord[];
  __devMemoryReportsStore?: FeedbackReportRecord[];
  __devMemoryRateLimitsStore?: Map<string, { count: number; windowStart: number }>;
};

// Initial development sample data
const initialDevFeedback: FeedbackRecord[] = [
  {
    id: 'fb-sample-1',
    author_type: 'google',
    author_id_hash: 'dev-google-hash-alex',
    is_guest: false,
    guest_name: 'Alex Rivera (Verified Google)',
    rating: 5,
    message: 'The Minecraft server configurations and Pokefun player portal look exceptionally well engineered. Smooth floating navbar and very responsive community stats!',
    section_tag: 'projects',
    status: 'important',
    user_agent_short: 'Chrome / macOS',
    is_edited: false,
    is_hidden: false,
    is_spam: false,
    reports_count: 0,
    replies_count: 1,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    replies: [
      {
        id: 'reply-sample-1',
        feedback_id: 'fb-sample-1',
        author_name: 'MSG — Owner',
        author_type: 'owner',
        content: 'Thank you Alex! We spent a lot of time calibrating network routing and automated modpack delivery on Pokefun. Appreciate you stopping by!',
        is_owner: true,
        is_edited: false,
        is_hidden: false,
        is_spam: false,
        reports_count: 0,
        created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
    ],
  },
  {
    id: 'fb-sample-2',
    author_type: 'guest',
    author_id_hash: 'dev-guest-hash-cyberpixel',
    is_guest: true,
    guest_name: 'Guest-CyberPixel',
    rating: 5,
    message: 'Loved the Amity Online BCA journey cards and the Electric Blue + Cyan design. Very clean responsive layout.',
    section_tag: 'journey',
    status: 'reviewed',
    user_agent_short: 'Edge / Windows',
    is_edited: true,
    edited_at: new Date(Date.now() - 3600000 * 20).toISOString(),
    is_hidden: false,
    is_spam: false,
    reports_count: 0,
    replies_count: 1,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    replies: [
      {
        id: 'reply-sample-2',
        feedback_id: 'fb-sample-2',
        author_name: 'Guest-FrostForge',
        author_type: 'guest',
        content: 'Totally agreed! The glassmorphic cards look great on mobile too.',
        is_owner: false,
        is_edited: false,
        is_hidden: false,
        is_spam: false,
        reports_count: 0,
        created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
      },
    ],
  },
  {
    id: 'fb-sample-3',
    author_type: 'guest',
    author_id_hash: 'dev-guest-hash-neonecho',
    is_guest: true,
    guest_name: 'Guest-NeonEcho',
    rating: 4,
    message: 'Great website! Would love to see more details on modpack setup automation when available.',
    section_tag: 'ventures',
    status: 'new',
    user_agent_short: 'Safari / iOS',
    is_edited: false,
    is_hidden: false,
    is_spam: false,
    reports_count: 0,
    replies_count: 0,
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    replies: [],
  },
];

// Development-only shared store (Cross-route singleton in dev, empty in prod)
const devMemoryFeedbackStore: FeedbackRecord[] = isProduction
  ? []
  : (globalForDev.__devMemoryFeedbackStore ??= [...initialDevFeedback]);

const devMemoryRevisionsStore: FeedbackRevisionRecord[] = isProduction
  ? []
  : (globalForDev.__devMemoryRevisionsStore ??= []);

const devMemoryReportsStore: FeedbackReportRecord[] = isProduction
  ? []
  : (globalForDev.__devMemoryReportsStore ??= []);

const devMemoryRateLimitsStore = isProduction
  ? new Map<string, { count: number; windowStart: number }>()
  : (globalForDev.__devMemoryRateLimitsStore ??= new Map<string, { count: number; windowStart: number }>());

let browserClient: SupabaseClient | null = null;
let serverAdminClient: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

  if (!browserClient) {
    browserClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return browserClient;
}

export function getSupabaseAdmin(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;

  if (!serverAdminClient) {
    serverAdminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return serverAdminClient;
}

export function resetDevRateLimits(): void {
  if (!isProduction) {
    devMemoryRateLimitsStore.clear();
  }
}

/**
 * Concurrency-safe Persistent Rate Limiting
 * In production: Uses Supabase database table persistent_rate_limits with atomic checks.
 * In development: Uses in-memory map if Supabase keys are not yet configured.
 */
export async function checkDbRateLimit(
  key: string,
  maxLimit: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number }> {
  const adminClient = getSupabaseAdmin();
  const now = Date.now();

  if (adminClient) {
    try {
      // Primary: Atomic PostgreSQL RPC with row-level upsert locking
      const { data: rpcData, error: rpcErr } = await adminClient.rpc('check_and_increment_rate_limit', {
        p_key: key,
        p_max_limit: maxLimit,
        p_window_ms: windowMs,
      });

      if (!rpcErr && rpcData && typeof rpcData === 'object' && 'allowed' in rpcData) {
        return {
          allowed: Boolean((rpcData as any).allowed),
          remaining: Number((rpcData as any).remaining ?? 0),
        };
      }

      if (rpcErr) {
        console.error('[SECURITY HARDENING] Rate limit atomic RPC returned error:', rpcErr);
        if (isProduction) {
          return { allowed: false, remaining: 0 };
        }
      }
    } catch (err) {
      if (isProduction) {
        console.error('[SECURITY HARDENING] Rate limit exception in production. Failing closed:', err);
        return { allowed: false, remaining: 0 };
      }
    }
  }

  if (isProduction) {
    console.error('[SECURITY HARDENING] Missing or unreachable Supabase credentials in production rate limiting. Failing closed.');
    return { allowed: false, remaining: 0 };
  }

  return checkMemoryRateLimit(key, maxLimit, windowMs);
}

function checkMemoryRateLimit(
  key: string,
  maxLimit: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = devMemoryRateLimitsStore.get(key);

  if (!entry || now > entry.windowStart + windowMs) {
    devMemoryRateLimitsStore.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: maxLimit - 1 };
  }

  // Atomic synchronous increment ensures brand-new and existing keys are strictly limited
  entry.count += 1;
  if (entry.count > maxLimit) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: maxLimit - entry.count };
}

/**
 * Insert feedback with duplicate protection and fail-closed persistence
 */
export async function insertFeedback(data: {
  user_id?: string | null;
  author_id_hash: string;
  author_type: 'google' | 'guest';
  is_guest: boolean;
  guest_name: string;
  rating: number;
  message: string;
  section_tag: string;
  user_agent_short?: string;
}): Promise<{ success: boolean; data?: FeedbackRecord; error?: string }> {
  const adminClient = getSupabaseAdmin();

  // Duplicate content check within 1 hour
  if (adminClient) {
    try {
      const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
      const { data: duplicates } = await adminClient
        .from('feedback')
        .select('id, message')
        .eq('author_id_hash', data.author_id_hash)
        .gte('created_at', oneHourAgo);

      if (duplicates && duplicates.some((d) => d.message.trim().toLowerCase() === data.message.trim().toLowerCase())) {
        return { success: false, error: 'Duplicate feedback detected. You recently submitted this exact message.' };
      }

      const { data: inserted, error } = await adminClient
        .from('feedback')
        .insert({
          user_id: data.user_id || null,
          author_id_hash: data.author_id_hash,
          author_type: data.author_type,
          is_guest: data.is_guest,
          guest_name: data.guest_name,
          rating: data.rating,
          message: data.message,
          section_tag: data.section_tag,
          user_agent_short: data.user_agent_short || 'Desktop / Web',
          status: 'new',
          is_edited: false,
          is_hidden: false,
          is_spam: false,
          reports_count: 0,
          replies_count: 0,
        })
        .select()
        .single();

      if (error) {
        if (isProduction) {
          console.error('[SECURITY HARDENING] Supabase feedback insert error in production:', error);
          return { success: false, error: 'Database service unavailable. Please try again later.' };
        }
      } else if (inserted) {
        return { success: true, data: { ...inserted, replies: [] } };
      }
    } catch (err) {
      if (isProduction) {
        console.error('[SECURITY HARDENING] Exception during feedback insert in production:', err);
        return { success: false, error: 'Database service unavailable. Please try again later.' };
      }
    }
  }

  if (isProduction) {
    return { success: false, error: 'Database unconfigured in production environment.' };
  }

  // Development-only fallback
  const isDuplicate = devMemoryFeedbackStore.some(
    (f) =>
      f.author_id_hash === data.author_id_hash &&
      f.message.trim().toLowerCase() === data.message.trim().toLowerCase() &&
      Date.now() - new Date(f.created_at).getTime() < 3600000
  );
  if (isDuplicate) {
    return { success: false, error: 'Duplicate feedback detected. You recently submitted this exact message.' };
  }

  const newRecord: FeedbackRecord = {
    ...data,
    id: `fb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    status: 'new',
    is_edited: false,
    is_hidden: false,
    is_spam: false,
    reports_count: 0,
    replies_count: 0,
    replies: [],
    created_at: new Date().toISOString(),
  };

  devMemoryFeedbackStore.unshift(newRecord);
  return { success: true, data: newRecord };
}

/**
 * Public Discussion List (Non-hidden discussions with sanitized author hashes)
 */
export async function getPublicDiscussionList(
  page = 1,
  limit = 10
): Promise<{ discussions: FeedbackRecord[]; total: number; hasMore: boolean }> {
  const adminClient = getSupabaseAdmin();

  if (adminClient) {
    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data: feedbackData, count, error } = await adminClient
        .from('feedback')
        .select('*, feedback_replies(*)', { count: 'exact' })
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (!error && feedbackData) {
        const sanitized = feedbackData.map((fb) => ({
          id: fb.id,
          guest_name: fb.guest_name,
          rating: fb.rating,
          message: fb.message,
          section_tag: fb.section_tag,
          is_edited: fb.is_edited,
          edited_at: fb.edited_at,
          created_at: fb.created_at,
          replies_count: fb.replies_count,
          replies: (fb.feedback_replies || [])
            .filter((r: FeedbackReplyRecord) => !r.is_hidden && !r.is_spam)
            .map((r: FeedbackReplyRecord) => ({
              id: r.id,
              feedback_id: r.feedback_id,
              author_name: r.author_name,
              author_type: r.author_type,
              is_owner: r.is_owner,
              content: r.content,
              is_edited: r.is_edited,
              edited_at: r.edited_at,
              created_at: r.created_at,
            }))
            .sort(
              (a: any, b: any) =>
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            ),
        })) as unknown as FeedbackRecord[];
        return {
          discussions: sanitized,
          total: count || sanitized.length,
          hasMore: count ? to + 1 < count : false,
        };
      }

      if (isProduction) {
        console.error('[SECURITY HARDENING] Error fetching public discussions in production:', error);
        return { discussions: [], total: 0, hasMore: false };
      }
    } catch (err) {
      if (isProduction) {
        console.error('[SECURITY HARDENING] Exception fetching public discussions in production:', err);
        return { discussions: [], total: 0, hasMore: false };
      }
    }
  }

  if (isProduction) {
    return { discussions: [], total: 0, hasMore: false };
  }

  // Development-only fallback
  const visible = devMemoryFeedbackStore
    .filter((f) => !f.is_hidden)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const from = (page - 1) * limit;
  const paged = visible.slice(from, from + limit).map((fb) => ({
    id: fb.id,
    guest_name: fb.guest_name,
    rating: fb.rating,
    message: fb.message,
    section_tag: fb.section_tag,
    is_edited: fb.is_edited,
    edited_at: fb.edited_at,
    created_at: fb.created_at,
    replies_count: fb.replies_count,
    replies: (fb.replies || [])
      .filter((r) => !r.is_hidden && !r.is_spam)
      .map((r) => ({
        id: r.id,
        feedback_id: r.feedback_id,
        author_name: r.author_name,
        author_type: r.author_type,
        is_owner: r.is_owner,
        content: r.content,
        is_edited: r.is_edited,
        edited_at: r.edited_at,
        created_at: r.created_at,
      }))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
  })) as unknown as FeedbackRecord[];

  return {
    discussions: paged,
    total: visible.length,
    hasMore: from + limit < visible.length,
  };
}

/**
 * Edit Feedback (Strict server-side authorization + 24-hour window + revision logging)
 */
export async function editFeedback(
  id: string,
  newContent: string,
  authorIdHash: string,
  isOwner: boolean
): Promise<{ success: boolean; error?: string; data?: FeedbackRecord }> {
  const adminClient = getSupabaseAdmin();

  if (adminClient) {
    try {
      const { data: item, error: fetchErr } = await adminClient
        .from('feedback')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (fetchErr || !item) {
        return { success: false, error: 'Feedback not found.' };
      }

      // Authorization check
      if (!isOwner && item.author_id_hash !== authorIdHash) {
        return { success: false, error: 'Unauthorized. You can only edit your own feedback.' };
      }

      // 24-hour window check
      const createdAtMs = new Date(item.created_at).getTime();
      const diffHours = (Date.now() - createdAtMs) / (1000 * 60 * 60);
      if (!isOwner && diffHours > 24) {
        return { success: false, error: 'Editing is permanently disabled 24 hours after creation.' };
      }

      // Record revision
      const revision: FeedbackRevisionRecord = {
        id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        target_type: 'feedback',
        target_id: id,
        previous_content: item.message,
        new_content: newContent,
        editor_identity: isOwner ? 'MSG — Owner' : item.guest_name,
        editor_type: isOwner ? 'owner' : item.author_type,
        created_at: new Date().toISOString(),
      };

      await adminClient.from('feedback_revisions').insert(revision);
      const { data: updated, error: updateErr } = await adminClient
        .from('feedback')
        .update({
          message: newContent,
          is_edited: true,
          edited_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (updateErr) {
        return { success: false, error: 'Failed to update feedback in database.' };
      }

      return { success: true, data: updated };
    } catch (err) {
      if (isProduction) {
        return { success: false, error: 'Database service unavailable while updating feedback.' };
      }
    }
  }

  if (isProduction) {
    return { success: false, error: 'Database unconfigured in production environment.' };
  }

  // Development-only fallback
  const item = devMemoryFeedbackStore.find((f) => f.id === id);
  if (!item) {
    return { success: false, error: 'Feedback not found.' };
  }

  if (!isOwner && item.author_id_hash !== authorIdHash) {
    return { success: false, error: 'Unauthorized. You can only edit your own feedback.' };
  }

  const createdAtMs = new Date(item.created_at).getTime();
  const diffHours = (Date.now() - createdAtMs) / (1000 * 60 * 60);
  if (!isOwner && diffHours > 24) {
    return { success: false, error: 'Editing is permanently disabled 24 hours after creation.' };
  }

  const revision: FeedbackRevisionRecord = {
    id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    target_type: 'feedback',
    target_id: id,
    previous_content: item.message,
    new_content: newContent,
    editor_identity: isOwner ? 'MSG — Owner' : item.guest_name,
    editor_type: isOwner ? 'owner' : item.author_type,
    created_at: new Date().toISOString(),
  };
  devMemoryRevisionsStore.push(revision);

  item.message = newContent;
  item.is_edited = true;
  item.edited_at = new Date().toISOString();
  item.updated_at = new Date().toISOString();

  return { success: true, data: item };
}

/**
 * Add Reply with fail-closed duplicate and existence checks
 */
export async function insertReply(params: {
  feedback_id: string;
  content: string;
  author_name: string;
  author_type: 'owner' | 'google' | 'guest';
  author_id_hash: string;
  is_owner: boolean;
}): Promise<{ success: boolean; data?: FeedbackReplyRecord; error?: string }> {
  const adminClient = getSupabaseAdmin();

  if (adminClient) {
    try {
      // Confirm parent thread exists
      const { data: parent, error: parentErr } = await adminClient
        .from('feedback')
        .select('id, replies_count')
        .eq('id', params.feedback_id)
        .maybeSingle();

      if (parentErr || !parent) {
        return { success: false, error: 'Discussion thread not found.' };
      }

      // Duplicate reply check within 10 minutes
      const tenMinsAgo = new Date(Date.now() - 600000).toISOString();
      const { data: duplicates } = await adminClient
        .from('feedback_replies')
        .select('id, content')
        .eq('feedback_id', params.feedback_id)
        .eq('author_id_hash', params.author_id_hash)
        .gte('created_at', tenMinsAgo);

      if (duplicates && duplicates.some((d) => d.content.trim().toLowerCase() === params.content.trim().toLowerCase())) {
        return { success: false, error: 'Duplicate reply detected. Please avoid submitting identical responses.' };
      }

      const replyRecord: FeedbackReplyRecord = {
        id: `reply-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        feedback_id: params.feedback_id,
        author_name: params.is_owner ? 'MSG — Owner' : params.author_name,
        author_type: params.author_type,
        author_id_hash: params.author_id_hash,
        content: params.content.trim(),
        is_owner: params.is_owner,
        is_edited: false,
        is_hidden: false,
        is_spam: false,
        reports_count: 0,
        created_at: new Date().toISOString(),
      };

      const { data: inserted, error: insertErr } = await adminClient
        .from('feedback_replies')
        .insert(replyRecord)
        .select()
        .single();

      if (insertErr || !inserted) {
        if (isProduction) {
          return { success: false, error: 'Database service unavailable while posting reply.' };
        }
      } else {
        await adminClient
          .from('feedback')
          .update({ replies_count: (parent.replies_count || 0) + 1 })
          .eq('id', params.feedback_id);
        return { success: true, data: inserted };
      }
    } catch (err) {
      if (isProduction) {
        return { success: false, error: 'Database service unavailable while posting reply.' };
      }
    }
  }

  if (isProduction) {
    return { success: false, error: 'Database unconfigured in production environment.' };
  }

  // Development-only fallback
  const item = devMemoryFeedbackStore.find((f) => f.id === params.feedback_id);
  if (!item) {
    return { success: false, error: 'Discussion thread not found.' };
  }

  const isDuplicate = (item.replies || []).some(
    (r) =>
      r.author_id_hash === params.author_id_hash &&
      r.content.trim().toLowerCase() === params.content.trim().toLowerCase() &&
      Date.now() - new Date(r.created_at).getTime() < 600000
  );
  if (isDuplicate) {
    return { success: false, error: 'Duplicate reply detected. Please avoid submitting identical responses.' };
  }

  const replyRecord: FeedbackReplyRecord = {
    id: `reply-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    feedback_id: params.feedback_id,
    author_name: params.is_owner ? 'MSG — Owner' : params.author_name,
    author_type: params.author_type,
    author_id_hash: params.author_id_hash,
    content: params.content.trim(),
    is_owner: params.is_owner,
    is_edited: false,
    is_hidden: false,
    is_spam: false,
    reports_count: 0,
    created_at: new Date().toISOString(),
  };

  if (!item.replies) item.replies = [];
  item.replies.push(replyRecord);
  item.replies_count = item.replies.length;

  return { success: true, data: replyRecord };
}

/**
 * Edit Reply (24-hour limit check + revision logging)
 */
export async function editReply(
  replyId: string,
  newContent: string,
  authorIdHash: string,
  isOwner: boolean
): Promise<{ success: boolean; error?: string; data?: FeedbackReplyRecord }> {
  const adminClient = getSupabaseAdmin();

  if (adminClient) {
    try {
      const { data: targetReply, error: fetchErr } = await adminClient
        .from('feedback_replies')
        .select('*')
        .eq('id', replyId)
        .maybeSingle();

      if (fetchErr || !targetReply) {
        return { success: false, error: 'Reply not found.' };
      }

      if (!isOwner && targetReply.author_id_hash !== authorIdHash) {
        return { success: false, error: 'Unauthorized. You can only edit your own reply.' };
      }

      const createdAtMs = new Date(targetReply.created_at).getTime();
      const diffHours = (Date.now() - createdAtMs) / (1000 * 60 * 60);
      if (!isOwner && diffHours > 24) {
        return { success: false, error: 'Editing is permanently disabled 24 hours after creation.' };
      }

      const revision: FeedbackRevisionRecord = {
        id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        target_type: 'reply',
        target_id: replyId,
        previous_content: targetReply.content,
        new_content: newContent,
        editor_identity: isOwner ? 'MSG — Owner' : targetReply.author_name,
        editor_type: isOwner ? 'owner' : targetReply.author_type,
        created_at: new Date().toISOString(),
      };

      await adminClient.from('feedback_revisions').insert(revision);
      const { data: updated, error: updateErr } = await adminClient
        .from('feedback_replies')
        .update({
          content: newContent,
          is_edited: true,
          edited_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', replyId)
        .select()
        .single();

      if (updateErr) {
        return { success: false, error: 'Failed to update reply in database.' };
      }

      return { success: true, data: updated };
    } catch (err) {
      if (isProduction) {
        return { success: false, error: 'Database service unavailable while updating reply.' };
      }
    }
  }

  if (isProduction) {
    return { success: false, error: 'Database unconfigured in production environment.' };
  }

  // Development-only fallback
  let targetReply: FeedbackReplyRecord | null = null;
  for (const fb of devMemoryFeedbackStore) {
    const found = (fb.replies || []).find((r) => r.id === replyId);
    if (found) {
      targetReply = found;
      break;
    }
  }

  if (!targetReply) {
    return { success: false, error: 'Reply not found.' };
  }

  if (!isOwner && targetReply.author_id_hash !== authorIdHash) {
    return { success: false, error: 'Unauthorized. You can only edit your own reply.' };
  }

  const createdAtMs = new Date(targetReply.created_at).getTime();
  const diffHours = (Date.now() - createdAtMs) / (1000 * 60 * 60);
  if (!isOwner && diffHours > 24) {
    return { success: false, error: 'Editing is permanently disabled 24 hours after creation.' };
  }

  const revision: FeedbackRevisionRecord = {
    id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    target_type: 'reply',
    target_id: replyId,
    previous_content: targetReply.content,
    new_content: newContent,
    editor_identity: isOwner ? 'MSG — Owner' : targetReply.author_name,
    editor_type: isOwner ? 'owner' : targetReply.author_type,
    created_at: new Date().toISOString(),
  };
  devMemoryRevisionsStore.push(revision);

  targetReply.content = newContent;
  targetReply.is_edited = true;
  targetReply.edited_at = new Date().toISOString();
  targetReply.updated_at = new Date().toISOString();

  return { success: true, data: targetReply };
}

/**
 * Report Content (Spam / abuse flag)
 */
export async function reportContent(params: {
  target_type: 'feedback' | 'reply';
  target_id: string;
  reason: string;
  reporter_hash: string;
}): Promise<{ success: boolean; error?: string }> {
  const adminClient = getSupabaseAdmin();

  if (adminClient) {
    try {
      const { data: existing } = await adminClient
        .from('feedback_reports')
        .select('id')
        .eq('target_id', params.target_id)
        .eq('reporter_hash', params.reporter_hash)
        .maybeSingle();

      if (existing) {
        return { success: false, error: 'You have already reported this item.' };
      }

      await adminClient.from('feedback_reports').insert({
        target_type: params.target_type,
        target_id: params.target_id,
        reason: params.reason,
        reporter_hash: params.reporter_hash,
        status: 'pending',
      });

      return { success: true };
    } catch (err) {
      if (isProduction) {
        return { success: false, error: 'Failed to record report in database.' };
      }
    }
  }

  if (isProduction) {
    return { success: false, error: 'Database unconfigured in production environment.' };
  }

  // Development-only fallback
  const existing = devMemoryReportsStore.find(
    (r) =>
      r.target_id === params.target_id &&
      r.reporter_hash === params.reporter_hash &&
      r.target_type === params.target_type
  );
  if (existing) {
    return { success: false, error: 'You have already reported this item.' };
  }

  const reportRecord: FeedbackReportRecord = {
    id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    target_type: params.target_type,
    target_id: params.target_id,
    reason: params.reason,
    reporter_hash: params.reporter_hash,
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  devMemoryReportsStore.push(reportRecord);
  return { success: true };
}

/**
 * Get Revisions for Admin Inspection
 */
export async function getRevisions(
  targetType: 'feedback' | 'reply',
  targetId: string
): Promise<FeedbackRevisionRecord[]> {
  const adminClient = getSupabaseAdmin();
  if (adminClient) {
    try {
      const { data } = await adminClient
        .from('feedback_revisions')
        .select('*')
        .eq('target_type', targetType)
        .eq('target_id', targetId)
        .order('created_at', { ascending: false });
      if (data) return data;
    } catch {}
  }

  if (isProduction) {
    return [];
  }

  return devMemoryRevisionsStore
    .filter((r) => r.target_type === targetType && r.target_id === targetId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/**
 * Get Feedback Counts for Analytics
 */
export async function getFeedbackStats(): Promise<{ googleCount: number; guestCount: number }> {
  const adminClient = getSupabaseAdmin();
  if (adminClient) {
    try {
      const { count: googleCount } = await adminClient
        .from('feedback')
        .select('*', { count: 'exact', head: true })
        .eq('is_guest', false);
      const { count: guestCount } = await adminClient
        .from('feedback')
        .select('*', { count: 'exact', head: true })
        .eq('is_guest', true);
      return {
        googleCount: googleCount || 0,
        guestCount: guestCount || 0,
      };
    } catch {}
  }

  const list = devMemoryFeedbackStore || [];
  return {
    googleCount: list.filter((f) => !f.is_guest).length,
    guestCount: list.filter((f) => f.is_guest).length,
  };
}

/**
 * Fetch feedback list (Admin only)
 */
export async function getFeedbackList(statusFilter?: string): Promise<FeedbackRecord[]> {
  const adminClient = getSupabaseAdmin();

  if (adminClient) {
    try {
      let query = adminClient
        .from('feedback')
        .select('*, feedback_replies(*)')
        .order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        if (statusFilter === 'spam') {
          query = query.or('status.eq.spam,is_spam.eq.true');
        } else {
          query = query.eq('status', statusFilter);
        }
      }
      const { data, error } = await query;
      if (!error && data) {
        return data.map((fb) => ({
          ...fb,
          replies: (fb.feedback_replies || []).sort(
            (a: FeedbackReplyRecord, b: FeedbackReplyRecord) =>
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          ),
        }));
      }

      if (isProduction) {
        return [];
      }
    } catch (err) {
      if (isProduction) {
        return [];
      }
    }
  }

  if (isProduction) {
    return [];
  }

  if (statusFilter && statusFilter !== 'all') {
    if (statusFilter === 'spam') {
      return devMemoryFeedbackStore.filter((f) => f.status === 'spam' || f.is_spam || f.reports_count > 0);
    }
    return devMemoryFeedbackStore.filter((f) => f.status === statusFilter);
  }
  return devMemoryFeedbackStore;
}

/**
 * Update feedback status & moderation (Admin only)
 */
export async function updateFeedbackStatus(
  id: string,
  status: FeedbackRecord['status'],
  opts?: { is_hidden?: boolean; is_spam?: boolean }
): Promise<boolean> {
  const adminClient = getSupabaseAdmin();
  if (adminClient) {
    try {
      const { error } = await adminClient
        .from('feedback')
        .update({
          status,
          ...(opts?.is_hidden !== undefined ? { is_hidden: opts.is_hidden } : {}),
          ...(opts?.is_spam !== undefined ? { is_spam: opts.is_spam } : {}),
        })
        .eq('id', id);
      if (!error) return true;
    } catch {}
  }

  if (isProduction) {
    return false;
  }

  const item = devMemoryFeedbackStore.find((f) => f.id === id);
  if (item) {
    item.status = status;
    if (opts?.is_hidden !== undefined) item.is_hidden = opts.is_hidden;
    if (opts?.is_spam !== undefined) item.is_spam = opts.is_spam;
    return true;
  }

  return false;
}

/**
 * Delete feedback (Admin only)
 */
export async function deleteFeedbackRecord(id: string): Promise<boolean> {
  const adminClient = getSupabaseAdmin();
  if (adminClient) {
    try {
      await adminClient.from('feedback_replies').delete().eq('feedback_id', id);
      const { error } = await adminClient.from('feedback').delete().eq('id', id);
      if (!error) return true;
    } catch {}
  }

  if (isProduction) {
    return false;
  }

  const idx = devMemoryFeedbackStore.findIndex((f) => f.id === id);
  if (idx !== -1) {
    devMemoryFeedbackStore.splice(idx, 1);
    return true;
  }

  return false;
}

/**
 * Delete Reply (Admin only or Author)
 */
export async function deleteReplyRecord(replyId: string): Promise<boolean> {
  const adminClient = getSupabaseAdmin();
  if (adminClient) {
    try {
      const { error } = await adminClient.from('feedback_replies').delete().eq('id', replyId);
      if (!error) return true;
    } catch {}
  }

  if (isProduction) {
    return false;
  }

  for (const fb of devMemoryFeedbackStore) {
    const idx = (fb.replies || []).findIndex((r) => r.id === replyId);
    if (idx !== -1) {
      fb.replies!.splice(idx, 1);
      fb.replies_count = fb.replies!.length;
      return true;
    }
  }

  return false;
}
