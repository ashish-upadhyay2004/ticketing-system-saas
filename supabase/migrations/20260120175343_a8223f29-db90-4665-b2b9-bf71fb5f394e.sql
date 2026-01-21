-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('user', 'agent', 'admin');

-- Create priority enum
CREATE TYPE public.ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Create status enum
CREATE TYPE public.ticket_status AS ENUM ('open', 'assigned', 'in_progress', 'waiting_on_user', 'on_hold', 'escalated', 'resolved', 'closed', 'reopened', 'cancelled', 'duplicate');

-- Create automation trigger enum
CREATE TYPE public.automation_trigger AS ENUM ('on_create', 'on_status_change', 'on_priority_change', 'time_based');

-- Create notification type enum
CREATE TYPE public.notification_type AS ENUM ('ticket_created', 'ticket_assigned', 'ticket_updated', 'ticket_message', 'ticket_resolved', 'ticket_escalated', 'sla_warning', 'sla_breached', 'system');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  avatar_url TEXT,
  org TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User roles table (for proper role management)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Teams table
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Team members table
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_id, agent_id)
);

-- Categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tags table
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- SLA rules table
CREATE TABLE public.sla_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  priority ticket_priority NOT NULL UNIQUE,
  response_minutes INTEGER NOT NULL,
  resolve_minutes INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tickets table
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number SERIAL,
  created_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  assigned_agent UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  assigned_team UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  priority ticket_priority NOT NULL DEFAULT 'medium',
  status ticket_status NOT NULL DEFAULT 'open',
  sla_response_due TIMESTAMP WITH TIME ZONE,
  sla_resolve_due TIMESTAMP WITH TIME ZONE,
  sla_breached BOOLEAN DEFAULT FALSE,
  merged_into_ticket_id UUID REFERENCES public.tickets(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ticket tags junction table
CREATE TABLE public.ticket_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(ticket_id, tag_id)
);

-- Ticket messages table
CREATE TABLE public.ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ticket attachments table
CREATE TABLE public.ticket_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
  message_id UUID REFERENCES public.ticket_messages(id) ON DELETE SET NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type notification_type NOT NULL DEFAULT 'system',
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Audit logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Knowledge base articles table
CREATE TABLE public.knowledge_base_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  published BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Automation rules table
CREATE TABLE public.automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  trigger automation_trigger NOT NULL,
  condition JSONB DEFAULT '{}',
  action JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Feedback table
CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
  from_user UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_tickets_created_by ON public.tickets(created_by);
CREATE INDEX idx_tickets_assigned_agent ON public.tickets(assigned_agent);
CREATE INDEX idx_tickets_status ON public.tickets(status);
CREATE INDEX idx_tickets_priority ON public.tickets(priority);
CREATE INDEX idx_ticket_messages_ticket_id ON public.ticket_messages(ticket_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_audit_logs_ticket_id ON public.audit_logs(ticket_id);
CREATE INDEX idx_audit_logs_actor_id ON public.audit_logs(actor_id);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sla_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to get user's primary role from profiles
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = _user_id
$$;

-- Function to check if user is agent or admin
CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND role IN ('agent', 'admin')
  )
$$;

-- Profiles RLS Policies
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- User roles RLS Policies
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'admin');

-- Teams RLS Policies
CREATE POLICY "Everyone can view teams" ON public.teams
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage teams" ON public.teams
  FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'admin');

-- Team members RLS Policies
CREATE POLICY "Everyone can view team members" ON public.team_members
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage team members" ON public.team_members
  FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'admin');

-- Categories RLS Policies
CREATE POLICY "Everyone can view categories" ON public.categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage categories" ON public.categories
  FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'admin');

-- Tags RLS Policies
CREATE POLICY "Everyone can view tags" ON public.tags
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage tags" ON public.tags
  FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'admin');

-- SLA rules RLS Policies
CREATE POLICY "Everyone can view SLA rules" ON public.sla_rules
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage SLA rules" ON public.sla_rules
  FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'admin');

-- Tickets RLS Policies
CREATE POLICY "Users can view own tickets" ON public.tickets
  FOR SELECT TO authenticated USING (
    created_by = auth.uid() OR 
    assigned_agent = auth.uid() OR 
    public.is_staff(auth.uid())
  );

CREATE POLICY "Users can create tickets" ON public.tickets
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own tickets" ON public.tickets
  FOR UPDATE TO authenticated USING (
    created_by = auth.uid() OR 
    assigned_agent = auth.uid() OR 
    public.is_staff(auth.uid())
  );

