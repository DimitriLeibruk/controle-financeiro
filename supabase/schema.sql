-- =============================
-- Finance Control - Schema Supabase
-- Execute este script no SQL Editor do seu projeto Supabase
-- =============================

-- Tabela que armazena todos os dados do app por usuário (um JSON por usuário).
-- Mantém a mesma estrutura que você já usa no localStorage.
CREATE TABLE IF NOT EXISTS public.user_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  dados JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para buscar por user_id (já garantido por UNIQUE, mas ajuda em leituras).
CREATE INDEX IF NOT EXISTS idx_user_data_user_id ON public.user_data(user_id);

-- Comentário na tabela
COMMENT ON TABLE public.user_data IS 'Dados do Finance Control por usuário: transações, metas, objetivos, configuração.';

-- =============================
-- ROW LEVEL SECURITY (RLS)
-- Cada usuário só pode ver e alterar seus próprios dados.
-- =============================

ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;

-- Política: usuário só pode SELECT na própria linha
CREATE POLICY "Usuário pode ler seus dados"
  ON public.user_data
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: usuário só pode INSERT na própria linha (user_id = seu id)
CREATE POLICY "Usuário pode inserir seus dados"
  ON public.user_data
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: usuário só pode UPDATE na própria linha
CREATE POLICY "Usuário pode atualizar seus dados"
  ON public.user_data
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política: usuário só pode DELETE na própria linha
CREATE POLICY "Usuário pode deletar seus dados"
  ON public.user_data
  FOR DELETE
  USING (auth.uid() = user_id);

-- =============================
-- Trigger para atualizar updated_at automaticamente
-- =============================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_data_updated_at ON public.user_data;
CREATE TRIGGER trigger_user_data_updated_at
  BEFORE UPDATE ON public.user_data
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
