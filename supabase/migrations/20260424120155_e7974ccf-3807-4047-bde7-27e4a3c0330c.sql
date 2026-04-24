-- Auto-link student/teacher records to auth user by email on signup
CREATE OR REPLACE FUNCTION public.auto_link_user_records()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Link student row by matching email
  UPDATE public.students
  SET user_id = NEW.id, updated_at = now()
  WHERE lower(email) = lower(NEW.email) AND user_id IS NULL;

  -- Link teacher row by matching email; promote role to teacher if matched
  IF EXISTS (SELECT 1 FROM public.teachers WHERE lower(email) = lower(NEW.email) AND user_id IS NULL) THEN
    UPDATE public.teachers
    SET user_id = NEW.id, updated_at = now()
    WHERE lower(email) = lower(NEW.email) AND user_id IS NULL;

    -- Replace default 'student' role with 'teacher'
    DELETE FROM public.user_roles WHERE user_id = NEW.id AND role = 'student';
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'teacher')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Run AFTER handle_new_user (which creates profile + default role)
DROP TRIGGER IF EXISTS on_auth_user_auto_link ON auth.users;
CREATE TRIGGER on_auth_user_auto_link
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_link_user_records();

-- Make sure handle_new_user trigger exists too (defensive)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add updated_at trigger on attendance for edit tracking (optional)
-- (skipped: attendance has no updated_at)

-- Allow teachers to delete their own attendance entries (for corrections)
DROP POLICY IF EXISTS "teacher delete attendance" ON public.attendance;
CREATE POLICY "teacher delete attendance"
ON public.attendance FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'teacher') OR has_role(auth.uid(), 'admin'));