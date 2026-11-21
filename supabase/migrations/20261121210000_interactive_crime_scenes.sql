ALTER TABLE public.games
ADD COLUMN IF NOT EXISTS crime_scene JSONB;

CREATE TABLE IF NOT EXISTS public.game_scene_discoveries (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    object_id TEXT NOT NULL CHECK (object_id ~ '^object_[1-9]$|^legacy_object_[1-9]$'),
    evidence_id TEXT CHECK (evidence_id IS NULL OR evidence_id ~ '^clue_[1-3]$'),
    examined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    closer_inspected_at TIMESTAMPTZ,
    evidence_discovered_at TIMESTAMPTZ,
    CONSTRAINT game_scene_discoveries_pkey PRIMARY KEY (id),
    CONSTRAINT game_scene_discoveries_object_unique UNIQUE (game_id, object_id),
    CONSTRAINT game_scene_discoveries_evidence_timestamp_check CHECK (
        (evidence_id IS NULL AND evidence_discovered_at IS NULL)
        OR (evidence_id IS NOT NULL AND evidence_discovered_at IS NOT NULL)
    ),
    CONSTRAINT game_scene_discoveries_closer_timestamp_check CHECK (
        evidence_discovered_at IS NULL OR closer_inspected_at IS NOT NULL
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_game_scene_discoveries_evidence_unique
ON public.game_scene_discoveries (game_id, evidence_id)
WHERE evidence_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_game_scene_discoveries_user_game
ON public.game_scene_discoveries (user_id, game_id);

ALTER TABLE public.game_scene_discoveries ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.game_scene_discoveries TO service_role;
