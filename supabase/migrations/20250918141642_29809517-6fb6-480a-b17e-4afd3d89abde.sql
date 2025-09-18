-- Update get_team_reports function to show latest submissions (including drafts)
CREATE OR REPLACE FUNCTION public.get_team_reports()
RETURNS TABLE(team_name text, answered_key text, accuracy_percentage numeric, submitted_at timestamp with time zone, is_final boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH latest_submissions AS (
    SELECT DISTINCT ON (ts.team_id) 
      ts.team_id,
      ts.answers,
      ts.submitted_at,
      ts.is_final,
      t.team_name
    FROM public.team_submissions ts
    JOIN public.teams t ON ts.team_id = t.id
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
    ls.submitted_at,
    ls.is_final
  FROM latest_submissions ls
  CROSS JOIN current_pass_key cpk
  ORDER BY accuracy_percentage DESC, ls.submitted_at ASC;
END;
$function$;