ALTER TABLE public.games
ADD COLUMN IF NOT EXISTS points_earned INTEGER NOT NULL DEFAULT 0
CHECK (points_earned >= 0);

UPDATE public.games
SET points_earned = GREATEST(
    0,
    CASE difficulty
        WHEN 'easy' THEN 100
        WHEN 'medium' THEN 200
        WHEN 'hard' THEN 300
        ELSE 0
    END - LEAST(hint_count, 3) * 25
)
WHERE status = 'solved'
  AND points_earned = 0;
