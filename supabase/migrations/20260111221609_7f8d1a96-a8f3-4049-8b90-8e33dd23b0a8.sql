
-- =============================================
-- ENUMS
-- =============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'client');
CREATE TYPE public.offer_type AS ENUM ('one_shot', '45_jours', 'vip');
CREATE TYPE public.session_type AS ENUM ('one_shot', 'closing_45j', 'closing_vip', 'suivi');
CREATE TYPE public.session_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');
CREATE TYPE public.client_status AS ENUM ('prospect', 'active', 'completed', 'cancelled');
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'refunded', 'failed');
CREATE TYPE public.task_status AS ENUM ('todo', 'in_progress', 'done');
CREATE TYPE public.email_type AS ENUM ('confirmation', 'reminder', 'deliverable', 'cancellation', 'reschedule');
CREATE TYPE public.email_status AS ENUM ('pending', 'sent', 'failed');

-- =============================================
-- PROFILES TABLE
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- USER ROLES TABLE (separate for security)
-- =============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'client',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- SECURITY DEFINER FUNCTION FOR ROLE CHECKS
-- =============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- =============================================
-- HANDLE NEW USER FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- CLIENTS TABLE
-- =============================================
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offer public.offer_type NOT NULL,
  status public.client_status NOT NULL DEFAULT 'prospect',
  phone TEXT,
  company TEXT,
  website TEXT,
  instagram TEXT,
  tags TEXT[] DEFAULT '{}',
  internal_notes TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- =============================================
-- SESSIONS TABLE
-- =============================================
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  type public.session_type NOT NULL,
  status public.session_status NOT NULL DEFAULT 'scheduled',
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  google_event_id TEXT,
  meeting_link TEXT,
  notes TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- BOOKINGS TABLE
-- =============================================
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  offer public.offer_type NOT NULL,
  amount_cents INTEGER NOT NULL,
  payment_status public.payment_status NOT NULL DEFAULT 'pending',
  stripe_payment_id TEXT,
  stripe_session_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- =============================================
-- TASKS TABLE
-- =============================================
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status public.task_status NOT NULL DEFAULT 'todo',
  due_date DATE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- =============================================
-- DELIVERABLES TABLE
-- =============================================
CREATE TABLE public.deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  is_visible_to_client BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;

-- =============================================
-- EMAIL TEMPLATES TABLE
-- =============================================
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  type public.email_type NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- =============================================
-- EMAIL LOGS TABLE
-- =============================================
CREATE TABLE public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  type public.email_type NOT NULL,
  status public.email_status NOT NULL DEFAULT 'pending',
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- AVAILABILITY SLOTS TABLE
-- =============================================
CREATE TABLE public.availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- User roles policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Clients policies
CREATE POLICY "Clients can view their own record"
  ON public.clients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Clients can update their own record"
  ON public.clients FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all clients"
  ON public.clients FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Sessions policies
CREATE POLICY "Clients can view their own sessions"
  ON public.sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = sessions.client_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all sessions"
  ON public.sessions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Bookings policies
CREATE POLICY "Clients can view their own bookings"
  ON public.bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = bookings.client_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all bookings"
  ON public.bookings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Tasks policies
CREATE POLICY "Clients can view their own tasks"
  ON public.tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = tasks.client_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Clients can update their own tasks"
  ON public.tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = tasks.client_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all tasks"
  ON public.tasks FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Deliverables policies
CREATE POLICY "Clients can view visible deliverables"
  ON public.deliverables FOR SELECT
  USING (
    is_visible_to_client = true AND
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = deliverables.client_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all deliverables"
  ON public.deliverables FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Email templates policies (admin only)
CREATE POLICY "Admins can manage email templates"
  ON public.email_templates FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Email logs policies
CREATE POLICY "Clients can view their own email logs"
  ON public.email_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = email_logs.client_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all email logs"
  ON public.email_logs FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Availability slots policies (admin only)
CREATE POLICY "Anyone can view active availability slots"
  ON public.availability_slots FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage availability slots"
  ON public.availability_slots FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- UPDATE TIMESTAMP TRIGGER
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_deliverables_updated_at BEFORE UPDATE ON public.deliverables FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON public.email_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_availability_slots_updated_at BEFORE UPDATE ON public.availability_slots FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
