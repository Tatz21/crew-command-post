-- Fix existing functions by adding proper search_path
CREATE OR REPLACE FUNCTION public.generate_agent_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    code TEXT;
    exists_check BOOLEAN;
BEGIN
    LOOP
        code := 'AGT' || LPAD(floor(random() * 999999)::TEXT, 6, '0');
        SELECT EXISTS(SELECT 1 FROM public.agents WHERE agent_code = code) INTO exists_check;
        IF NOT exists_check THEN
            EXIT;
        END IF;
    END LOOP;
    RETURN code;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_booking_reference()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    ref TEXT;
    exists_check BOOLEAN;
BEGIN
    LOOP
        ref := 'BK' || UPPER(substr(md5(random()::TEXT), 1, 8));
        SELECT EXISTS(SELECT 1 FROM public.bookings WHERE booking_reference = ref) INTO exists_check;
        IF NOT exists_check THEN
            EXIT;
        END IF;
    END LOOP;
    RETURN ref;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;