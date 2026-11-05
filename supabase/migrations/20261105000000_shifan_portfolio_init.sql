-- ============================================================
-- SHIFAN PORTFOLIO — COMPLETE HARDENED DATABASE INITIALIZATION
-- Target Domain: shifan.pokefun.in
-- Owner: Mohd Shifan Gouri (BOYS MSG)
-- Security Standard: Strict Dual-Layer Authorization & RLS Hardening
-- ============================================================

-- 1. Profiles Table (Optional Google OAuth Sync)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'visitor' CHECK (role IN ('visitor', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Feedback Discussions Table
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_id_hash TEXT NOT NULL,
  author_type TEXT NOT NULL DEFAULT 'guest' CHECK (author_type IN ('google', 'guest')),
  is_guest BOOLEAN NOT NULL DEFAULT TRUE,
  guest_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  message TEXT NOT NULL CHECK (char_length(message) >= 4 AND char_length(message) <= 2000),
  section_tag TEXT NOT NULL DEFAULT 'projects',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'important', 'archived', 'spam', 'hidden')),
  user_agent_short TEXT DEFAULT 'Desktop / Web',
  is_edited BOOLEAN NOT NULL DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  is_spam BOOLEAN NOT NULL DEFAULT FALSE,
  reports_count INTEGER NOT NULL DEFAULT 0,
  replies_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Threaded Replies Table
CREATE TABLE IF NOT EXISTS public.feedback_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES public.feedback(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_type TEXT NOT NULL DEFAULT 'guest' CHECK (author_type IN ('owner', 'google', 'guest')),
  author_id_hash TEXT NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) >= 2 AND char_length(content) <= 1200),
  is_owner BOOLEAN NOT NULL DEFAULT FALSE,
  is_edited BOOLEAN NOT NULL DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  is_spam BOOLEAN NOT NULL DEFAULT FALSE,
  reports_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Revision History Table (Permanent Audit Log for Edits)
