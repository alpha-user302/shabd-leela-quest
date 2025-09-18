-- First, let's check if there's already a unique constraint on team_id
-- If not, we need to add one or change the upsert logic

-- Add unique constraint on team_id to allow proper upserts
-- But first, let's clean up any duplicate entries if they exist
DELETE FROM public.team_submissions 
WHERE id NOT IN (
  SELECT DISTINCT ON (team_id) id 
  FROM public.team_submissions 
  ORDER BY team_id, submitted_at DESC
);

-- Add unique constraint on team_id
ALTER TABLE public.team_submissions 
ADD CONSTRAINT unique_team_submission UNIQUE (team_id);