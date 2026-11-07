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
  can_edit?: boolean;
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
  likes_count?: number;
  user_has_liked?: boolean;
  hot_score?: number;
  replies?: FeedbackReplyRecord[];
  can_edit?: boolean;
  created_at: string;
  updated_at?: string;
}

export type ProjectCategory = 'Founder Venture' | 'Minecraft Architecture' | 'Web & Platform' | 'AI & Tools' | 'Open Source' | 'Infrastructure';
export type ProjectStatus = 'planning' | 'in_development' | 'active' | 'completed' | 'paused' | 'archived';

export interface ProjectRecord {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  category: ProjectCategory | string;
  role: string;
  short_description: string;
  full_description?: string;
  cover_image?: string;
  technologies: string[];
  highlights: string[];
  start_date?: string;
  completion_date?: string;
  status: ProjectStatus;
  github_url?: string;
  demo_url?: string;
  docs_url?: string;
  external_links?: { title: string; url: string }[];
  is_featured: boolean;
  display_order: number;
  created_at: string;
  updated_at?: string;
}

export type JournalCategory = 'Work Updates' | 'Features' | 'Bug Fixes' | 'Infrastructure' | 'Milestones' | 'Learning & Experiments' | 'Experiments' | 'Launches';
export type JournalStatus = 'published' | 'draft';

export interface JournalEntryRecord {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  category: JournalCategory | string;
  tags: string[];
  cover_image?: string;
  github_url?: string;
  demo_url?: string;
  project_id?: string | null;
  project_name?: string;
  external_links?: { title: string; url: string }[];
  status: JournalStatus;
  is_pinned: boolean;
  views_count: number;
  published_at: string;
  created_at: string;
  updated_at?: string;
}

