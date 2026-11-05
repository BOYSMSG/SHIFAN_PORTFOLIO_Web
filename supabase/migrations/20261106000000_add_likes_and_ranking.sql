-- ============================================================
-- SHIFAN PORTFOLIO — COMMUNITY LIKES & RANKING MIGRATION
-- Adds likes_count, feedback_likes tracker, and toggle RPC
-- ============================================================

-- 1. Add likes_count column to public.feedback
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS likes_count INTEGER NOT NULL DEFAULT 0;

-- 2. Create dedicated feedback_likes table for verified vote tracking
CREATE TABLE IF NOT EXISTS public.feedback_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES public.feedback(id) ON DELETE CASCADE,
  voter_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(feedback_id, voter_hash)
);

-- 3. Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_feedback_likes_feedback_id ON public.feedback_likes(feedback_id);
CREATE INDEX IF NOT EXISTS idx_feedback_likes_voter ON public.feedback_likes(feedback_id, voter_hash);

-- 4. Atomic RPC function to toggle like/unlike safely
CREATE OR REPLACE FUNCTION public.toggle_feedback_like(
  p_feedback_id UUID,
  p_voter_hash TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_already_liked BOOLEAN;
  v_new_count INT;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.feedback_likes 
    WHERE feedback_id = p_feedback_id AND voter_hash = p_voter_hash
  ) INTO v_already_liked;

  IF v_already_liked THEN
    -- Unlike
    DELETE FROM public.feedback_likes 
    WHERE feedback_id = p_feedback_id AND voter_hash = p_voter_hash;

    UPDATE public.feedback 
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = p_feedback_id
    RETURNING likes_count INTO v_new_count;

    RETURN jsonb_build_object('success', true, 'liked', false, 'likes_count', COALESCE(v_new_count, 0));
  ELSE
    -- Like
    INSERT INTO public.feedback_likes (feedback_id, voter_hash)
    VALUES (p_feedback_id, p_voter_hash);

    UPDATE public.feedback 
    SET likes_count = likes_count + 1
    WHERE id = p_feedback_id
    RETURNING likes_count INTO v_new_count;

    RETURN jsonb_build_object('success', true, 'liked', true, 'likes_count', COALESCE(v_new_count, 1));
  END IF;
END;
$$;

-- Secure permissions
REVOKE ALL ON FUNCTION public.toggle_feedback_like(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.toggle_feedback_like(UUID, TEXT) TO service_role;
