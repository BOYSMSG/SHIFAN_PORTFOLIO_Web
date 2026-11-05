'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Star,
  CornerDownRight,
  Send,
  Edit2,
  Check,
  X,
  Flag,
  Clock,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Heart,
  Flame,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { FeedbackRecord, FeedbackReplyRecord, getSupabaseBrowser } from '@/lib/supabase';
import { formatDateTimeIST, formatTimeAgo } from '@/utils/dateFormatter';

export default function CommunityDiscussions() {
  const [discussions, setDiscussions] = useState<FeedbackRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  // Sorting & Like states
  const [sortBy, setSortBy] = useState<'hot' | 'top' | 'recent'>('hot');
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [likingIds, setLikingIds] = useState<Set<string>>(new Set());

  // Active reply form state
  const [currentUser, setCurrentUser] = useState<{ name: string; email?: string } | null>(null);
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  // Active edit state for feedback
  const [editingFeedbackId, setEditingFeedbackId] = useState<string | null>(null);
  const [editFeedbackText, setEditFeedbackText] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Active edit state for reply
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editReplyText, setEditReplyText] = useState('');
  const [submittingReplyEdit, setSubmittingReplyEdit] = useState(false);
  const [editReplyError, setEditReplyError] = useState<string | null>(null);

  // Reporting state
  const [reportingItem, setReportingItem] = useState<{ type: 'feedback' | 'reply'; id: string } | null>(null);
  const [reportReason, setReportReason] = useState('Inappropriate or spam content');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  const prefersReducedMotion = useReducedMotion();

  // Load liked items from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('shifan_liked_feedback_ids');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed === 'object' && parsed !== null) {
          setLikedMap(parsed);
        }
      }
    } catch {}
  }, []);

  const saveLikedMap = (newMap: Record<string, boolean>) => {
    setLikedMap(newMap);
    try {
      localStorage.setItem('shifan_liked_feedback_ids', JSON.stringify(newMap));
    } catch {}
  };

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const headers: Record<string, string> = {};
    try {
      const supabase = getSupabaseBrowser();
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
      }
    } catch {}
    return headers;
  };

  const fetchDiscussions = async (pageNum = 1, append = false, currentSort = sortBy) => {
    try {
      if (!append) setLoading(true);
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`/api/feedback?public=true&page=${pageNum}&limit=5&sort=${currentSort}`, {
        headers: authHeaders,
      });
      if (res.ok) {
        const data = await res.json();
        const incomingDiscussions: FeedbackRecord[] = data.discussions || [];

        // Sync likedMap with incoming server user_has_liked
        setLikedMap((prev) => {
          const next = { ...prev };
          for (const item of incomingDiscussions) {
            if (item.user_has_liked !== undefined && item.user_has_liked) {
              next[item.id] = true;
            }
          }
          return next;
        });

        if (append) {
          setDiscussions((prev) => [...prev, ...incomingDiscussions]);
        } else {
          setDiscussions(incomingDiscussions);
        }
        setTotal(data.total || 0);
        setHasMore(data.hasMore || false);
        setPage(pageNum);
      }
    } catch (err) {
      console.error('Failed to load discussions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = (newSort: 'hot' | 'top' | 'recent') => {
    if (newSort === sortBy) return;
    setSortBy(newSort);
    fetchDiscussions(1, false, newSort);
  };

  const handleLikeToggle = async (feedbackId: string) => {
    if (likingIds.has(feedbackId)) return;

    const isCurrentlyLiked = Boolean(likedMap[feedbackId]);
    const nextLikedState = !isCurrentlyLiked;

    // Optimistic UI update
    const newLikedMap = { ...likedMap, [feedbackId]: nextLikedState };
    saveLikedMap(newLikedMap);

    setDiscussions((prev) =>
      prev.map((item) => {
        if (item.id === feedbackId) {
          const currentCount = item.likes_count || 0;
          return {
            ...item,
            likes_count: nextLikedState ? currentCount + 1 : Math.max(0, currentCount - 1),
            user_has_liked: nextLikedState,
          };
        }
        return item;
      })
    );

    setLikingIds((prev) => new Set(prev).add(feedbackId));

    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/feedback/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({ feedbackId }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.likesCount !== undefined) {
          setDiscussions((prev) =>
            prev.map((item) =>
              item.id === feedbackId ? { ...item, likes_count: data.likesCount } : item
            )
          );
        }
      } else {
        // Revert on error
        saveLikedMap({ ...likedMap, [feedbackId]: isCurrentlyLiked });
        setDiscussions((prev) =>
          prev.map((item) => {
            if (item.id === feedbackId) {
              const count = item.likes_count || 0;
              return {
                ...item,
                likes_count: isCurrentlyLiked ? count + 1 : Math.max(0, count - 1),
                user_has_liked: isCurrentlyLiked,
              };
            }
            return item;
          })
        );
      }
    } catch {
      // Revert on network exception
      saveLikedMap({ ...likedMap, [feedbackId]: isCurrentlyLiked });
    } finally {
      setLikingIds((prev) => {
        const next = new Set(prev);
        next.delete(feedbackId);
        return next;
      });
    }
  };

  useEffect(() => {
    fetchDiscussions(1, false);

    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Verified User';
        setCurrentUser({ name, email: user.email });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Verified User';
        setCurrentUser({ name, email: session.user.email });
      } else {
        setCurrentUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleGoogleSignIn = async () => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/#community` : undefined,
      },
    });
  };

  const handlePostReply = async (feedbackId: string) => {
    if (!replyText.trim()) return;
    if (!currentUser) {
      setReplyError('Please sign in with Google to post a reply.');
      return;
    }
    setSubmittingReply(true);
    setReplyError(null);

    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/feedback/replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          feedback_id: feedbackId,
          content: replyText.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setReplyError(json.error || 'Failed to submit reply.');
        return;
      }

      // Optimistic update
      setDiscussions((prev) =>
        prev.map((fb) => {
          if (fb.id === feedbackId) {
            const replies = fb.replies ? [...fb.replies, json.data] : [json.data];
            return { ...fb, replies, replies_count: replies.length };
          }
          return fb;
        })
      );

      setReplyText('');
      setActiveReplyId(null);
    } catch (err) {
      console.error('Error posting reply:', err);
      setReplyError('Network error while posting reply.');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleSaveFeedbackEdit = async (id: string) => {
    if (!editFeedbackText.trim()) return;
    setSubmittingEdit(true);
    setEditError(null);

    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          id,
          message: editFeedbackText.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setEditError(json.error || 'Failed to edit feedback.');
        return;
      }

      setDiscussions((prev) =>
        prev.map((fb) =>
          fb.id === id ? { ...fb, message: editFeedbackText.trim(), is_edited: true, edited_at: new Date().toISOString() } : fb
        )
      );

      setEditingFeedbackId(null);
      setEditFeedbackText('');
    } catch (err) {
      console.error('Error editing feedback:', err);
      setEditError('Network error while updating feedback.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleSaveReplyEdit = async (replyId: string) => {
    if (!editReplyText.trim()) return;
    setSubmittingReplyEdit(true);
    setEditReplyError(null);

    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/feedback/replies', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          id: replyId,
          content: editReplyText.trim(),
        }),
      });

      const json = await res.json();
      if (res.ok) {
        setDiscussions((prev) =>
          prev.map((fb) => ({
            ...fb,
            replies: (fb.replies || []).map((r) =>
              r.id === replyId ? { ...r, content: editReplyText.trim(), is_edited: true, edited_at: new Date().toISOString() } : r
            ),
          }))
        );
        setEditingReplyId(null);
        setEditReplyText('');
      } else {
        setEditReplyError(json.error || 'Failed to edit reply.');
      }
    } catch (err) {
      console.error('Error editing reply:', err);
      setEditReplyError('Network error while updating reply.');
    } finally {
      setSubmittingReplyEdit(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!reportingItem) return;
    setSubmittingReport(true);
    setReportError(null);

    try {
      const res = await fetch('/api/feedback/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_type: reportingItem.type,
          target_id: reportingItem.id,
          reason: reportReason,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setReportSubmitted(reportingItem.id);
        setTimeout(() => {
          setReportingItem(null);
          setReportSubmitted(null);
        }, 1800);
      } else {
        setReportError(json.error || 'Failed to submit report.');
      }
    } catch (err) {
      console.error('Report submission failed:', err);
      setReportError('Network error while submitting report.');
    } finally {
      setSubmittingReport(false);
    }
  };

  const expandAnimation = prefersReducedMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, height: 0 },
        animate: { opacity: 1, height: 'auto', transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] as const } },
        exit: { opacity: 0, height: 0, transition: { duration: 0.18, ease: 'easeOut' as const } },
      };

  return (
    <div className="mt-16 pt-16 border-t border-slate-200/80">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-electric-ice border border-electric-blue/20 text-electric-blue text-xs font-semibold mb-2">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Community Threads ({total})</span>
          </div>
          <h3 className="text-2xl font-bold text-midnight-900 tracking-tight">
            Visitor Discussions &amp; Verified Replies
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real feedback from community visitors, developers, and official responses from BOYS MSG.
          </p>
        </div>

        {/* Algorithm Sort Selector */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-2xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => handleSortChange('hot')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              sortBy === 'hot'
                ? 'bg-electric-blue text-white shadow-xs'
                : 'text-slate-600 hover:text-midnight-900 hover:bg-slate-50'
            }`}
            title="Ranked by active discussion, community likes, and recency decay"
          >
            <Flame className="w-3.5 h-3.5 text-amber-300" />
            <span>Trending</span>
          </button>
          <button
            type="button"
            onClick={() => handleSortChange('top')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              sortBy === 'top'
                ? 'bg-electric-blue text-white shadow-xs'
                : 'text-slate-600 hover:text-midnight-900 hover:bg-slate-50'
            }`}
            title="Ranked by total likes and highest star rating"
          >
            <Star className="w-3.5 h-3.5" />
            <span>Top Liked</span>
          </button>
          <button
            type="button"
            onClick={() => handleSortChange('recent')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              sortBy === 'recent'
                ? 'bg-electric-blue text-white shadow-xs'
                : 'text-slate-600 hover:text-midnight-900 hover:bg-slate-50'
            }`}
            title="Newest submissions first"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Recent</span>
          </button>
        </div>
      </div>

      {/* Discussion List */}
      <div className="space-y-6">
        {loading && discussions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200">
            <RefreshCw className="w-6 h-6 border-electric-blue text-electric-blue animate-spin mx-auto mb-3" />
            <p className="text-xs font-medium text-slate-400">Loading community discussions...</p>
          </div>
        ) : discussions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-6">
            <p className="text-sm font-semibold text-slate-600">No community feedback yet.</p>
            <p className="text-xs text-slate-400 mt-1">Be the first to share your thoughts by clicking "Share Feedback"!</p>
          </div>
        ) : (
          discussions.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-7 shadow-sm hover:border-electric-blue/30 transition-all duration-300"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-electric-ice to-white border border-electric-blue/20 flex items-center justify-center text-electric-blue font-bold text-sm shadow-sm flex-shrink-0">
                    {item.guest_name.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-midnight-900">{item.guest_name}</span>
                      {item.is_guest ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          Guest
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-electric-blue border border-blue-200 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          Verified
                        </span>
                      )}
                      <span className="text-[11px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                        #{item.section_tag}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex items-center text-amber-400" aria-label={`Rating: ${item.rating} out of 5 stars`}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              star <= item.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-slate-300">•</span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1.5 flex-wrap" title={`Original Post: ${formatDateTimeIST(item.created_at)}`}>
                        <Clock className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span>{formatDateTimeIST(item.created_at)}</span>
                        <span className="text-slate-300">({formatTimeAgo(item.created_at)})</span>
                      </span>
                      {item.is_edited && (
                        <span
                          className="text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200/70 px-1.5 py-0.5 rounded shadow-2xs"
                          title={`Last edited: ${formatDateTimeIST(item.edited_at)}`}
                        >
                          Edited {item.edited_at ? `· ${formatDateTimeIST(item.edited_at)}` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Report Action Button */}
                <button
                  type="button"
                  onClick={() => {
                    setReportingItem({ type: 'feedback', id: item.id });
                    setReportError(null);
                  }}
                  className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer"
                  title="Report inappropriate content"
                  aria-label="Report content"
                >
                  <Flag className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Message Content or Edit Input */}
              <AnimatePresence mode="wait">
                {editingFeedbackId === item.id ? (
                  <motion.div
                    key="edit-form"
                    {...expandAnimation}
                    className="mb-4 p-4 rounded-2xl bg-ice-50 border border-electric-blue/30 space-y-3 overflow-hidden"
                  >
                    <textarea
                      value={editFeedbackText}
                      onChange={(e) => setEditFeedbackText(e.target.value)}
                      rows={3}
                      className="w-full text-xs sm:text-sm p-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-electric-blue text-midnight-900 resize-none"
                      placeholder="Update your feedback..."
                    />
                    {editError && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" /> {editError}
                      </p>
                    )}
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingFeedbackId(null);
                          setEditError(null);
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-200/50 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveFeedbackEdit(item.id)}
                        disabled={submittingEdit || !editFeedbackText.trim()}
                        className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-electric-blue hover:bg-blue-600 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                      >
                        {submittingEdit ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <span>Save Edit</span>
                        )}
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-4 whitespace-pre-wrap">
                    {item.message}
                  </p>
                )}
              </AnimatePresence>

              {/* Thread Actions */}
              <div className="flex items-center gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                {/* Like Button */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={() => handleLikeToggle(item.id)}
                  disabled={likingIds.has(item.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    likedMap[item.id]
                      ? 'bg-rose-50 text-rose-600 border border-rose-200 shadow-2xs'
                      : 'bg-slate-50 text-slate-600 hover:text-rose-600 hover:bg-rose-50/50 border border-slate-200/80'
                  }`}
                  title={likedMap[item.id] ? 'Liked! Click to remove like' : 'Like this feedback discussion'}
                  aria-label={`Like feedback (${item.likes_count || 0} likes)`}
                >
                  <Heart
                    className={`w-3.5 h-3.5 transition-all ${
                      likedMap[item.id] ? 'fill-rose-500 text-rose-500 scale-110' : 'text-slate-400'
                    }`}
                  />
                  <span className="font-mono text-xs">{item.likes_count || 0}</span>
                </motion.button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveReplyId(activeReplyId === item.id ? null : item.id);
                    setReplyError(null);
                  }}
                  className="inline-flex items-center gap-1.5 font-semibold text-electric-blue hover:text-blue-700 transition-colors cursor-pointer"
                >
                  <CornerDownRight className="w-3.5 h-3.5" />
                  <span>Reply ({item.replies_count || item.replies?.length || 0})</span>
                </button>

                {/* Edit Button (Authorized Owner or Original Author only) */}
                {item.can_edit && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingFeedbackId(item.id);
                      setEditFeedbackText(item.message);
                      setEditError(null);
                    }}
                    className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors ml-auto cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit Feedback</span>
                  </button>
                )}
              </div>

              {/* Expandable Inline Reply Input */}
              <AnimatePresence>
                {activeReplyId === item.id && (
                  <motion.div
                    key="reply-form"
                    {...expandAnimation}
                    className="mt-4 p-4 rounded-2xl bg-ice-50/90 border border-slate-200/80 space-y-3 overflow-hidden"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <CornerDownRight className="w-4 h-4 text-electric-blue" />
                        <span className="text-xs font-bold text-midnight-900">Add Community Reply</span>
                      </div>
                      {currentUser && (
                        <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-md font-medium">
                          <ShieldCheck className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                          <span>Replying as <strong>{currentUser.name}</strong></span>
                        </div>
                      )}
                    </div>

                    {!currentUser ? (
                      <div className="p-4 rounded-xl bg-white border border-slate-200 text-center space-y-2.5">
                        <div className="flex flex-col items-center gap-1">
                          <ShieldCheck className="w-5 h-5 text-electric-blue" />
                          <h4 className="text-xs font-bold text-midnight-900">Google Sign-in Required to Reply</h4>
                          <p className="text-[11px] text-slate-500 max-w-sm">
                            To prevent spam and spoofing, replies require a verified Google account.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleGoogleSignIn}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white text-midnight-900 border border-slate-200 hover:border-electric-blue shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                          </svg>
                          <span>Sign In with Google</span>
                        </button>
                      </div>
                    ) : (
                      <>
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          rows={2}
                          placeholder={`Write your reply, ${currentUser.name}...`}
                          className="w-full text-xs p-2.5 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-electric-blue text-midnight-900 resize-none"
                        />
                        {replyError && (
                          <p className="text-xs text-red-600 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 flex-shrink-0" /> {replyError}
                          </p>
                        )}
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveReplyId(null);
                              setReplyError(null);
                            }}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-200/50 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePostReply(item.id)}
                            disabled={submittingReply || !replyText.trim()}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-electric-blue hover:bg-blue-600 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
                          >
                            {submittingReply ? (
                              <>
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                <span>Posting...</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-3 h-3" />
                                <span>Post Reply</span>
                              </>
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Nested Replies List */}
              {item.replies && item.replies.length > 0 && (
                <div className="mt-5 pt-4 border-t border-slate-100 space-y-3 pl-3 sm:pl-6">
                  {item.replies.map((reply) => {
                    const isOwnerReply = reply.is_owner || reply.author_type === 'owner';
                    return (
                      <div
                        key={reply.id}
                        className={`p-4 rounded-2xl transition-all ${
                          isOwnerReply
                            ? 'bg-gradient-to-r from-electric-ice/70 via-white to-ice-50 border-2 border-electric-blue/40 shadow-sm'
                            : 'bg-ice-50/60 border border-slate-200/70'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-midnight-900">
                              {reply.author_name}
                            </span>
                            {isOwnerReply ? (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-gradient-to-r from-electric-blue to-electric-cyan text-white shadow-xs flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" />
                                MSG — Owner Verified
                              </span>
                            ) : reply.author_type === 'google' ? (
                              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-electric-blue border border-blue-200">
                                Verified
                              </span>
                            ) : (
                              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                                Guest
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 flex items-center gap-1" title={`Posted: ${formatDateTimeIST(reply.created_at)}`}>
                              <Clock className="w-2.5 h-2.5 text-slate-400 flex-shrink-0" />
                              <span>{formatDateTimeIST(reply.created_at)}</span>
                              <span className="text-slate-300">({formatTimeAgo(reply.created_at)})</span>
                            </span>
                            {reply.is_edited && (
                              <span
                                className="text-[9px] font-medium text-slate-500 bg-slate-100 border border-slate-200/60 px-1 py-0.2 rounded"
                                title={`Last edited: ${formatDateTimeIST(reply.edited_at)}`}
                              >
                                Edited {reply.edited_at ? `· ${formatDateTimeIST(reply.edited_at)}` : ''}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            {/* Edit Button (Authorized Owner or Original Author only) */}
                            {reply.can_edit && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingReplyId(reply.id);
                                  setEditReplyText(reply.content);
                                  setEditReplyError(null);
                                }}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded transition-colors cursor-pointer"
                                title="Edit reply"
                                aria-label="Edit reply"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setReportingItem({ type: 'reply', id: reply.id });
                                setReportError(null);
                              }}
                              className="text-slate-300 hover:text-red-500 transition-colors p-1 rounded cursor-pointer"
                              title="Report reply"
                              aria-label="Report reply"
                            >
                              <Flag className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Inline Reply Edit Form */}
                        {editingReplyId === reply.id ? (
                          <div className="mt-2 space-y-2">
                            <textarea
                              value={editReplyText}
                              onChange={(e) => setEditReplyText(e.target.value)}
                              rows={2}
                              className="w-full text-xs p-2 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-electric-blue text-midnight-900 resize-none"
                            />
                            {editReplyError && (
                              <p className="text-xs text-red-600 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 flex-shrink-0" /> {editReplyError}
                              </p>
                            )}
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingReplyId(null);
                                  setEditReplyError(null);
                                }}
                                className="px-2.5 py-1 rounded text-xs text-slate-500 cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveReplyEdit(reply.id)}
                                disabled={submittingReplyEdit || !editReplyText.trim()}
                                className="px-3 py-1 rounded text-xs font-bold text-white bg-electric-blue hover:bg-blue-600 disabled:opacity-50 cursor-pointer"
                              >
                                {submittingReplyEdit ? 'Saving...' : 'Save'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {reply.content}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination Load More */}
      {hasMore && (
        <div className="text-center mt-8">
          <button
            type="button"
            onClick={() => fetchDiscussions(page + 1, true)}
            className="px-6 py-2.5 rounded-full text-xs font-bold text-electric-blue bg-white border border-electric-blue/30 hover:bg-electric-ice transition-all shadow-sm cursor-pointer"
          >
            Load More Discussions &darr;
          </button>
        </div>
      )}

      {/* Report Modal Dialog with AnimatePresence */}
      <AnimatePresence>
        {reportingItem && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-dialog-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReportingItem(null)}
              className="absolute inset-0 bg-midnight-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 10 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white rounded-3xl border border-slate-200 p-6 max-w-sm w-full shadow-2xl space-y-4 z-10"
            >
              <div className="flex items-center justify-between">
                <h4 id="report-dialog-title" className="text-sm font-bold text-midnight-900 flex items-center gap-2">
                  <Flag className="w-4 h-4 text-red-500" />
                  Report Content
                </h4>
                <button
                  type="button"
                  onClick={() => setReportingItem(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded cursor-pointer"
                  aria-label="Close report modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {reportSubmitted === reportingItem.id ? (
                <div className="text-center py-4 space-y-2">
                  <Check className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="text-xs font-bold text-emerald-600">Report Submitted</p>
                  <p className="text-[11px] text-slate-400">Our moderation team will review this item shortly.</p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-slate-600">
                    Help keep the community constructive. Please indicate why you are flagging this content:
                  </p>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-midnight-900 focus:outline-none focus:border-electric-blue"
                  >
                    <option value="Inappropriate or spam content">Inappropriate or spam content</option>
                    <option value="Harassment or abusive language">Harassment or abusive language</option>
                    <option value="Misleading or off-topic information">Misleading or off-topic information</option>
                    <option value="Duplicate spam flooding">Duplicate spam flooding</option>
                  </select>

                  {reportError && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" /> {reportError}
                    </p>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setReportingItem(null)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmitReport}
                      disabled={submittingReport}
                      className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                    >
                      {submittingReport ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <span>Submit Report</span>
                      )}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
