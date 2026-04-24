-- =========================================
-- ENUMS
-- =========================================
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'student');
CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'late');
CREATE TYPE public.notice_audience AS ENUM ('teachers', 'students', 'both');
CREATE TYPE public.fee_status AS ENUM ('paid', 'partial', 'pending', 'overdue');
CREATE TYPE public.performance_grade AS ENUM ('W', 'R', 'U', 'AD');

-- =========================================
-- PROFILES
-- =========================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =========================================
-- USER ROLES
-- =========================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer for role checks (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- =========================================
-- AUTO PROFILE ON SIGNUP
-- =========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  -- default role: student (admins can re-assign)
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger helper
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================================
-- ACADEMIC STRUCTURE
-- =========================================
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,        -- A, B, C, D
  grade_level TEXT,                 -- e.g. Grade 5
  section TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  employee_id TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  qualification TEXT,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  joining_date DATE DEFAULT CURRENT_DATE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER teachers_touch BEFORE UPDATE ON public.teachers
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  admission_no TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  roll_no TEXT,
  parent_name TEXT,
  parent_phone TEXT,
  date_of_birth DATE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER students_touch BEFORE UPDATE ON public.students
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.class_teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (class_id, teacher_id, subject_id)
);
ALTER TABLE public.class_teachers ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.student_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  UNIQUE (student_id, subject_id)
);
ALTER TABLE public.student_subjects ENABLE ROW LEVEL SECURITY;

-- =========================================
-- ATTENDANCE
-- =========================================
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status attendance_status NOT NULL DEFAULT 'present',
  marked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, date)
);
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- =========================================
-- HOMEWORK
-- =========================================
CREATE TABLE public.homework (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  attachment_url TEXT,
  due_date DATE,
  posted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;

-- =========================================
-- NOTICES
-- =========================================
CREATE TABLE public.notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  audience notice_audience NOT NULL DEFAULT 'both',
  image_url TEXT,
  posted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- =========================================
-- FEES
-- =========================================
CREATE TABLE public.fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  net_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  due_date DATE,
  status fee_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER fees_touch BEFORE UPDATE ON public.fees
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.fee_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_id UUID NOT NULL REFERENCES public.fees(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  paid_on DATE NOT NULL DEFAULT CURRENT_DATE,
  method TEXT,
  reference TEXT,
  recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;

-- =========================================
-- REPORTS / PERFORMANCE
-- =========================================
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  term TEXT NOT NULL DEFAULT 'Term 1',
  percentage NUMERIC(5,2),
  grade performance_grade,
  remarks TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- =========================================
-- RLS POLICIES
-- =========================================

-- profiles
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'));
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "admin manage profiles" ON public.profiles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- user_roles
CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin manage roles" ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- classes (everyone signed in can read; admins manage)
CREATE POLICY "read classes" ON public.classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin manage classes" ON public.classes FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- subjects
CREATE POLICY "read subjects" ON public.subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin manage subjects" ON public.subjects FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- teachers
CREATE POLICY "read teachers" ON public.teachers FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin manage teachers" ON public.teachers FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "teacher self update" ON public.teachers FOR UPDATE TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- students
CREATE POLICY "read students" ON public.students FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'teacher')
  OR user_id = auth.uid()
);
CREATE POLICY "admin manage students" ON public.students FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- class_teachers
CREATE POLICY "read class_teachers" ON public.class_teachers FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin manage class_teachers" ON public.class_teachers FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- student_subjects
CREATE POLICY "read student_subjects" ON public.student_subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin manage student_subjects" ON public.student_subjects FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- attendance
CREATE POLICY "read attendance" ON public.attendance FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'teacher')
  OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = attendance.student_id AND s.user_id = auth.uid())
);
CREATE POLICY "teacher mark attendance" ON public.attendance FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "teacher update attendance" ON public.attendance FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin delete attendance" ON public.attendance FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- homework
CREATE POLICY "read homework" ON public.homework FOR SELECT TO authenticated USING (true);
CREATE POLICY "teacher post homework" ON public.homework FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "teacher edit homework" ON public.homework FOR UPDATE TO authenticated
USING (posted_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (posted_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "teacher delete homework" ON public.homework FOR DELETE TO authenticated
USING (posted_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- notices
CREATE POLICY "read notices" ON public.notices FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff post notices" ON public.notices FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "staff edit own notices" ON public.notices FOR UPDATE TO authenticated
USING (posted_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (posted_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "staff delete own notices" ON public.notices FOR DELETE TO authenticated
USING (posted_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- fees
CREATE POLICY "read fees" ON public.fees FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'teacher')
  OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = fees.student_id AND s.user_id = auth.uid())
);
CREATE POLICY "admin manage fees" ON public.fees FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- fee_payments
CREATE POLICY "read fee_payments" ON public.fee_payments FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.fees f JOIN public.students s ON s.id = f.student_id
    WHERE f.id = fee_payments.fee_id AND s.user_id = auth.uid()
  )
);
CREATE POLICY "admin manage fee_payments" ON public.fee_payments FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- reports
CREATE POLICY "read reports" ON public.reports FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'teacher')
  OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = reports.student_id AND s.user_id = auth.uid())
);
CREATE POLICY "staff manage reports" ON public.reports FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

-- =========================================
-- STORAGE: school-files bucket
-- =========================================
INSERT INTO storage.buckets (id, name, public) VALUES ('school-files', 'school-files', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "school-files read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'school-files');
CREATE POLICY "school-files upload staff" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'school-files' AND (public.has_role(auth.uid(),'teacher') OR public.has_role(auth.uid(),'admin')));
CREATE POLICY "school-files update staff" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'school-files' AND (public.has_role(auth.uid(),'teacher') OR public.has_role(auth.uid(),'admin')));
CREATE POLICY "school-files delete staff" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'school-files' AND (public.has_role(auth.uid(),'teacher') OR public.has_role(auth.uid(),'admin')));

-- =========================================
-- SEED minimal academic data
-- =========================================
INSERT INTO public.classes (name, grade_level) VALUES
  ('A', 'Grade 5'), ('B', 'Grade 6'), ('C', 'Grade 7'), ('D', 'Grade 8')
ON CONFLICT DO NOTHING;

INSERT INTO public.subjects (name, code, color) VALUES
  ('Mathematics', 'MATH', '#6366f1'),
  ('English', 'ENG', '#10b981'),
  ('Hindi', 'HIN', '#f59e0b'),
  ('Science', 'SCI', '#06b6d4'),
  ('Social Studies', 'SST', '#ef4444')
ON CONFLICT DO NOTHING;