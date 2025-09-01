-- Create admin role type
CREATE TYPE public.user_role AS ENUM ('admin', 'agent');

-- Create user_roles table for admin access
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role user_role NOT NULL DEFAULT 'agent',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = user_uuid AND role = 'admin'
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.is_admin());

-- Admin policies for agents table
CREATE POLICY "Admins can view all agents" ON public.agents
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can create agents" ON public.agents
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update all agents" ON public.agents
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete agents" ON public.agents
  FOR DELETE USING (public.is_admin());

-- Admin policies for bookings table
CREATE POLICY "Admins can view all bookings" ON public.bookings
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update all bookings" ON public.bookings
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete bookings" ON public.bookings
  FOR DELETE USING (public.is_admin());

-- Admin policies for payments table
CREATE POLICY "Admins can view all payments" ON public.payments
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can create payments" ON public.payments
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update all payments" ON public.payments
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete payments" ON public.payments
  FOR DELETE USING (public.is_admin());