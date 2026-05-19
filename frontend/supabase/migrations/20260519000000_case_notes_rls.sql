-- Case notes visibility and client access
-- Admins see everything.
-- Assigned staff can see their own non-confidential notes and clients.
-- Case notes can be created only by assigned staff or admins.

DROP POLICY IF EXISTS "Case notes select" ON public.case_notes;
DROP POLICY IF EXISTS "Case notes insert" ON public.case_notes;
DROP POLICY IF EXISTS "Case notes update" ON public.case_notes;
DROP POLICY IF EXISTS "Case notes delete" ON public.case_notes;

CREATE POLICY "Case notes select"
  ON public.case_notes
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR (
      staff_id = public.get_user_staff_id(auth.uid())
      AND COALESCE(is_confidential, false) = false
    )
  );

CREATE POLICY "Case notes insert"
  ON public.case_notes
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR staff_id = public.get_user_staff_id(auth.uid())
  );

CREATE POLICY "Case notes update"
  ON public.case_notes
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR staff_id = public.get_user_staff_id(auth.uid())
  );

CREATE POLICY "Case notes delete"
  ON public.case_notes
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Ensure client access follows assignment visibility too
DROP POLICY IF EXISTS "Clients select " ON public.clients;
DROP POLICY IF EXISTS "Clients select" ON public.clients;

CREATE POLICY "Clients select"
  ON public.clients
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR id IN (SELECT csa.client_id FROM public.client_staff_assignments csa WHERE csa.staff_id = public.get_user_staff_id(auth.uid()))
    OR id IN (SELECT cn.client_id FROM public.case_notes cn WHERE cn.staff_id = public.get_user_staff_id(auth.uid()) AND COALESCE(cn.is_confidential, false) = false)
  );
