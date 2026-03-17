-- =============================
-- Exclusão de conta do usuário
-- Execute no SQL Editor do Supabase (Dashboard → SQL Editor → New query)
-- =============================

-- 1) Função que apaga os dados do usuário atual (user_data e profiles).
--    O usuário continua existindo no Auth até você implementar a Edge Function (opcional).
CREATE OR REPLACE FUNCTION public.delete_current_user_and_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Nenhum usuário autenticado';
  END IF;

  -- Apaga dados do app (transações, metas, etc. guardados em user_data)
  DELETE FROM public.user_data WHERE user_id = v_uid;

  -- Apaga perfil (username), se a tabela existir
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    DELETE FROM public.profiles WHERE user_id = v_uid;
  END IF;
END;
$$;

-- 2) Permite que o app (anon/authenticated) chame a função
GRANT EXECUTE ON FUNCTION public.delete_current_user_and_data() TO anon;
GRANT EXECUTE ON FUNCTION public.delete_current_user_and_data() TO authenticated;
