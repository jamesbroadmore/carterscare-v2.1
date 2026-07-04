-- Align onboarding checklist with current NDIS + Aged Care legislative requirements
--
-- Rationale (see PR description for sources):
-- * NDIS Worker Screening Check (or, for aged-care-only workers, a National Police
--   Certificate issued within the last 3 years) is the actual screening requirement —
--   NOT both a "National Police Check" and a "Working with Children Check" as two
--   separate blanket-required items. WWCC is only required for child-related work.
-- * The "NDIS Worker Orientation Module (Quality, Safety and You)" is the training
--   module actually mandated by the NDIS Commission for all workers and was missing
--   entirely from the previous checklist.
-- * COVID-19 vaccination is no longer a blanket mandatory requirement and should not
--   be a hard gate in onboarding.

-- 1. Replace the auto-onboarding-task trigger function with a corrected task list.
CREATE OR REPLACE FUNCTION public.create_onboarding_tasks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  task_names TEXT[] := ARRAY[
    'Worker Screening Check (NDIS Worker Screening Check, or National Police Certificate issued within the last 3 years)',
    'NDIS Worker Orientation Module (Quality, Safety and You)',
    'Working with Children Check (only required if your role involves child-related work)',
    'First Aid Certificate',
    'CPR Certificate',
    'Manual Handling Training',
    'Driver Licence',
    'Contractor Agreement Signed',
    'NDIS Code of Conduct Acknowledged',
    'Privacy Policy Acknowledged',
    'Safeguarding Policy Acknowledged'
  ];
  task_types TEXT[] := ARRAY[
    'document', 'training', 'document', 'document', 'document',
    'training', 'document', 'document', 'policy', 'policy', 'policy'
  ];
  i INT;
BEGIN
  FOR i IN 1..array_length(task_names, 1) LOOP
    INSERT INTO public.onboarding_tasks (staff_id, task_name, task_type)
    VALUES (NEW.id, task_names[i], task_types[i]);
  END LOOP;
  RETURN NEW;
END;
$$;

-- 2. Backfill: for any staff already onboarded under the old task list, add the
--    NDIS Worker Orientation Module task if missing, and relabel the screening
--    check tasks so existing rows reflect the corrected wording without losing
--    completion history.
UPDATE public.onboarding_tasks
SET task_name = 'Worker Screening Check (NDIS Worker Screening Check, or National Police Certificate issued within the last 3 years)'
WHERE task_name = 'National Police Check';

UPDATE public.onboarding_tasks
SET task_name = 'Working with Children Check (only required if your role involves child-related work)'
WHERE task_name = 'Working with Children Check';

UPDATE public.onboarding_tasks
SET task_name = 'NDIS Code of Conduct Acknowledged'
WHERE task_name = 'Code of Conduct Acknowledged';

INSERT INTO public.onboarding_tasks (staff_id, task_name, task_type, status)
SELECT s.id, 'NDIS Worker Orientation Module (Quality, Safety and You)', 'training', 'pending'
FROM public.staff s
WHERE NOT EXISTS (
  SELECT 1 FROM public.onboarding_tasks t
  WHERE t.staff_id = s.id AND t.task_name = 'NDIS Worker Orientation Module (Quality, Safety and You)'
);

INSERT INTO public.onboarding_tasks (staff_id, task_name, task_type, status)
SELECT s.id, 'Manual Handling Training', 'training', 'pending'
FROM public.staff s
WHERE NOT EXISTS (
  SELECT 1 FROM public.onboarding_tasks t
  WHERE t.staff_id = s.id AND t.task_name = 'Manual Handling Training'
);

-- 3. Remove any legacy blanket COVID-19 vaccination onboarding tasks/policies —
--    no longer a mandatory requirement.
DELETE FROM public.onboarding_tasks WHERE task_name ILIKE '%covid%vaccination%';

-- 4. Update seeded Code of Conduct policy title/content to be explicit that it is the
--    NDIS Code of Conduct (registered NDIS providers must have workers acknowledge it).
UPDATE public.policies
SET title = 'NDIS Code of Conduct',
    content = 'All staff must act with integrity, respect the rights of people with disability and older Australians, maintain professional boundaries, and report concerns about client safety immediately, in line with the NDIS Code of Conduct and Aged Care Code of Conduct. Staff must not accept gifts or share client information outside of work, and must complete the NDIS Worker Orientation Module ("Quality, Safety and You") as part of onboarding.'
WHERE title = 'Code of Conduct';
