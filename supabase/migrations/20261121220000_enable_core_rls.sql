-- The application accesses these tables only through its privileged backend.
-- Enable RLS and deny direct client-role access to private account and case data.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.users, public.games FROM anon, authenticated;
GRANT ALL ON TABLE public.users, public.games TO service_role;
