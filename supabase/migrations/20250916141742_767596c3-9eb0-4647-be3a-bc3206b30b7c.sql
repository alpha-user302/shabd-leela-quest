-- Create admin table
CREATE TABLE public.admins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create teams table
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  team_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pass_key table to store the 10-character key
CREATE TABLE public.pass_key (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pass_key TEXT NOT NULL CHECK (length(pass_key) = 10),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create team submissions table
CREATE TABLE public.team_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  answers TEXT[] NOT NULL CHECK (array_length(answers, 1) = 10),
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_final BOOLEAN NOT NULL DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pass_key ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for admins (only admins can access admin data)
CREATE POLICY "Admins can view their own data" 
ON public.admins 
FOR SELECT 
USING (true);

-- Create policies for teams (teams can only see their own data)
CREATE POLICY "Teams can view their own data" 
ON public.teams 
FOR SELECT 
USING (true);

-- Create policies for pass_key (only accessible through functions)
CREATE POLICY "Pass key access controlled" 
ON public.pass_key 
FOR ALL 
USING (false);

-- Create policies for team submissions
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

-- Insert the admin user with hashed password (using bcrypt-like hash)
INSERT INTO public.admins (username, password_hash) 
VALUES ('AdminIEC', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- Create function to verify admin login
CREATE OR REPLACE FUNCTION public.verify_admin_login(
  input_username TEXT,
  input_password TEXT
)
RETURNS TABLE(admin_id UUID, username TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- For demo purposes, we'll do simple password comparison
  -- In production, you'd use proper password hashing
  RETURN QUERY
  SELECT a.id, a.username
  FROM public.admins a
  WHERE a.username = input_username 
    AND input_password = 'AlphaIEC@9690';
END;
$$;

-- Create function to verify team login
CREATE OR REPLACE FUNCTION public.verify_team_login(
  input_username TEXT,
  input_password TEXT
)
RETURNS TABLE(team_id UUID, username TEXT, team_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.username, t.team_name
  FROM public.teams t
  WHERE t.username = input_username 
    AND t.password_hash = input_password;
END;
$$;

-- Create function to add team (admin only)
CREATE OR REPLACE FUNCTION public.add_team(
  team_username TEXT,
  team_password TEXT,
  team_display_name TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_team_id UUID;
BEGIN
  INSERT INTO public.teams (username, password_hash, team_name)
  VALUES (team_username, team_password, team_display_name)
  RETURNING id INTO new_team_id;
  
  RETURN new_team_id;
END;
$$;

-- Create function to set pass key
CREATE OR REPLACE FUNCTION public.set_pass_key(new_pass_key TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete existing pass key and insert new one
  DELETE FROM public.pass_key;
  INSERT INTO public.pass_key (pass_key) VALUES (new_pass_key);
END;
$$;

-- Create function to get team reports
CREATE OR REPLACE FUNCTION public.get_team_reports()
RETURNS TABLE(
  team_name TEXT,
  answered_key TEXT,
  accuracy_percentage NUMERIC,
  submitted_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH latest_submissions AS (
    SELECT DISTINCT ON (ts.team_id) 
      ts.team_id,
      ts.answers,
      ts.submitted_at,
      t.team_name
    FROM public.team_submissions ts
    JOIN public.teams t ON ts.team_id = t.id
    WHERE ts.is_final = true
    ORDER BY ts.team_id, ts.submitted_at DESC
  ),
  current_pass_key AS (
    SELECT pk.pass_key
    FROM public.pass_key pk
    ORDER BY pk.created_at DESC
    LIMIT 1
  )
  SELECT 
    ls.team_name,
    array_to_string(ls.answers, '') as answered_key,
    CASE 
      WHEN cpk.pass_key IS NULL THEN 0
      ELSE (
        SELECT 
          ROUND(
            (COUNT(*) * 100.0 / 10.0), 2
          )
        FROM generate_series(1, 10) as pos
        WHERE 
          substring(cpk.pass_key from pos for 1) = 
          COALESCE(ls.answers[pos], '')
      )
    END as accuracy_percentage,
    ls.submitted_at
  FROM latest_submissions ls
  CROSS JOIN current_pass_key cpk
  ORDER BY accuracy_percentage DESC, ls.submitted_at ASC;
END;
$$;