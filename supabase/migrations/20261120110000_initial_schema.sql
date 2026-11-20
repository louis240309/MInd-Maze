
-- Mind Maze: Initial database schema
-- Recreates the existing users and games table structures.

CREATE TABLE IF NOT EXISTS public.users (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_email_key UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_users_email
ON public.users USING btree (email);

CREATE TABLE IF NOT EXISTS public.games (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    difficulty TEXT NOT NULL DEFAULT 'medium'::text,
    story TEXT NOT NULL,
    suspects JSONB NOT NULL DEFAULT '[]'::jsonb,
    clues JSONB NOT NULL DEFAULT '[]'::jsonb,
    solution TEXT NOT NULL,
    hints JSONB NOT NULL DEFAULT '[]'::jsonb,
    hint_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active'::text,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT games_pkey PRIMARY KEY (id),

    CONSTRAINT games_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES public.users (id)
        ON DELETE CASCADE,

    CONSTRAINT games_difficulty_check
        CHECK (
            difficulty = ANY (
                ARRAY['easy'::text, 'medium'::text, 'hard'::text]
            )
        ),

    CONSTRAINT games_hint_count_check
        CHECK (
            hint_count >= 0 AND hint_count <= 3
        ),

    CONSTRAINT games_status_check
        CHECK (
            status = ANY (
                ARRAY['active'::text, 'solved'::text, 'archived'::text]
            )
        )
);

CREATE INDEX IF NOT EXISTS idx_games_user_id
ON public.games USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_games_status
ON public.games USING btree (status);