CREATE TABLE IF NOT EXISTS public.feedback_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL CHECK (target_type IN ('feedback', 'reply')),
  target_id UUID NOT NULL,
  previous_content TEXT NOT NULL,
  new_content TEXT NOT NULL,
  editor_identity TEXT NOT NULL,
  editor_type TEXT NOT NULL CHECK (editor_type IN ('owner', 'google', 'guest')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Content Reports Table (Spam & Abuse Flags)
CREATE TABLE IF NOT EXISTS public.feedback_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL CHECK (target_type IN ('feedback', 'reply')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  reporter_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Persistent Distributed Rate Limits
CREATE TABLE IF NOT EXISTS public.persistent_rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- 7. Persistent Admin OTPs (Hashed Code, Single-Use, 10-Min Expiry)
CREATE TABLE IF NOT EXISTS public.admin_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Persistent Admin Trusted IPs (HMAC Hashed)
CREATE TABLE IF NOT EXISTS public.admin_trusted_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash TEXT NOT NULL UNIQUE,
  label TEXT DEFAULT 'Verified Owner Network',
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PERFORMANCE & FILTERING INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_hidden ON public.feedback(is_hidden) WHERE is_hidden = FALSE;
CREATE INDEX IF NOT EXISTS idx_feedback_replies_feedback_id ON public.feedback_replies(feedback_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_revisions_target ON public.feedback_revisions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_expires ON public.persistent_rate_limits(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_otps_email ON public.admin_otps(email, expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_trusted_ips_hash ON public.admin_trusted_ips(ip_hash);

-- ============================================================
-- SECURE PUBLIC VIEWS (Zero Private Hash / Metadata Leakage)
-- ============================================================
CREATE OR REPLACE VIEW public.public_feedback_view WITH (security_invoker = false) AS
SELECT
  id,
  guest_name,
  rating,
  message,
  section_tag,
  is_edited,
  edited_at,
  created_at,
  replies_count
FROM public.feedback
WHERE is_hidden = FALSE AND is_spam = FALSE;

CREATE OR REPLACE VIEW public.public_replies_view WITH (security_invoker = false) AS
SELECT
  id,
  feedback_id,
  author_name,
  author_type,
  is_owner,
  content,
  is_edited,
  edited_at,
  created_at
FROM public.feedback_replies
WHERE is_hidden = FALSE AND is_spam = FALSE;

-- Grant Read Permissions to Public Views Only
GRANT SELECT ON public.public_feedback_view TO anon, authenticated;
GRANT SELECT ON public.public_replies_view TO anon, authenticated;

-- ============================================================
-- ATOMIC CONCURRENCY-SAFE RATE LIMITING RPC FUNCTION
-- Single atomic upsert ensures unseen/new keys cannot be raced
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_and_increment_rate_limit(
  p_key TEXT,
  p_max_limit INT,
  p_window_ms BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_expires TIMESTAMPTZ := NOW() + (p_window_ms || ' milliseconds')::INTERVAL;
  v_count INT;
  v_allowed BOOLEAN;
  v_remaining INT;
BEGIN
  -- Atomic Upsert with row-lock in a single atomic SQL statement
  INSERT INTO public.persistent_rate_limits (key, count, window_start, expires_at)
  VALUES (p_key, 1, v_now, v_expires)
  ON CONFLICT (key) DO UPDATE
    SET 
      count = CASE 
        WHEN persistent_rate_limits.expires_at <= v_now THEN 1
        ELSE persistent_rate_limits.count + 1
      END,
      window_start = CASE
        WHEN persistent_rate_limits.expires_at <= v_now THEN v_now
        ELSE persistent_rate_limits.window_start
      END,
      expires_at = CASE
        WHEN persistent_rate_limits.expires_at <= v_now THEN v_expires
        ELSE persistent_rate_limits.expires_at
      END
  RETURNING persistent_rate_limits.count INTO v_count;

  IF v_count <= p_max_limit THEN
    v_allowed := TRUE;
    v_remaining := p_max_limit - v_count;
  ELSE
    v_allowed := FALSE;
    v_remaining := 0;
  END IF;

  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'remaining', v_remaining,
    'current_count', v_count
  );
END;
$$;

-- Revoke execute on rate-limiting from public/anon
REVOKE ALL ON FUNCTION public.check_and_increment_rate_limit(TEXT, INT, BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_and_increment_rate_limit(TEXT, INT, BIGINT) TO service_role;

-- ============================================================
-- ATOMIC NETWORK-BOUND OTP VERIFICATION AND CONSUMPTION
-- Row-level locking (FOR UPDATE) prevents race conditions and replay
-- ============================================================
CREATE OR REPLACE FUNCTION public.verify_and_consume_admin_otp(
  p_email TEXT,
  p_otp_hash TEXT,
  p_ip_hash TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rec RECORD;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  -- Lock the most recent OTP record for this email FOR UPDATE
  SELECT * INTO v_rec
  FROM public.admin_otps
  WHERE email = LOWER(p_email)
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', FALSE, 'reason', 'No pending OTP found. Please request a new code.');
  END IF;

  -- 1. Expiration check (10 minutes)
  IF v_now > v_rec.expires_at THEN
    DELETE FROM public.admin_otps WHERE id = v_rec.id;
    RETURN jsonb_build_object('valid', FALSE, 'reason', 'OTP has expired. Please request a new code.');
  END IF;

  -- 2. IP binding verification: reject if request IP hash does not match issued OTP
  IF v_rec.ip_hash <> p_ip_hash THEN
    UPDATE public.admin_otps SET attempts = v_rec.attempts + 1 WHERE id = v_rec.id;
    IF v_rec.attempts + 1 >= 5 THEN
      DELETE FROM public.admin_otps WHERE id = v_rec.id;
    END IF;
    RETURN jsonb_build_object('valid', FALSE, 'reason', 'Security verification failed: Network address mismatch.');
  END IF;

  -- 3. Lockout check (Max 5 attempts)
  IF v_rec.attempts >= 5 THEN
    DELETE FROM public.admin_otps WHERE id = v_rec.id;
    RETURN jsonb_build_object('valid', FALSE, 'reason', 'Too many incorrect attempts. Please request a new OTP.');
  END IF;

  -- 4. Hash verification
  IF v_rec.otp_hash = p_otp_hash THEN
    -- Match: atomic single-use consumption
    DELETE FROM public.admin_otps WHERE id = v_rec.id;
    RETURN jsonb_build_object('valid', TRUE);
  ELSE
    -- Mismatch: increment attempts atomically
    UPDATE public.admin_otps SET attempts = v_rec.attempts + 1 WHERE id = v_rec.id;
    IF v_rec.attempts + 1 >= 5 THEN
      DELETE FROM public.admin_otps WHERE id = v_rec.id;
      RETURN jsonb_build_object('valid', FALSE, 'reason', 'Too many incorrect attempts. Please request a new OTP.');
    END IF;
    RETURN jsonb_build_object('valid', FALSE, 'reason', 'Invalid OTP code. Please check and try again.');
  END IF;
END;
$$;

-- Revoke execute on OTP verification from public/anon
REVOKE ALL ON FUNCTION public.verify_and_consume_admin_otp(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_and_consume_admin_otp(TEXT, TEXT, TEXT) TO service_role;

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES — FAIL-CLOSED ARCHITECTURE
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.persistent_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_trusted_ips ENABLE ROW LEVEL SECURITY;

-- Raw Tables Access: Strictly restricted to service_role (backend server only)
-- Public clients cannot read raw tables directly (they must use public views or server endpoints)
CREATE POLICY "Service Role full access on profiles" ON public.profiles FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service Role full access on feedback" ON public.feedback FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service Role full access on feedback_replies" ON public.feedback_replies FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service Role full access on feedback_revisions" ON public.feedback_revisions FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service Role full access on feedback_reports" ON public.feedback_reports FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service Role full access on persistent_rate_limits" ON public.persistent_rate_limits FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service Role full access on admin_otps" ON public.admin_otps FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service Role full access on admin_trusted_ips" ON public.admin_trusted_ips FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
