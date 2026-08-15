/*
# Fix: is_admin() search_path and grant EXECUTE

## Summary
The is_admin() function had `SET search_path TO ''` (empty string), which can cause
the function to fail silently when resolving the `public.profiles` table reference.
This migration sets the search_path to `public` explicitly.

## Changes
1. Recreate is_admin() with `SET search_path = public`.
2. Re-grant EXECUTE to authenticated role.
*/

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND p.is_suspended = false
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
