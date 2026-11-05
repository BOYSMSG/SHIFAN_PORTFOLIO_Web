'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageSquareText,
  Star,
  CheckCircle2,
  Bookmark,
  Archive,
  Trash2,
  Search,
  RefreshCw,
  Eye,
  EyeOff,
  History,
  Send,
  Sparkles,
  Edit2,
  Flag,
  AlertTriangle,
  X,
} from 'lucide-react';
import { FeedbackRecord, FeedbackReplyRecord, FeedbackRevisionRecord } from '@/lib/supabase';
import { formatDateTimeIST } from '@/utils/dateFormatter';

export default function AdminFeedbackPage() {
  const router = useRouter();
  const [feedbackList, setFeedbackList] = useState<FeedbackRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'google' | 'guest'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Owner reply form state (mapped by feedback id)
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Revision history modal state
  const [revisionModal, setRevisionModal] = useState<{
    targetType: 'feedback' | 'reply';
    targetId: string;
    revisions: FeedbackRevisionRecord[];
    loading: boolean;
  } | null>(null);

  // Edit owner reply state
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editReplyText, setEditReplyText] = useState('');

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/feedback?status=${statusFilter}`);
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setFeedbackList(data.feedback || []);
      }
    } catch (err) {
      console.error('Failed to load feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, [statusFilter]);

  const handleStatusChange = async (
    id: string,
    newStatus: FeedbackRecord['status'],
    opts?: { is_hidden?: boolean; is_spam?: boolean }
  ) => {
    setUpdatingId(id);
    try {
      const res = await fetch('/api/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus, ...opts }),
      });
      if (res.ok) {
        setFeedbackList((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: newStatus,
                  ...(opts?.is_hidden !== undefined ? { is_hidden: opts.is_hidden } : {}),
                  ...(opts?.is_spam !== undefined ? { is_spam: opts.is_spam } : {}),
                }
              : item
          )
        );
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently remove this feedback thread and all replies?')) return;
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/feedback?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setFeedbackList((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete feedback:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePostOwnerReply = async (feedbackId: string) => {
    if (!replyText.trim()) return;
    setSubmittingReply(true);

    try {
      const res = await fetch('/api/feedback/replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedback_id: feedbackId,
          content: replyText.trim(),
        }),
      });

      const json = await res.json();
      if (res.ok) {
        setFeedbackList((prev) =>
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
      } else {
        alert(json.error || 'Failed to post reply.');
      }
    } catch (err) {
      console.error('Error posting owner reply:', err);
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleSaveReplyEdit = async (replyId: string) => {
    if (!editReplyText.trim()) return;

    try {
      const res = await fetch('/api/feedback/replies', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: replyId,
          content: editReplyText.trim(),
        }),
      });

      const json = await res.json();
      if (res.ok) {
        setFeedbackList((prev) =>
          prev.map((fb) => ({
            ...fb,
            replies: (fb.replies || []).map((r) =>
              r.id === replyId
                ? {
                    ...r,
                    content: editReplyText.trim(),
                    is_edited: true,
                    edited_at: new Date().toISOString(),
                  }
                : r
            ),
          }))
        );
        setEditingReplyId(null);
        setEditReplyText('');
      } else {
        alert(json.error || 'Failed to edit reply.');
      }
    } catch (err) {
      console.error('Error updating reply:', err);
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!confirm('Are you sure you want to delete this reply?')) return;

    try {
      const res = await fetch(`/api/feedback/replies?id=${replyId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setFeedbackList((prev) =>
          prev.map((fb) => ({
            ...fb,
            replies: (fb.replies || []).filter((r) => r.id !== replyId),
          }))
        );
      }
    } catch (err) {
      console.error('Error deleting reply:', err);
    }
  };

  const handleOpenRevisions = async (targetType: 'feedback' | 'reply', targetId: string) => {
    setRevisionModal({ targetType, targetId, revisions: [], loading: true });
    try {
      const res = await fetch(`/api/feedback/revisions?target_type=${targetType}&target_id=${targetId}`);
      if (res.ok) {
        const data = await res.json();
        setRevisionModal({ targetType, targetId, revisions: data.revisions || [], loading: false });
      }
    } catch (err) {
      console.error('Failed to load revisions:', err);
      setRevisionModal((prev) => (prev ? { ...prev, loading: false } : null));
    }
  };

  // Filter list by source and search query
  const filteredList = feedbackList.filter((item) => {
    if (sourceFilter === 'google' && item.is_guest) return false;
    if (sourceFilter === 'guest' && !item.is_guest) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.guest_name.toLowerCase().includes(q);
      const matchMsg = item.message.toLowerCase().includes(q);
      const matchSec = item.section_tag.toLowerCase().includes(q);
      return matchName || matchMsg || matchSec;
    }
    return true;
  });

  const statusTabs = [
    { id: 'all', label: 'All Discussions' },
    { id: 'new', label: 'New' },
    { id: 'important', label: 'Starred' },
    { id: 'reviewed', label: 'Reviewed' },
    { id: 'spam', label: 'Spam & Reported' },
    { id: 'archived', label: 'Archived' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <span className="text-xs font-mono font-bold text-electric-blue uppercase tracking-wider">
            Discussion &amp; Moderation Hub
          </span>
          <h1 className="text-3xl font-extrabold text-midnight-900 tracking-tight mt-1">
            Community Discussions &amp; Moderation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Reply as verified owner, review revision histories, inspect threaded conversations, and moderate content.
          </p>
        </div>

        <button
          onClick={fetchFeedback}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 hover:text-electric-blue border border-slate-200 shadow-2xs hover:shadow-xs transition-all self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-electric-blue' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? 'bg-midnight-900 text-white font-bold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-midnight-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Source & Search */}
        <div className="flex items-center gap-2.5">
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as 'all' | 'google' | 'guest')}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 font-medium outline-none focus:border-electric-blue"
          >
            <option value="all">All Sources</option>
            <option value="google">Google Auth Only</option>
            <option value="guest">Guests Only</option>
          </select>

          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search discussions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 border border-slate-200 text-midnight-900 placeholder-slate-400 focus:bg-white focus:border-electric-blue outline-none transition-all"
            />
          </div>
        </div>

      </div>

      {/* Feedback List */}
      <div className="space-y-5">
        {loading ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-electric-blue mb-3" />
            <p className="text-xs font-semibold">Loading visitor discussions...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-500">
            <MessageSquareText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <h4 className="text-sm font-bold text-midnight-900">No Feedback Matches Current Filter</h4>
            <p className="text-xs text-slate-500 mt-1">Adjust filters or check back when new reviews arrive.</p>
          </div>
        ) : (
          filteredList.map((item) => (
            <div
              key={item.id}
              className={`rounded-2xl bg-white border p-6 shadow-2xs transition-all ${
                item.is_hidden
                  ? 'border-slate-300 opacity-60 bg-slate-50/50'
                  : item.status === 'spam' || item.is_spam
                  ? 'border-red-300/80 bg-red-50/20'
                  : item.status === 'important'
                  ? 'border-amber-300/80 bg-amber-50/20'
                  : item.status === 'new'
                  ? 'border-electric-blue/30 bg-electric-ice/15'
                  : 'border-slate-200/80'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-midnight-900 uppercase">
                    {item.guest_name.slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-midnight-900">{item.guest_name}</h3>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        item.is_guest
                          ? 'bg-slate-100 text-slate-600 border border-slate-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {item.is_guest ? 'Guest' : 'Verified Google'}
                      </span>
                      <span className="text-[10px] font-mono text-electric-blue bg-electric-ice px-2 py-0.5 rounded">
                        #{item.section_tag}
                      </span>
                      {item.is_edited && (
                        <button
                          onClick={() => handleOpenRevisions('feedback', item.id)}
                          className="text-[10px] font-semibold text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <History className="w-3 h-3" /> (Edited)
                        </button>
                      )}
                      {item.is_hidden && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                          Hidden
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-400">
                      <span>{formatDateTimeIST(item.created_at)}</span>
                      <span>&bull;</span>
                      <span>{item.user_agent_short || 'Web'}</span>
                      {item.is_edited && item.edited_at && (
                        <>
                          <span>&bull;</span>
                          <span className="text-slate-500 font-medium">Edited: {formatDateTimeIST(item.edited_at)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rating Stars */}
                <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/80 self-start">
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < item.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-midnight-900 ml-1">{item.rating}/5</span>
                </div>
              </div>

              {/* Message */}
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pl-1 mb-4 whitespace-pre-wrap">
                {item.message}
              </p>

              {/* Threaded Nested Replies */}
              {item.replies && item.replies.length > 0 && (
                <div className="mb-4 pl-4 border-l-2 border-electric-blue/30 space-y-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Thread Replies ({item.replies.length})
                  </span>
                  {item.replies.map((reply) => {
                    const isOwnerReply = reply.is_owner || reply.author_type === 'owner';
                    return (
                      <div
                        key={reply.id}
                        className={`p-3.5 rounded-xl text-xs ${
                          isOwnerReply
                            ? 'bg-gradient-to-r from-electric-ice/60 to-white border border-electric-blue/40 shadow-xs'
                            : 'bg-slate-50 border border-slate-200/70'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-midnight-900">{reply.author_name}</span>
                            {isOwnerReply && (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-electric-blue text-white flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" />
                                Owner
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400">
                              {formatDateTimeIST(reply.created_at)}
                            </span>
                            {reply.is_edited && (
                              <button
                                onClick={() => handleOpenRevisions('reply', reply.id)}
                                className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5"
                              >
                                <History className="w-2.5 h-2.5" /> (Edited)
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            {isOwnerReply && (
                              <button
                                onClick={() => {
                                  setEditingReplyId(reply.id);
                                  setEditReplyText(reply.content);
                                }}
                                className="text-slate-400 hover:text-electric-blue p-1"
                                title="Edit reply"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteReply(reply.id)}
                              className="text-slate-400 hover:text-red-600 p-1"
                              title="Delete reply"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {editingReplyId === reply.id ? (
                          <div className="mt-2 space-y-2">
                            <textarea
                              value={editReplyText}
                              onChange={(e) => setEditReplyText(e.target.value)}
                              rows={2}
                              className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white"
                            />
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => setEditingReplyId(null)}
                                className="px-2 py-1 text-[11px] text-slate-500"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveReplyEdit(reply.id)}
                                className="px-2.5 py-1 text-[11px] font-bold text-white bg-electric-blue rounded-md"
                              >
                                Save Edit
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {reply.content}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Reply as Owner Form */}
              {activeReplyId === item.id ? (
                <div className="mb-4 p-4 rounded-xl bg-electric-ice/30 border border-electric-blue/30 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-electric-blue">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Reply as "MSG — Owner" (Verified)</span>
                  </div>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={2}
                    placeholder="Type an official response to this visitor..."
                    className="w-full text-xs p-2.5 rounded-lg bg-white border border-slate-200 focus:outline-none focus:border-electric-blue text-midnight-900"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setActiveReplyId(null)}
                      className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handlePostOwnerReply(item.id)}
                      disabled={submittingReply || !replyText.trim()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-lg text-xs font-bold text-white bg-electric-blue hover:bg-blue-600 disabled:opacity-50"
                    >
                      <Send className="w-3 h-3" />
                      <span>{submittingReply ? 'Sending...' : 'Post Verified Reply'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <button
                    onClick={() => {
                      setActiveReplyId(item.id);
                      setReplyText('');
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-electric-blue hover:underline"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Reply as Owner &rarr;</span>
                  </button>
                </div>
              )}

              {/* Action Buttons Row */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs">
                
                {/* Status Badges */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-400">Status:</span>
                  <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    item.status === 'important'
                      ? 'bg-amber-100 text-amber-800'
                      : item.status === 'new'
                      ? 'bg-electric-ice text-electric-blue'
                      : item.status === 'reviewed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : item.status === 'spam'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {item.status}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5">
                  {/* Hide / Unhide Toggle */}
                  <button
                    onClick={() => handleStatusChange(item.id, item.status, { is_hidden: !item.is_hidden })}
                    disabled={updatingId === item.id}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors"
                    title={item.is_hidden ? 'Restore to public' : 'Hide from public'}
                  >
                    {item.is_hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>

                  {/* Mark as Important */}
                  <button
                    onClick={() => handleStatusChange(item.id, item.status === 'important' ? 'reviewed' : 'important')}
                    disabled={updatingId === item.id}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 border border-slate-200 transition-colors"
                    title={item.status === 'important' ? 'Unstar' : 'Mark as Important'}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${item.status === 'important' ? 'fill-amber-500 text-amber-500' : ''}`} />
                  </button>

                  {/* Mark as Reviewed */}
                  <button
                    onClick={() => handleStatusChange(item.id, item.status === 'reviewed' ? 'new' : 'reviewed')}
                    disabled={updatingId === item.id}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 border border-slate-200 transition-colors"
                    title="Mark as Reviewed"
                  >
                    <CheckCircle2 className={`w-3.5 h-3.5 ${item.status === 'reviewed' ? 'text-emerald-600' : ''}`} />
                  </button>

                  {/* Flag as Spam */}
                  <button
                    onClick={() => handleStatusChange(item.id, item.status === 'spam' ? 'reviewed' : 'spam', { is_spam: item.status !== 'spam' })}
                    disabled={updatingId === item.id}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      item.status === 'spam'
                        ? 'bg-red-50 text-red-600 border-red-200'
                        : 'text-slate-500 hover:text-red-600 hover:bg-red-50 border-slate-200'
                    }`}
                    title="Toggle spam flag"
                  >
                    <Flag className="w-3.5 h-3.5" />
                  </button>

                  {/* Archive */}
                  <button
                    onClick={() => handleStatusChange(item.id, item.status === 'archived' ? 'reviewed' : 'archived')}
                    disabled={updatingId === item.id}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors"
                    title="Archive"
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete permanently */}
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={updatingId === item.id}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors"
                    title="Delete permanently"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            </div>
          ))
        )}
      </div>

      {/* Revision History Modal */}
      {revisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-midnight-900 flex items-center gap-2">
                <History className="w-4 h-4 text-electric-blue" />
                Revision History &amp; Edit Audit Log
              </h3>
              <button
                onClick={() => setRevisionModal(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {revisionModal.loading ? (
              <div className="text-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-electric-blue mb-2" />
                <p className="text-xs text-slate-500">Fetching audit log...</p>
              </div>
            ) : revisionModal.revisions.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No previous revisions recorded for this item.</p>
            ) : (
              <div className="space-y-4">
                {revisionModal.revisions.map((rev, idx) => (
                  <div key={rev.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-bold text-midnight-900">
                        Revision #{revisionModal.revisions.length - idx} &bull; {rev.editor_identity}
                      </span>
                      <span>{formatDateTimeIST(rev.created_at)}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide block">Original:</span>
                      <p className="p-2 rounded bg-red-50/50 border border-red-100 text-slate-700 font-mono text-[11px] line-through">
                        {rev.previous_content}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide block">Updated:</span>
                      <p className="p-2 rounded bg-emerald-50/50 border border-emerald-100 text-slate-700 font-mono text-[11px]">
                        {rev.new_content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
