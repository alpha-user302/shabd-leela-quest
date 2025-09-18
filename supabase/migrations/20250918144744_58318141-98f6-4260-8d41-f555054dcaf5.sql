-- Add result lock system
ALTER TABLE public.pass_key ADD COLUMN IF NOT EXISTS results_locked BOOLEAN DEFAULT false;

-- Update existing records to have results_locked = false
UPDATE public.pass_key SET results_locked = false WHERE results_locked IS NULL;