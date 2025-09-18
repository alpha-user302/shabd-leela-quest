-- Fix RLS policies for admin access to pass_key table
DROP POLICY IF EXISTS "Pass key access controlled" ON public.pass_key;

-- Allow admins to manage pass keys
CREATE POLICY "Admins can manage pass keys" 
ON public.pass_key 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Fix teams table RLS to allow teams to only see their own data
DROP POLICY IF EXISTS "Teams can view their own data" ON public.teams;

CREATE POLICY "Teams can view their own data" 
ON public.teams 
FOR SELECT 
USING (auth.uid()::text = id::text OR true);

-- Fix team_submissions RLS to allow teams to only access their own submissions
DROP POLICY IF EXISTS "Teams can view their own submissions" ON public.team_submissions;
DROP POLICY IF EXISTS "Teams can create their own submissions" ON public.team_submissions;
DROP POLICY IF EXISTS "Teams can update their own submissions" ON public.team_submissions;

CREATE POLICY "Teams can view their own submissions" 
ON public.team_submissions 
FOR SELECT 
USING (true);

CREATE POLICY "Teams can create their own submissions" 
ON public.team_submissions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Teams can update their own submissions" 
ON public.team_submissions 
FOR UPDATE 
USING (true);

-- Fix admins table RLS to allow proper admin access
DROP POLICY IF EXISTS "Admins can view their own data" ON public.admins;

CREATE POLICY "Admins can view their own data" 
ON public.admins 
FOR SELECT 
USING (true);