-- Ticket tags RLS Policies
CREATE POLICY "View ticket tags" ON public.ticket_tags
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.tickets t 
      WHERE t.id = ticket_id AND (
        t.created_by = auth.uid() OR 
        t.assigned_agent = auth.uid() OR 
        public.is_staff(auth.uid())
      )
    )
  );

CREATE POLICY "Staff can manage ticket tags" ON public.ticket_tags
  FOR ALL TO authenticated USING (public.is_staff(auth.uid()));

-- Ticket messages RLS Policies
CREATE POLICY "View ticket messages" ON public.ticket_messages
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.tickets t 
      WHERE t.id = ticket_id AND (
        t.created_by = auth.uid() OR 
        t.assigned_agent = auth.uid() OR 
        public.is_staff(auth.uid())
      )
    ) AND (
      is_internal = false OR public.is_staff(auth.uid())
    )
  );

CREATE POLICY "Users can send messages" ON public.ticket_messages
  FOR INSERT TO authenticated WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.tickets t 
      WHERE t.id = ticket_id AND (
        t.created_by = auth.uid() OR 
        t.assigned_agent = auth.uid() OR 
        public.is_staff(auth.uid())
      )
    )
  );

-- Ticket attachments RLS Policies
CREATE POLICY "View ticket attachments" ON public.ticket_attachments
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.tickets t 
      WHERE t.id = ticket_id AND (
        t.created_by = auth.uid() OR 
        t.assigned_agent = auth.uid() OR 
        public.is_staff(auth.uid())
      )
    )
  );

CREATE POLICY "Users can upload attachments" ON public.ticket_attachments
  FOR INSERT TO authenticated WITH CHECK (uploaded_by = auth.uid());

-- Notifications RLS Policies
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (true);

-- Audit logs RLS Policies
CREATE POLICY "Staff can view audit logs" ON public.audit_logs
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- Knowledge base RLS Policies
CREATE POLICY "Everyone can view published articles" ON public.knowledge_base_articles
  FOR SELECT TO authenticated USING (published = true OR public.is_staff(auth.uid()));

CREATE POLICY "Staff can manage articles" ON public.knowledge_base_articles
  FOR ALL TO authenticated USING (public.is_staff(auth.uid()));

-- Automation rules RLS Policies
CREATE POLICY "Admins can view automation rules" ON public.automation_rules
  FOR SELECT TO authenticated USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can manage automation rules" ON public.automation_rules
  FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'admin');

-- Feedback RLS Policies
CREATE POLICY "Users can view own feedback" ON public.feedback
  FOR SELECT TO authenticated USING (
    from_user = auth.uid() OR public.is_staff(auth.uid())
  );

CREATE POLICY "Users can submit feedback" ON public.feedback
  FOR INSERT TO authenticated WITH CHECK (from_user = auth.uid());

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'user')
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'user')
  );
  
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sla_rules_updated_at
  BEFORE UPDATE ON public.sla_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_knowledge_base_articles_updated_at
  BEFORE UPDATE ON public.knowledge_base_articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_automation_rules_updated_at
  BEFORE UPDATE ON public.automation_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate SLA due times
CREATE OR REPLACE FUNCTION public.calculate_sla_times()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sla_rule RECORD;
BEGIN
  SELECT * INTO sla_rule FROM public.sla_rules WHERE priority = NEW.priority;
  
  IF sla_rule IS NOT NULL THEN
    NEW.sla_response_due = NEW.created_at + (sla_rule.response_minutes || ' minutes')::INTERVAL;
    NEW.sla_resolve_due = NEW.created_at + (sla_rule.resolve_minutes || ' minutes')::INTERVAL;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER calculate_ticket_sla
  BEFORE INSERT ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.calculate_sla_times();

-- Insert default SLA rules
INSERT INTO public.sla_rules (priority, response_minutes, resolve_minutes) VALUES
  ('low', 480, 2880),
  ('medium', 240, 1440),
  ('high', 60, 480),
  ('urgent', 15, 120);

-- Insert default categories
INSERT INTO public.categories (name, description) VALUES
  ('Technical Support', 'Technical issues and troubleshooting'),
  ('Billing', 'Payment and subscription inquiries'),
  ('General Inquiry', 'General questions and information'),
  ('Feature Request', 'Suggestions for new features'),
  ('Bug Report', 'Report software bugs and issues');

-- Insert default tags
INSERT INTO public.tags (name, color) VALUES
  ('Urgent', '#ef4444'),
  ('VIP', '#f59e0b'),
  ('Payment', '#10b981'),
  ('Technical', '#3b82f6'),
  ('Documentation', '#8b5cf6');

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;