const globalForDev = globalThis as unknown as {
  __devMemoryFeedbackStore?: FeedbackRecord[];
  __devMemoryRevisionsStore?: FeedbackRevisionRecord[];
  __devMemoryReportsStore?: FeedbackReportRecord[];
  __devMemoryRateLimitsStore?: Map<string, { count: number; windowStart: number }>;
  __devMemoryProjectsStore?: ProjectRecord[];
  __devMemoryJournalStore?: JournalEntryRecord[];
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
 * Helper to fetch like counts and voter status for a set of feedback IDs
 */
async function getLikesMapForFeedback(
  feedbackIds: string[],
  voterHash?: string
): Promise<{ counts: Record<string, number>; userLikes: Record<string, boolean> }> {
  const adminClient = getSupabaseAdmin();
  const counts: Record<string, number> = {};
  const userLikes: Record<string, boolean> = {};

  if (!adminClient || feedbackIds.length === 0) {
    return { counts, userLikes };
  }

  try {
    const keys = [
      ...feedbackIds.map((id) => `like_cnt:${id}`),
      ...(voterHash ? feedbackIds.map((id) => `like_vote:${id}:${voterHash}`) : []),
    ];

    const { data } = await adminClient
      .from('persistent_rate_limits')
      .select('key, count')
      .in('key', keys);

    if (data) {
      for (const row of data) {
        if (row.key.startsWith('like_cnt:')) {
          const id = row.key.slice('like_cnt:'.length);
          counts[id] = row.count || 0;
        } else if (voterHash && row.key.startsWith('like_vote:')) {
          const id = row.key.split(':')[1];
          userLikes[id] = true;
        }
      }
    }
  } catch {}

  return { counts, userLikes };
}

/**
 * Atomic like / unlike toggle for feedback items
 */
export async function toggleFeedbackLike(
  feedbackId: string,
  voterHash: string
): Promise<{ success: boolean; liked: boolean; likesCount: number; error?: string }> {
  const adminClient = getSupabaseAdmin();
  if (!adminClient) {
    return { success: false, liked: false, likesCount: 0, error: 'Database service unavailable.' };
  }

  // 1. Try native RPC toggle_feedback_like if migration is active
  try {
    const { data: rpcData, error: rpcErr } = await adminClient.rpc('toggle_feedback_like', {
      p_feedback_id: feedbackId,
      p_voter_hash: voterHash,
    });
    if (!rpcErr && rpcData && typeof rpcData.liked === 'boolean') {
      return {
        success: true,
        liked: rpcData.liked,
        likesCount: rpcData.likes_count ?? 0,
      };
    }
  } catch {}

  // 2. High-resilience fallback using persistent_rate_limits
  try {
    const voteKey = `like_vote:${feedbackId}:${voterHash}`;
    const countKey = `like_cnt:${feedbackId}`;

    const { data: existingVote } = await adminClient
      .from('persistent_rate_limits')
      .select('key')
      .eq('key', voteKey)
      .maybeSingle();

    let liked = false;
    if (existingVote) {
      // Remove like
      await adminClient.from('persistent_rate_limits').delete().eq('key', voteKey);
      liked = false;
    } else {
      // Insert like
      await adminClient.from('persistent_rate_limits').upsert({
        key: voteKey,
        count: 1,
        window_start: new Date().toISOString(),
        expires_at: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
      });
      liked = true;
    }

    // Get current total count
    const { data: countRecord } = await adminClient
      .from('persistent_rate_limits')
      .select('count')
      .eq('key', countKey)
      .maybeSingle();

    let currentCount = countRecord?.count || 0;
    currentCount = liked ? currentCount + 1 : Math.max(0, currentCount - 1);

    await adminClient.from('persistent_rate_limits').upsert({
      key: countKey,
      count: currentCount,
      window_start: new Date().toISOString(),
      expires_at: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
    });

    // Also attempt to update feedback table if likes_count column exists
    try {
      await adminClient
        .from('feedback')
        .update({ likes_count: currentCount })
        .eq('id', feedbackId);
    } catch {}

    return { success: true, liked, likesCount: currentCount };
  } catch (err: any) {
    return { success: false, liked: false, likesCount: 0, error: err?.message || 'Failed to toggle like.' };
  }
}

/**
 * Public Discussion List (Non-hidden discussions with sanitized author hashes and authorized edit rights)
 */
export async function getPublicDiscussionList(
  page = 1,
  limit = 10,
  callerIdentity?: { hash?: string; isOwner?: boolean },
  sortBy: 'hot' | 'top' | 'recent' = 'hot'
): Promise<{ discussions: FeedbackRecord[]; total: number; hasMore: boolean }> {
  const adminClient = getSupabaseAdmin();

  if (adminClient) {
    try {
      const { data: feedbackData, count, error } = await adminClient
        .from('feedback')
        .select('*, feedback_replies(*)', { count: 'exact' })
        .eq('is_hidden', false);

      if (!error && feedbackData) {
        const feedbackIds = feedbackData.map((fb) => fb.id);
        const { counts: likesCounts, userLikes } = await getLikesMapForFeedback(
          feedbackIds,
          callerIdentity?.hash
        );

        const sanitized = feedbackData.map((fb) => {
          const within24h = Date.now() - new Date(fb.created_at).getTime() < 24 * 60 * 60 * 1000;
          const isAuthor = Boolean(callerIdentity?.hash) && fb.author_id_hash === callerIdentity?.hash;
          const canEdit = Boolean(callerIdentity?.isOwner) || (isAuthor && within24h);
          const likesCount = (fb.likes_count !== undefined && fb.likes_count !== null)
            ? Number(fb.likes_count)
            : (likesCounts[fb.id] || 0);
          const userHasLiked = Boolean(userLikes[fb.id]);

          // Trending / Hot score algorithm:
          // HotScore = (Likes * 3.0 + Replies * 4.0 + RatingBonus + 1.0) / (Hours + 2.0)^1.25
          const hoursSince = Math.max(0, (Date.now() - new Date(fb.created_at).getTime()) / (1000 * 60 * 60));
          const ratingBonus = fb.rating >= 5 ? 2.5 : fb.rating >= 4 ? 1.5 : 0.5;
          const repliesCount = Number(fb.replies_count || (fb.feedback_replies?.length || 0));
          const engagementPoints = (likesCount * 3.0) + (repliesCount * 4.0) + ratingBonus + 1.0;
          const timeDecay = Math.pow(hoursSince + 2.0, 1.25);
          const hotScore = engagementPoints / timeDecay;

          return {
            id: fb.id,
            guest_name: fb.guest_name,
            rating: fb.rating,
            message: fb.message,
            section_tag: fb.section_tag,
            is_edited: fb.is_edited,
            edited_at: fb.edited_at,
            created_at: fb.created_at,
            replies_count: repliesCount,
            likes_count: likesCount,
            user_has_liked: userHasLiked,
            hot_score: hotScore,
            can_edit: canEdit,
            replies: (fb.feedback_replies || [])
              .filter((r: FeedbackReplyRecord) => !r.is_hidden && !r.is_spam)
              .map((r: FeedbackReplyRecord) => {
                const replyWithin24h = Date.now() - new Date(r.created_at).getTime() < 24 * 60 * 60 * 1000;
                const isReplyAuthor = Boolean(callerIdentity?.hash) && r.author_id_hash === callerIdentity?.hash;
                const canEditReply = Boolean(callerIdentity?.isOwner) || (isReplyAuthor && replyWithin24h);

                return {
                  id: r.id,
                  feedback_id: r.feedback_id,
                  author_name: r.author_name,
                  author_type: r.author_type,
                  is_owner: r.is_owner,
                  content: r.content,
                  is_edited: r.is_edited,
                  edited_at: r.edited_at,
                  created_at: r.created_at,
                  can_edit: canEditReply,
                };
              })
              .sort(
                (a: any, b: any) =>
                  new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              ),
          };
        }) as unknown as FeedbackRecord[];

        // Apply ranking / sorting algorithm
        if (sortBy === 'hot') {
          sanitized.sort((a, b) => ((b.hot_score || 0) - (a.hot_score || 0)));
        } else if (sortBy === 'top') {
          sanitized.sort((a, b) => {
            const diffLikes = (b.likes_count || 0) - (a.likes_count || 0);
            if (diffLikes !== 0) return diffLikes;
            const diffRating = b.rating - a.rating;
            if (diffRating !== 0) return diffRating;
            return (b.replies_count || 0) - (a.replies_count || 0);
          });
        } else {
          // recent
          sanitized.sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        }

        const total = sanitized.length;
        const from = (page - 1) * limit;
        const paged = sanitized.slice(from, from + limit);

        return {
          discussions: paged,
          total,
          hasMore: from + limit < total,
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
  const paged = visible.slice(from, from + limit).map((fb) => {
    const within24h = Date.now() - new Date(fb.created_at).getTime() < 24 * 60 * 60 * 1000;
    const isAuthor = Boolean(callerIdentity?.hash) && fb.author_id_hash === callerIdentity?.hash;
    const canEdit = Boolean(callerIdentity?.isOwner) || (isAuthor && within24h);

    return {
      id: fb.id,
      guest_name: fb.guest_name,
      rating: fb.rating,
      message: fb.message,
      section_tag: fb.section_tag,
      is_edited: fb.is_edited,
      edited_at: fb.edited_at,
      created_at: fb.created_at,
      replies_count: fb.replies_count,
      can_edit: canEdit,
      replies: (fb.replies || [])
        .filter((r) => !r.is_hidden && !r.is_spam)
        .map((r) => {
          const replyWithin24h = Date.now() - new Date(r.created_at).getTime() < 24 * 60 * 60 * 1000;
          const isReplyAuthor = Boolean(callerIdentity?.hash) && r.author_id_hash === callerIdentity?.hash;
          const canEditReply = Boolean(callerIdentity?.isOwner) || (isReplyAuthor && replyWithin24h);

          return {
            id: r.id,
            feedback_id: r.feedback_id,
            author_name: r.author_name,
            author_type: r.author_type,
            is_owner: r.is_owner,
            content: r.content,
            is_edited: r.is_edited,
            edited_at: r.edited_at,
            created_at: r.created_at,
            can_edit: canEditReply,
          };
        })
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    };
  }) as unknown as FeedbackRecord[];

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

      const insertPayload = {
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
      };

      const { data: inserted, error: insertErr } = await adminClient
        .from('feedback_replies')
        .insert(insertPayload)
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


// ============================================================
// PROJECTS & DEVELOPER JOURNAL DATA ACCESS LAYER
// ============================================================

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const initialDevProjects: ProjectRecord[] = [
  {
    id: 'proj-pokefun',
    slug: 'pokefun-network',
    name: 'Pokefun Network & SMP',
    tagline: 'Minecraft Community & Multiplayer Server Ecosystem',
    category: 'Founder Venture',
    role: 'Founder & Lead Server Architect',
    short_description: 'A high-performance multiplayer Minecraft server community platform featuring SMP survival, custom Cobblemon systems, automated player rank delivery, and community events.',
    full_description: `# Pokefun Network & SMP Ecosystem\n\nPokefun is an active multiplayer Minecraft community and server ecosystem founded and managed by **Mohd Shifan Gouri (BOYS MSG)**.\n\n### Architecture & Highlights\n- High-tickrate PaperMC server optimization with custom Java plugin tuning\n- Linux system administration, automated restart watchdogs, and daily backup rotations\n- Seamless web store rank delivery integration with instant player provisioning\n- Scalable community infrastructure serving thousands of active players and Discord community members\n\n### Technical Stack\n- **Engine:** PaperMC / Java\n- **Host:** High-Performance Linux VPS\n- **Data:** MySQL Relational Storage\n- **Integrations:** Automated Store Webhooks, Discord API`,
    cover_image: '/assets/YoutubeThumbnailDownload.com-HTIGNHNVafw-full-hd-(1280×720).jpg',
    technologies: ['Java', 'PaperMC', 'Linux', 'MySQL', 'Webhooks', 'Discord API'],
    highlights: [
      'Configured and maintained PaperMC game server files, plugins, and permissions',
      'Connected automated web store rank fulfillment via store.pokefun.in',
      'Lead player community management, Discord moderation, and in-game events',
    ],
    start_date: '2023',
    status: 'active',
    demo_url: 'https://pokefun.in/team',
    is_featured: true,
    display_order: 1,
    created_at: new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'proj-cobbledrock',
    slug: 'cobbledrock',
    name: 'CobbleDrock',
    tagline: 'Cobblemon & Bedrock Experience Network',
    category: 'Minecraft Architecture',
    role: 'Founder & Modpack Configurator',
    short_description: 'A dedicated Cobblemon server setup integrating Pokémon-style gameplay mechanics into Minecraft with cross-platform tuning for Bedrock and Java players.',
    full_description: `# CobbleDrock Modpack & Platform\n\nCobbleDrock bridges custom open-source Cobblemon mechanics with accessible Bedrock cross-play connectivity.\n\n### Engineering Highlights\n- Extensive compatibility benchmarking for item textures, movesets, and spawning curves\n- Optimized entity ticking rates to maintain constant 20.0 TPS under peak player load\n- Built dedicated community support pipelines and interactive troubleshooting guides`,
    technologies: ['Cobblemon Modding', 'Server Config', 'GeyserMC', 'Linux', 'Discord API'],
    highlights: [
      'Tested and tuned Cobblemon mod files and compatibility settings',
      'Built Discord player support channels and troubleshooting guides',
      'Iterated on configurations directly from player feedback and bug reports',
    ],
    start_date: '2023',
    status: 'active',
    demo_url: 'https://cobblemon.pokefun.in/',
    is_featured: true,
    display_order: 2,
    created_at: new Date(Date.now() - 280 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'proj-pokedrock',
    slug: 'pokedrock',
    name: 'Pokedrock Platform',
    tagline: 'Resource Hub & Player Portal',
    category: 'Web & Platform',
    role: 'Web Developer & Resource Curator',
    short_description: 'A modern web portal providing installation tutorials, resource pack downloads, and connectivity guides for community players.',
    full_description: `# Pokedrock Platform & Resource Hub\n\nPokedrock is a streamlined resource distribution platform for Minecraft players.\n\n### Features\n- Fast static CDN delivery for client resource packs and mod installation guides\n- Mobile-optimized responsive interface with step-by-step visual instructions\n- Integrated directly with Discord support channels for seamless player onboarding`,
    technologies: ['HTML5', 'Tailwind CSS', 'JavaScript', 'Documentation CDN'],
    highlights: [
      'Designed and built responsive portal layout for smooth player onboarding',
      'Curated and hosted client resource packs and mod installation steps',
      'Connected download portal with Discord support channels',
    ],
    start_date: '2024',
    status: 'active',
    demo_url: 'https://pokedrock.pokefun.in/',
    is_featured: false,
    display_order: 3,
    created_at: new Date(Date.now() - 180 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'proj-ai-workflow',
    slug: 'ai-workflow-engine',
    name: 'Applied AI Engineering Practice',
    tagline: 'Prompt Architecture, Verification & Build Verification Gates',
    category: 'Web & Platform',
    role: 'Independent Developer',
    short_description: 'A systematic engineering methodology combining modern Large Language Models with strict manual code inspection, automated regression testing, and verification gates.',
    full_description: `# Applied AI Engineering Practice\n\nA rigorous personal software development workflow developed by Mohd Shifan Gouri.\n\n### Core Tenets\n- Strict specification and context scoping prior to code generation\n- Line-by-line manual code inspection—no blind copy-pasting\n- Automated TypeScript compilation and regression test suites before staging\n- Production-first security modeling with zero plaintext credentials`,
    technologies: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Manual Code Review', 'Git'],
    highlights: [
      'Structured prompt workflows for rapid component scaffolding',
      'Rigorous manual line-by-line review of all AI-generated code',
      'Automated type checking and build verification gates prior to deployment',
    ],
    start_date: '2024',
    status: 'active',
    demo_url: 'https://shifan.pokefun.in/',
    is_featured: false,
    display_order: 4,
    created_at: new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString(),
  },
];

const initialDevJournal: JournalEntryRecord[] = [
  {
    id: 'journal-papermc-tuning',
    slug: 'pokefun-infrastructure-performance-tuning',
    title: 'Pokefun Infrastructure: PaperMC Performance Tuning & 20 TPS Optimization',
    summary: 'Detailed breakdown of entity ticking optimizations, memory garbage collection parameters, and network packet compression on the Pokefun Linux host.',
    content: `## Infrastructure & Performance Overview\n\nMaintaining a persistent 20.0 TPS (ticks per second) on an active Minecraft server with high entity counts requires methodical tuning across both the Java Virtual Machine and PaperMC configuration layers.\n\n### Key Optimizations Applied\n1. **Aikar Garbage Collection Flags:** Implemented fine-tuned G1GC parameters to eliminate multi-second garbage collection pauses during world chunk loading.\n2. **Entity Despawn Ranges & Ticking Limits:** Reduced unnecessary passive mob ticking outside player sight radiuses, recovering approximately **18% CPU headroom**.\n3. **Network Compression Threshold:** Tuned network compression to prevent network buffer bottlenecks while minimizing CPU compression overhead on high-frequency packets.\n\n### Results\n- Average server tick time decreased from 38ms to **19ms** under peak weekend traffic.\n- Zero player-reported rubberbanding during community tournament events.`,
    category: 'Infrastructure',
    tags: ['PaperMC', 'Linux', 'Java', 'Server Ops', 'Performance'],
    project_id: 'proj-pokefun',
    project_name: 'Pokefun Network & SMP',
    status: 'published',
    is_pinned: true,
    views_count: 142,
    published_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'journal-dynamic-release',
    slug: 'dynamic-developer-journal-release',
    title: 'Launching the Dynamic Developer Journal & Live Project Portfolio',
    summary: 'Transformed the personal portfolio into a continuously updated living developer log featuring dynamic project management and GitHub integration.',
    content: `## Why I Built the Developer Journal\n\nStatic portfolios get outdated fast. As developers, we build, debug, experiment, and deploy new things every week. I wanted a platform where I could publish daily progress, share GitHub repositories, and document milestones in real-time.\n\n### What Was Built\n- **Chronological Work Journal:** Markdown-powered timeline with categories, tags, and direct GitHub links.\n- **Dynamic Project Showcase:** Database-driven project cards and dedicated case study pages.\n- **Protected Admin Publishing Center:** Fast mobile-friendly publishing dashboard with draft preview support.\n- **GitHub API Integration:** Automated repository stars, language, and activity badge integration.\n\nNow, any visitor can see real-time engineering updates and explore code as it evolves.`,
    category: 'Launches',
    tags: ['Next.js', 'TypeScript', 'Supabase', 'Tailwind CSS', 'POKEDEVS'],
    project_id: 'proj-ai-workflow',
    project_name: 'Applied AI Engineering Practice',
    status: 'published',
    is_pinned: true,
    views_count: 89,
    published_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'journal-security-hardening',
    slug: 'community-security-and-anti-abuse-hardening',
    title: 'Architecting Server-Side Anti-Spam & Atomic Rate-Limiting Protection',
    summary: 'How we hardened the community feedback and discussion system with atomic PostgreSQL rate limiting and IP-bound admin sessions.',
    content: `## Security Engineering Summary\n\nWhen opening up public feedback and community discussions, robust abuse protection is mandatory.\n\n### Security Implementations\n- **Atomic PostgreSQL RPCs:** Rate limits enforced atomically in database transactions to prevent race conditions during concurrent visitor submissions.\n- **HMAC IP-Bound Sessions:** Admin cookies are cryptographically signed with PBKDF2 hashes and strictly bound to the verified reverse-proxy client IP.\n- **Zero Leaked Data:** Private voter hashes, reporter IPs, and moderation flags are strictly filtered out before sending responses to public clients.`,
    category: 'Features',
    tags: ['Security', 'PostgreSQL', 'Auth', 'Edge Middleware'],
    project_id: 'proj-ai-workflow',
    project_name: 'Applied AI Engineering Practice',
    status: 'published',
    is_pinned: false,
    views_count: 67,
    published_at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    created_at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
  },
];

export const devMemoryProjectsStore: ProjectRecord[] =
  globalForDev.__devMemoryProjectsStore ?? (globalForDev.__devMemoryProjectsStore = [...initialDevProjects]);

export const devMemoryJournalStore: JournalEntryRecord[] =
  globalForDev.__devMemoryJournalStore ?? (globalForDev.__devMemoryJournalStore = [...initialDevJournal]);

// ----------------------------------------------------
// PROJECT DATA ACCESS METHODS
// ----------------------------------------------------

export async function getPublicProjectsList(options?: {
  category?: string;
  featuredOnly?: boolean;
}): Promise<ProjectRecord[]> {
  const adminClient = getSupabaseAdmin();
  if (adminClient) {
    try {
      let query = adminClient
        .from('projects')
        .select('*')
        .neq('status', 'archived')
        .order('is_featured', { ascending: false })
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (options?.category && options.category !== 'All') {
        query = query.eq('category', options.category);
      }
      if (options?.featuredOnly) {
        query = query.eq('is_featured', true);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as ProjectRecord[];
      }
    } catch {}
  }

  // Graceful fallback to in-memory store
  let list = devMemoryProjectsStore.filter((p) => p.status !== 'archived');
  if (options?.category && options.category !== 'All') {
    list = list.filter((p) => p.category === options.category);
  }
  if (options?.featuredOnly) {
    list = list.filter((p) => p.is_featured);
  }

  return list.sort((a, b) => {
    if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
    return a.display_order - b.display_order;
  });
}

export async function getProjectBySlug(slug: string): Promise<{
  project: ProjectRecord | null;
  relatedJournal: JournalEntryRecord[];
}> {
  const adminClient = getSupabaseAdmin();
  let project: ProjectRecord | null = null;
  let relatedJournal: JournalEntryRecord[] = [];

  if (adminClient) {
    try {
      const { data: projData } = await adminClient
        .from('projects')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (projData) {
        project = projData as ProjectRecord;
        const { data: journalData } = await adminClient
          .from('journal_entries')
          .select('*')
          .eq('status', 'published')
          .or(`project_id.eq.${projData.id},project_name.eq.${projData.name}`)
          .order('published_at', { ascending: false });

        if (journalData) {
          relatedJournal = journalData as JournalEntryRecord[];
        }
        return { project, relatedJournal };
      }
    } catch {}
  }

  // Fallback
  project = devMemoryProjectsStore.find((p) => p.slug === slug) || null;
  if (project) {
    relatedJournal = devMemoryJournalStore
      .filter((j) => j.status === 'published' && (j.project_id === project?.id || j.project_name === project?.name))
      .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
  }

  return { project, relatedJournal };
}

export async function getAllProjectsForAdmin(): Promise<ProjectRecord[]> {
  const adminClient = getSupabaseAdmin();
  if (adminClient) {
    try {
      const { data, error } = await adminClient
        .from('projects')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data as ProjectRecord[];
      }
    } catch {}
  }

  return [...devMemoryProjectsStore].sort((a, b) => a.display_order - b.display_order);
}

export async function createProject(
  payload: Partial<ProjectRecord>
): Promise<{ success: boolean; data?: ProjectRecord; error?: string }> {
  if (!payload.name || !payload.name.trim()) {
    return { success: false, error: 'Project name is required.' };
  }
  const name = payload.name.trim();
  const slug = payload.slug ? slugify(payload.slug) : slugify(name);

  const adminClient = getSupabaseAdmin();
  if (adminClient) {
    try {
      const { data, error } = await adminClient
        .from('projects')
        .insert({
          slug,
          name,
          tagline: payload.tagline || 'Software Development Project',
          category: payload.category || 'Web & Platform',
          role: payload.role || 'Lead Developer',
          short_description: payload.short_description || '',
          full_description: payload.full_description || '',
          cover_image: payload.cover_image || null,
          technologies: payload.technologies || [],
          highlights: payload.highlights || [],
          start_date: payload.start_date || new Date().getFullYear().toString(),
          completion_date: payload.completion_date || null,
          status: payload.status || 'in_development',
          github_url: payload.github_url || null,
          demo_url: payload.demo_url || null,
          docs_url: payload.docs_url || null,
          external_links: payload.external_links || [],
          is_featured: Boolean(payload.is_featured),
          display_order: Number(payload.display_order || 0),
        })
        .select()
        .single();

      if (!error && data) {
        return { success: true, data: data as ProjectRecord };
      }
      if (error?.code === '23505') {
        return { success: false, error: 'A project with this URL slug already exists.' };
      }
    } catch {}
  }

  // Fallback
  if (devMemoryProjectsStore.some((p) => p.slug === slug)) {
    return { success: false, error: 'A project with this URL slug already exists.' };
  }

  const newProj: ProjectRecord = {
    id: `proj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    slug,
    name,
    tagline: payload.tagline || 'Software Development Project',
    category: payload.category || 'Web & Platform',
    role: payload.role || 'Lead Developer',
    short_description: payload.short_description || '',
    full_description: payload.full_description || '',
    cover_image: payload.cover_image,
    technologies: payload.technologies || [],
    highlights: payload.highlights || [],
    start_date: payload.start_date || new Date().getFullYear().toString(),
    completion_date: payload.completion_date,
    status: payload.status || 'in_development',
    github_url: payload.github_url,
    demo_url: payload.demo_url,
    docs_url: payload.docs_url,
    external_links: payload.external_links || [],
    is_featured: Boolean(payload.is_featured),
    display_order: Number(payload.display_order || 0),
    created_at: new Date().toISOString(),
  };

  devMemoryProjectsStore.unshift(newProj);
  return { success: true, data: newProj };
}

export async function updateProject(
  id: string,
  updates: Partial<ProjectRecord>
): Promise<{ success: boolean; data?: ProjectRecord; error?: string }> {
  const adminClient = getSupabaseAdmin();
  if (adminClient) {
    try {
      const updateData: any = { ...updates, updated_at: new Date().toISOString() };
      delete updateData.id;
      if (updateData.slug) updateData.slug = slugify(updateData.slug);

      const { data, error } = await adminClient
        .from('projects')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        return { success: true, data: data as ProjectRecord };
      }
    } catch {}
  }

  const idx = devMemoryProjectsStore.findIndex((p) => p.id === id);
  if (idx === -1) {
    return { success: false, error: 'Project not found.' };
  }

  devMemoryProjectsStore[idx] = {
    ...devMemoryProjectsStore[idx],
    ...updates,
    slug: updates.slug ? slugify(updates.slug) : devMemoryProjectsStore[idx].slug,
    updated_at: new Date().toISOString(),
  };

  return { success: true, data: devMemoryProjectsStore[idx] };
}

export async function deleteProject(id: string): Promise<{ success: boolean; error?: string }> {
  const adminClient = getSupabaseAdmin();
  if (adminClient) {
    try {
      const { error } = await adminClient.from('projects').delete().eq('id', id);
      if (!error) return { success: true };
    } catch {}
  }

  const idx = devMemoryProjectsStore.findIndex((p) => p.id === id);
  if (idx !== -1) {
    devMemoryProjectsStore.splice(idx, 1);
    return { success: true };
  }

  return { success: false, error: 'Project not found.' };
}

// ----------------------------------------------------
// DEVELOPER JOURNAL DATA ACCESS METHODS
// ----------------------------------------------------

export async function getPublicJournalEntries(
  page = 1,
  limit = 10,
  options?: { category?: string; tag?: string; search?: string; projectId?: string }
): Promise<{ entries: JournalEntryRecord[]; total: number; hasMore: boolean }> {
  const adminClient = getSupabaseAdmin();
  if (adminClient) {
    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = adminClient
        .from('journal_entries')
        .select('*', { count: 'exact' })
        .eq('status', 'published')
        .order('is_pinned', { ascending: false })
        .order('published_at', { ascending: false });

      if (options?.category && options.category !== 'All') {
        query = query.eq('category', options.category);
      }
      if (options?.projectId) {
        query = query.eq('project_id', options.projectId);
      }
      if (options?.tag) {
        query = query.contains('tags', [options.tag]);
      }
      if (options?.search && options.search.trim()) {
        const s = options.search.trim();
        query = query.or(`title.ilike.%${s}%,summary.ilike.%${s}%,content.ilike.%${s}%`);
      }

      const { data, count, error } = await query.range(from, to);
      if (!error && data && data.length > 0) {
        return {
          entries: data as JournalEntryRecord[],
          total: count || data.length,
          hasMore: count ? to + 1 < count : false,
        };
      }
    } catch {}
  }

  // Fallback
  let list = devMemoryJournalStore.filter((j) => j.status === 'published');
  if (options?.category && options.category !== 'All') {
    list = list.filter((j) => j.category === options.category);
  }
  if (options?.projectId) {
    list = list.filter((j) => j.project_id === options.projectId);
  }
  if (options?.tag) {
    list = list.filter((j) => j.tags.includes(options.tag!));
  }
  if (options?.search && options.search.trim()) {
    const s = options.search.trim().toLowerCase();
    list = list.filter(
      (j) =>
        j.title.toLowerCase().includes(s) ||
        j.summary.toLowerCase().includes(s) ||
        j.content.toLowerCase().includes(s)
    );
  }

  list.sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
    return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
  });

  const total = list.length;
  const from = (page - 1) * limit;
  const paged = list.slice(from, from + limit);

  return {
    entries: paged,
    total,
    hasMore: from + limit < total,
  };
}

export async function getJournalEntryBySlug(
  slug: string,
  includeDraft = false
): Promise<JournalEntryRecord | null> {
  const adminClient = getSupabaseAdmin();
  if (adminClient) {
    try {
      let query = adminClient.from('journal_entries').select('*').eq('slug', slug);
      if (!includeDraft) {
        query = query.eq('status', 'published');
      }
      const { data, error } = await query.maybeSingle();
      if (!error && data) {
        return data as JournalEntryRecord;
      }
    } catch {}
  }

  const found = devMemoryJournalStore.find((j) => j.slug === slug);
  if (!found) return null;
  if (!includeDraft && found.status !== 'published') return null;
  return found;
}

export async function getAllJournalEntriesForAdmin(options?: {
  status?: string;
  category?: string;
  search?: string;
}): Promise<JournalEntryRecord[]> {
  const adminClient = getSupabaseAdmin();
  if (adminClient) {
    try {
      let query = adminClient
        .from('journal_entries')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('published_at', { ascending: false });

      if (options?.status && options.status !== 'all') {
        query = query.eq('status', options.status);
      }
      if (options?.category && options.category !== 'all') {
        query = query.eq('category', options.category);
      }

      const { data, error } = await query;
      if (!error && data) {
        let result = data as JournalEntryRecord[];
        if (options?.search && options.search.trim()) {
          const s = options.search.trim().toLowerCase();
          result = result.filter(
            (j) => j.title.toLowerCase().includes(s) || j.summary.toLowerCase().includes(s)
          );
        }
        return result;
      }
    } catch {}
  }

  let list = [...devMemoryJournalStore];
  if (options?.status && options.status !== 'all') {
    list = list.filter((j) => j.status === options.status);
  }
  if (options?.category && options.category !== 'all') {
    list = list.filter((j) => j.category === options.category);
  }
  if (options?.search && options.search.trim()) {
    const s = options.search.trim().toLowerCase();
    list = list.filter(
      (j) => j.title.toLowerCase().includes(s) || j.summary.toLowerCase().includes(s)
    );
  }

  return list.sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
    return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
  });
}

export async function createJournalEntry(
  payload: Partial<JournalEntryRecord>
): Promise<{ success: boolean; data?: JournalEntryRecord; error?: string }> {
  if (!payload.title || !payload.title.trim()) {
    return { success: false, error: 'Title is required for journal entries.' };
  }
  if (!payload.content || !payload.content.trim()) {
    return { success: false, error: 'Content is required.' };
  }

  const title = payload.title.trim();
  const slug = payload.slug ? slugify(payload.slug) : slugify(title);
  const summary = payload.summary?.trim() || payload.content.trim().slice(0, 180) + '...';

  const adminClient = getSupabaseAdmin();
  if (adminClient) {
    try {
      const { data, error } = await adminClient
        .from('journal_entries')
        .insert({
          slug,
          title,
          summary,
          content: payload.content.trim(),
          category: payload.category || 'Features',
          tags: payload.tags || [],
          cover_image: payload.cover_image || null,
          github_url: payload.github_url || null,
          demo_url: payload.demo_url || null,
          project_id: payload.project_id || null,
          project_name: payload.project_name || null,
          external_links: payload.external_links || [],
          status: payload.status || 'published',
          is_pinned: Boolean(payload.is_pinned),
          published_at: payload.published_at || new Date().toISOString(),
        })
        .select()
        .single();

      if (!error && data) {
        return { success: true, data: data as JournalEntryRecord };
      }
      if (error?.code === '23505') {
        return { success: false, error: 'A journal update with this URL slug already exists.' };
      }
    } catch {}
  }

  // Fallback
  if (devMemoryJournalStore.some((j) => j.slug === slug)) {
    return { success: false, error: 'A journal update with this URL slug already exists.' };
  }

  const newEntry: JournalEntryRecord = {
    id: `journal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    slug,
    title,
    summary,
    content: payload.content.trim(),
    category: payload.category || 'Features',
    tags: payload.tags || [],
    cover_image: payload.cover_image,
    github_url: payload.github_url,
    demo_url: payload.demo_url,
    project_id: payload.project_id || null,
    project_name: payload.project_name,
    external_links: payload.external_links || [],
    status: payload.status || 'published',
    is_pinned: Boolean(payload.is_pinned),
    views_count: 0,
    published_at: payload.published_at || new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  devMemoryJournalStore.unshift(newEntry);
  return { success: true, data: newEntry };
}

export async function updateJournalEntry(
  id: string,
  updates: Partial<JournalEntryRecord>
): Promise<{ success: boolean; data?: JournalEntryRecord; error?: string }> {
  const adminClient = getSupabaseAdmin();
  if (adminClient) {
    try {
      const updateData: any = { ...updates, updated_at: new Date().toISOString() };
      delete updateData.id;
      if (updateData.slug) updateData.slug = slugify(updateData.slug);

      const { data, error } = await adminClient
        .from('journal_entries')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        return { success: true, data: data as JournalEntryRecord };
      }
    } catch {}
  }

  const idx = devMemoryJournalStore.findIndex((j) => j.id === id);
  if (idx === -1) {
    return { success: false, error: 'Journal entry not found.' };
  }

  devMemoryJournalStore[idx] = {
    ...devMemoryJournalStore[idx],
    ...updates,
    slug: updates.slug ? slugify(updates.slug) : devMemoryJournalStore[idx].slug,
    updated_at: new Date().toISOString(),
  };

  return { success: true, data: devMemoryJournalStore[idx] };
}

export async function deleteJournalEntry(id: string): Promise<{ success: boolean; error?: string }> {
  const adminClient = getSupabaseAdmin();
  if (adminClient) {
    try {
      const { error } = await adminClient.from('journal_entries').delete().eq('id', id);
      if (!error) return { success: true };
    } catch {}
  }

  const idx = devMemoryJournalStore.findIndex((j) => j.id === id);
  if (idx !== -1) {
    devMemoryJournalStore.splice(idx, 1);
    return { success: true };
  }

  return { success: false, error: 'Journal entry not found.' };
}

export async function toggleJournalStatus(
  id: string,
  newStatus: 'published' | 'draft'
): Promise<{ success: boolean; error?: string }> {
  return updateJournalEntry(id, { status: newStatus });
}

export async function toggleJournalPin(
  id: string,
  isPinned: boolean
): Promise<{ success: boolean; error?: string }> {
  return updateJournalEntry(id, { is_pinned: isPinned });
}

export async function incrementJournalViews(slug: string): Promise<void> {
  const adminClient = getSupabaseAdmin();
  if (adminClient) {
    try {
      const { data } = await adminClient
        .from('journal_entries')
        .select('id, views_count')
        .eq('slug', slug)
        .maybeSingle();

      if (data) {
        await adminClient
          .from('journal_entries')
          .update({ views_count: (data.views_count || 0) + 1 })
          .eq('id', data.id);
        return;
      }
    } catch {}
  }

  const entry = devMemoryJournalStore.find((j) => j.slug === slug);
  if (entry) {
    entry.views_count = (entry.views_count || 0) + 1;
  }
}

