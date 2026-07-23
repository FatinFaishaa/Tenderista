-- Hand-authored (see chat: prisma migrate dev's shadow-database replay fails on the
-- pre-existing Opening Checklist migration ordering issue, unrelated to this change).
--
-- Fixes: "new row violates row-level security policy for table users" when an Owner
-- adds a new staff member. The users table's WITH CHECK only ever allowed a session to
-- write its OWN row (id = app.current_user_id) — correct for self-service profile
-- edits, but it blocks the legitimate case of an Owner provisioning a DIFFERENT
-- person's account. It also silently broke the find-existing-user-by-email lookup
-- used to avoid creating duplicate accounts: the users USING clause only reveals a
-- row if the caller already shares a branch with that person, so a brand-new hire
-- (who shares no branch with the Owner yet) was invisible to that lookup too.
--
-- Fix: three narrow SECURITY DEFINER functions, same pattern as
-- app_authenticate_user_lookup in 20260722031108_init — they bypass RLS internally
-- (owned by the table-owning role) rather than widening the users table's own
-- policy, which stays exactly as restrictive as before for direct queries.

CREATE OR REPLACE FUNCTION app_find_user_by_email(p_email text)
RETURNS TABLE(id uuid, name text)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT id, name FROM users WHERE email = p_email LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION app_create_user(p_name text, p_email text, p_password_hash text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO users (name, email, password_hash)
  VALUES (p_name, p_email, p_password_hash)
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION app_update_user_profile(p_user_id uuid, p_name text, p_email text)
RETURNS void
LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE users SET name = p_name, email = p_email WHERE id = p_user_id;
$$;

GRANT EXECUTE ON FUNCTION app_find_user_by_email(text) TO tenderista_app;
GRANT EXECUTE ON FUNCTION app_create_user(text, text, text) TO tenderista_app;
GRANT EXECUTE ON FUNCTION app_update_user_profile(uuid, text, text) TO tenderista_app;
