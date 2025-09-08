-- Allow agents to be created without a user_id (for admin-created agents)
ALTER TABLE public.agents 
ALTER COLUMN user_id DROP NOT NULL;