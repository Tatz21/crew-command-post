-- Grant admin privileges to the authenticated user
INSERT INTO public.user_roles (user_id, role) 
VALUES ('b92bb2fe-8768-46ef-911e-428156d45aeb', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;