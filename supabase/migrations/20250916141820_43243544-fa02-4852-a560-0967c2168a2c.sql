-- Fix search path security warnings for all functions
CREATE OR REPLACE FUNCTION public.verify_admin_login(
  input_username TEXT,
  input_password TEXT
)
RETURNS TABLE(admin_id UUID, username TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Fix team login function
CREATE OR REPLACE FUNCTION public.verify_team_login(
  input_username TEXT,
  input_password TEXT
)
RETURNS TABLE(team_id UUID, username TEXT, team_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.username, t.team_name
  FROM public.teams t
  WHERE t.username = input_username 
    AND t.password_hash = input_password;
END;
$$;

-- Fix add team function
CREATE OR REPLACE FUNCTION public.add_team(
  team_username TEXT,
  team_password TEXT,
  team_display_name TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Fix set pass key function
CREATE OR REPLACE FUNCTION public.set_pass_key(new_pass_key TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete existing pass key and insert new one
  DELETE FROM public.pass_key;
  INSERT INTO public.pass_key (pass_key) VALUES (new_pass_key);
END;
$$;

-- Fix get team reports function
CREATE OR REPLACE FUNCTION public.get_team_reports()
RETURNS TABLE(
  team_name TEXT,
  answered_key TEXT,
  accuracy_percentage NUMERIC,
  submitted_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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