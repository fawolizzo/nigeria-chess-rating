-- Create missing tables for audit logging and rating jobs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  meta_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rating_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid REFERENCES public.tournaments(id) ON DELETE CASCADE,
  started_at timestamptz DEFAULT now(),
  finished_at timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  summary_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rating_jobs ENABLE ROW LEVEL SECURITY;

-- RLS policies for audit_logs (only rating officers can view)
CREATE POLICY "Rating officers can view audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.rating_officers ro ON u.id = ro.user_id
    WHERE u.id = auth.uid() AND u.status = 'active'
  )
);

-- RLS policies for rating_jobs
CREATE POLICY "Organizers can view their tournament rating jobs"
ON public.rating_jobs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tournaments t
    WHERE t.id = rating_jobs.tournament_id AND t.organizer_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.rating_officers ro ON u.id = ro.user_id
    WHERE u.id = auth.uid() AND u.status = 'active'
  )
);

CREATE POLICY "Rating officers can manage rating jobs"
ON public.rating_jobs FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.rating_officers ro ON u.id = ro.user_id
    WHERE u.id = auth.uid() AND u.status = 'active'
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rating_jobs_tournament ON public.rating_jobs(tournament_id);
CREATE INDEX IF NOT EXISTS idx_rating_jobs_status ON public.rating_jobs(status);