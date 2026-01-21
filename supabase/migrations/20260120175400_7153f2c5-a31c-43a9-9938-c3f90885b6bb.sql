-- Fix RLS policies for notifications and audit_logs to be more restrictive
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

-- More restrictive notification insert policy
CREATE POLICY "Authenticated users can insert notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (
    public.is_staff(auth.uid()) OR user_id = auth.uid()
  );

-- More restrictive audit log insert policy  
CREATE POLICY "Staff can insert audit logs" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (
    actor_id = auth.uid()
  );

-- Fix function search paths
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;