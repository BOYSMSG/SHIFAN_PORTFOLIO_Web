'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare,
  X,
  Star,
  Sparkles,
  Send,
  User,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Shuffle,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { getSupabaseBrowser } from '@/lib/supabase';
import { trackEvent } from '@/lib/analytics';

const guestHandles = [
  'Guest-CyberPixel',
  'Guest-NeonWolf',
  'Guest-BlueVolt',
  'Guest-CobbleFan',
  'Guest-PixelCraft',
  'Guest-FrostForge',
  'Guest-EchoPulse',
  'Guest-QuantumDev',
];

export default function FeedbackModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'guest' | 'google'>('guest');
  const [guestName, setGuestName] = useState('Guest-CyberPixel');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [sectionTag, setSectionTag] = useState<string>('projects');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const triggerBtnRef = useRef<HTMLButtonElement | null>(null);
  const modalPanelRef = useRef<HTMLDivElement | null>(null);
  const scrollPositionRef = useRef<number>(0);
  const prefersReducedMotion = useReducedMotion();

  const generateRandomHandle = () => {
    const next = guestHandles[Math.floor(Math.random() * guestHandles.length)];
    const unique = `${next}-${Math.floor(Math.random() * 900 + 100)}`;
    setGuestName(unique);
  };

  // Check for active Google OAuth session on mount and handle OAuth redirect
  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
      setIsOpen(true);
      window.history.replaceState(null, '', window.location.pathname);
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setAuthMode('google');
        const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Google User';
        setGuestName(name);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setAuthMode('google');
        const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Google User';
        setGuestName(name);
      } else {
        setAuthMode('guest');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Robust Scroll Lock & Restore
  useEffect(() => {
    if (!isOpen) return;

    // Record exact current scroll position before locking
    const scrollY = window.scrollY;
    scrollPositionRef.current = scrollY;

    // Calculate scrollbar width to prevent desktop layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    // Save previous styles
    const prevOverflow = document.body.style.overflow;
    const prevPosition = document.body.style.position;
    const prevTop = document.body.style.top;
    const prevWidth = document.body.style.width;
    const prevPaddingRight = document.body.style.paddingRight;

    // Apply strict non-jumping lock for desktop + mobile iOS
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      // Revert styles
      document.body.style.position = prevPosition;
      document.body.style.top = prevTop;
      document.body.style.width = prevWidth;
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;

      // Restore exact scroll position instantly without smooth scrolling latency
      window.scrollTo({
        top: scrollPositionRef.current,
        behavior: 'instant' as ScrollBehavior,
      });

      // Restore keyboard focus to trigger button
      if (triggerBtnRef.current) {
        triggerBtnRef.current.focus();
      }
    };
  }, [isOpen]);

  // Keyboard Trap & Escape Listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeModal();
        return;
      }

      if (e.key === 'Tab' && modalPanelRef.current) {
        const focusables = modalPanelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Initial focus on opening: focus close button or first input
    const timer = setTimeout(() => {
      if (modalPanelRef.current) {
        const firstInput = modalPanelRef.current.querySelector<HTMLElement>('input, textarea, button');
        if (firstInput) {
          firstInput.focus();
        }
      }
    }, 50);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [isOpen]);

  const handleOpen = () => {
    if (guestName === 'Guest-CyberPixel') {
      const next = guestHandles[Math.floor(Math.random() * guestHandles.length)];
      setGuestName(`${next}-${Math.floor(Math.random() * 900 + 100)}`);
    }
    setIsOpen(true);
    setSubmitted(false);
    setErrorMessage(null);
    trackEvent('feedback_modal_opened');
  };

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleGoogleAuth = async () => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setErrorMessage('Google OAuth requires Supabase credentials in .env.local. Continuing in Guest mode.');
      setAuthMode('guest');
      return;
    }

    try {
      setLoading(true);
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
      });
    } catch (err) {
      console.error('Google OAuth error:', err);
      setErrorMessage('Google authentication could not be initiated.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (message.trim().length < 4) {
      setErrorMessage('Please enter at least 4 characters of feedback.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          message: message.trim(),
          section_tag: sectionTag,
          guest_name: guestName.trim() || 'Anonymous Visitor',
          is_guest: authMode === 'guest',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to submit feedback.');
        setLoading(false);
        return;
      }

      setSubmitted(true);
      trackEvent('feedback_submitted', { section: sectionTag, rating });
    } catch {
      setErrorMessage('Network error while sending feedback.');
    } finally {
      setLoading(false);
    }
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const panelVariants = prefersReducedMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        hidden: { opacity: 0, scale: 0.96, y: 12 },
        visible: {
          opacity: 1,
          scale: 1,
          y: 0,
          transition: { duration: 0.24, ease: [0.16, 1, 0.3, 1] as const },
        },
        exit: {
          opacity: 0,
          scale: 0.96,
          y: 12,
          transition: { duration: 0.18, ease: 'easeOut' as const },
        },
      };

  return (
    <>
      {/* Floating Trigger Button (Subtle Glass Pill) */}
      <button
        ref={triggerBtnRef}
        onClick={handleOpen}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label="Share Feedback with Mohd Shifan Gouri"
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-white/95 hover:bg-white text-midnight-900 border border-electric-blue/30 shadow-lg shadow-electric-blue/10 backdrop-blur-md hover:scale-105 active:scale-95 transition-all duration-200 text-xs font-bold cursor-pointer group focus:outline-none focus:ring-2 focus:ring-electric-blue/50"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-electric-cyan opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-electric-cyan" />
        </span>
        <MessageSquare className="w-3.5 h-3.5 text-electric-blue group-hover:rotate-12 transition-transform duration-200" />
        <span className="hidden sm:inline">Share Feedback</span>
      </button>

      {/* Modal Dialog with AnimatePresence */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-modal-title"
            aria-describedby="feedback-modal-desc"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          >
            {/* Backdrop */}
            <motion.div
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.2 }}
              onClick={closeModal}
              className="absolute inset-0 bg-midnight-900/40 backdrop-blur-sm"
            />

            {/* Modal Panel Container */}
            <motion.div
              ref={modalPanelRef}
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg max-h-[min(90dvh,680px)] flex flex-col rounded-3xl bg-white border border-slate-200/90 shadow-2xl overflow-hidden overscroll-contain z-10"
            >
              {/* Top Header Bar */}
              <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-100 flex-shrink-0">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-electric-blue bg-electric-ice px-2 py-0.5 rounded-md border border-electric-blue/20">
                    Community Feedback
                  </span>
                  <h2 id="feedback-modal-title" className="text-xl font-extrabold text-midnight-900 mt-1.5">
                    Share Thoughts with Mohd Shifan Gouri
                  </h2>
                  <p id="feedback-modal-desc" className="text-xs text-slate-500 mt-0.5">
                    Your feedback directly guides development on Pokefun, modpacks, and systems.
                  </p>
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={closeModal}
                  className="p-2 rounded-xl text-slate-400 hover:text-midnight-900 hover:bg-slate-100 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-electric-blue/40"
                  aria-label="Close Feedback Modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Content Body */}
              <div className="p-6 overflow-y-auto overscroll-contain flex-1">
                {submitted ? (
                  <div className="text-center py-6 sm:py-8 space-y-3">
                    <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-bold text-midnight-900">Feedback Dispatched!</h3>
                    <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
                      Thank you, <strong>{guestName}</strong>! Your review has been recorded securely into the private owner console.
                    </p>
                    <div className="pt-4">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-midnight-900 hover:bg-slate-800 transition-all cursor-pointer shadow-sm active:scale-98"
                      >
                        Close &amp; Return to Portfolio
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Identity Mode Selector */}
                    <div>
                      <label className="block text-xs font-bold text-midnight-800 mb-1.5">
                        Submission Identity
                      </label>
                      <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100/80 border border-slate-200/80 text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => setAuthMode('guest')}
                          className={`py-2 rounded-lg transition-all cursor-pointer ${
                            authMode === 'guest'
                              ? 'bg-white text-midnight-900 shadow-2xs font-bold'
                              : 'text-slate-500 hover:text-midnight-900'
                          }`}
                        >
                          Continue as Guest
                        </button>
                        <button
                          type="button"
                          onClick={handleGoogleAuth}
                          className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            authMode === 'google'
                              ? 'bg-white text-midnight-900 shadow-2xs font-bold'
                              : 'text-slate-500 hover:text-midnight-900'
                          }`}
                        >
                          <span>Google Sign In</span>
                          <span className="text-[9px] font-mono bg-emerald-50 text-emerald-600 border border-emerald-200/60 font-semibold px-1.5 py-0.5 rounded">
                            Recommended
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Google Signed In Badge */}
                    {authMode === 'google' && (
                      <div className="p-3 rounded-xl bg-emerald-50/90 border border-emerald-200 flex items-center justify-between text-xs transition-all">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span className="font-semibold text-emerald-950">
                            Signed in as <strong>{guestName}</strong>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const supabase = getSupabaseBrowser();
                            supabase?.auth.signOut();
                            setAuthMode('guest');
                            generateRandomHandle();
                          }}
                          className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                        >
                          Sign out
                        </button>
                      </div>
                    )}

                    {/* Guest Handle Input */}
                    {authMode === 'guest' && (
                      <div className="transition-all duration-200">
                        <label htmlFor="feedback-guest-handle" className="block text-xs font-bold text-midnight-800 mb-1">
                          Display Handle
                        </label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                              <User className="w-3.5 h-3.5" />
                            </div>
                            <input
                              id="feedback-guest-handle"
                              type="text"
                              required
                              value={guestName}
                              onChange={(e) => setGuestName(e.target.value)}
                              placeholder="e.g. Guest-CyberPixel"
                              maxLength={40}
                              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-midnight-900 focus:bg-white focus:border-electric-blue focus:ring-2 focus:ring-electric-blue/20 outline-none transition-all"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={generateRandomHandle}
                            title="Generate a randomized handle"
                            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Shuffle className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Randomize</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Rating Bar */}
                    <div>
                      <label className="block text-xs font-bold text-midnight-800 mb-1.5">
                        Experience Rating
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-slate-50 p-2 rounded-xl border border-slate-200">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(null)}
                              aria-label={`Rate ${star} out of 5 stars`}
                              className="p-1 hover:scale-115 active:scale-95 transition-transform cursor-pointer focus:outline-none"
                            >
                              <Star
                                className={`w-5 h-5 transition-colors ${
                                  star <= (hoverRating ?? rating)
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-300'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                        <span className="text-xs font-bold text-midnight-900">
                          {rating === 5 ? 'Exceptional' : rating === 4 ? 'Very Good' : rating === 3 ? 'Decent' : 'Needs Polish'}
                        </span>
                      </div>
                    </div>

                    {/* Section Tag */}
                    <div>
                      <label htmlFor="feedback-section-tag" className="block text-xs font-bold text-midnight-800 mb-1">
                        Related Portfolio Section
                      </label>
                      <select
                        id="feedback-section-tag"
                        value={sectionTag}
                        onChange={(e) => setSectionTag(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-midnight-900 focus:bg-white focus:border-electric-blue focus:ring-2 focus:ring-electric-blue/20 outline-none transition-all cursor-pointer"
                      >
                        <option value="projects">Projects &amp; Architectures</option>
                        <option value="ventures">Ventures &amp; Pokefun Ecosystem</option>
                        <option value="about">About &amp; Experience</option>
                        <option value="journey">Journey &amp; Education</option>
                        <option value="skills">Technical Arsenal</option>
                        <option value="services">Services &amp; Offerings</option>
                        <option value="community">Community &amp; Discord</option>
                        <option value="hero">Hero &amp; Navbar Design</option>
                        <option value="general">General Feedback</option>
                      </select>
                    </div>

                    {/* Written Message */}
                    <div>
                      <label htmlFor="feedback-message-text" className="block text-xs font-bold text-midnight-800 mb-1">
                        Your Feedback or Suggestions
                      </label>
                      <textarea
                        id="feedback-message-text"
                        required
                        rows={3}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Share specific suggestions, collaboration ideas, or reactions..."
                        className="w-full px-3 py-2.5 rounded-xl text-xs bg-slate-50 border border-slate-200 text-midnight-900 placeholder-slate-400 focus:bg-white focus:border-electric-blue focus:ring-2 focus:ring-electric-blue/20 outline-none transition-all resize-none"
                      />
                    </div>

                    {/* Error Banner */}
                    {errorMessage && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-shake">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="w-1/3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading || message.trim().length < 4}
                        className="w-2/3 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-electric-blue to-electric-cyan hover:shadow-cyan-glow transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Submitting...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Submit Feedback</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* Privacy & Trust Footnote */}
                <div className="mt-5 pt-4 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-center gap-1.5 text-center leading-tight">
                  <ShieldCheck className="w-3.5 h-3.5 text-electric-blue flex-shrink-0" />
                  <span>
                    Your feedback is stored securely. We never publicly display email addresses or track visitors across websites.
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
