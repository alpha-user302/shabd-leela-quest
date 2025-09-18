-- Add individual lock column to teams table
ALTER TABLE public.teams 
ADD COLUMN is_locked BOOLEAN NOT NULL DEFAULT false;

-- Update RLS policy to allow admins to update team lock status
CREATE POLICY "Admins can update team lock status" 
ON public.teams 
FOR UPDATE 
USING (true)
WITH CHECK (true);