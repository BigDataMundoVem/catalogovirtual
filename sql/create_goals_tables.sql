-- =====================================================
-- Script para criar tabelas de Metas e Performance
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- 1. Tabela de Metas Mensais
CREATE TABLE IF NOT EXISTS public.monthly_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),
  target_contacts INTEGER DEFAULT 0,
  target_emails INTEGER DEFAULT 0,
  target_quotes INTEGER DEFAULT 0,
  target_orders INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_month_year UNIQUE (user_id, month, year)
);

-- 2. Tabela de Logs de Performance (registros diários)
CREATE TABLE IF NOT EXISTS public.performance_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  contacts_done INTEGER DEFAULT 0,
  emails_done INTEGER DEFAULT 0,
  quotes_done INTEGER DEFAULT 0,
  orders_done INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_entry_date UNIQUE (user_id, entry_date)
);

-- 3. Tabela de Perfis (se não existir)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'seller',
  avatar_url TEXT,
  is_sales_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Habilitar Row Level Security (RLS)
-- =====================================================

ALTER TABLE public.monthly_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Políticas para monthly_goals
-- =====================================================

-- Usuários autenticados podem ver todas as metas
DROP POLICY IF EXISTS "monthly_goals_select_authenticated" ON public.monthly_goals;
CREATE POLICY "monthly_goals_select_authenticated" ON public.monthly_goals
  FOR SELECT USING (auth.role() = 'authenticated');

-- Usuários autenticados podem inserir/atualizar (admins controlam via app)
DROP POLICY IF EXISTS "monthly_goals_insert_authenticated" ON public.monthly_goals;
CREATE POLICY "monthly_goals_insert_authenticated" ON public.monthly_goals
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "monthly_goals_update_authenticated" ON public.monthly_goals;
CREATE POLICY "monthly_goals_update_authenticated" ON public.monthly_goals
  FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "monthly_goals_delete_authenticated" ON public.monthly_goals;
CREATE POLICY "monthly_goals_delete_authenticated" ON public.monthly_goals
  FOR DELETE USING (auth.role() = 'authenticated');

-- =====================================================
-- Políticas para performance_logs
-- =====================================================

-- Usuários podem ver todos os logs (para leaderboard)
DROP POLICY IF EXISTS "performance_logs_select_authenticated" ON public.performance_logs;
CREATE POLICY "performance_logs_select_authenticated" ON public.performance_logs
  FOR SELECT USING (auth.role() = 'authenticated');

-- Usuários podem inserir/atualizar seus próprios logs
DROP POLICY IF EXISTS "performance_logs_insert_own" ON public.performance_logs;
CREATE POLICY "performance_logs_insert_own" ON public.performance_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "performance_logs_update_own" ON public.performance_logs;
CREATE POLICY "performance_logs_update_own" ON public.performance_logs
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "performance_logs_delete_own" ON public.performance_logs;
CREATE POLICY "performance_logs_delete_own" ON public.performance_logs
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- Políticas para profiles
-- =====================================================

-- Todos podem ver perfis
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT USING (true);

-- Usuários podem atualizar seu próprio perfil
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Inserção permitida (para criação de novos usuários)
DROP POLICY IF EXISTS "profiles_insert_authenticated" ON public.profiles;
CREATE POLICY "profiles_insert_authenticated" ON public.profiles
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- Grants de permissão
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.monthly_goals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.performance_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- =====================================================
-- Trigger para criar perfil automaticamente ao criar usuário
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'seller')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para novos usuários
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- Índices para performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_monthly_goals_user_id ON public.monthly_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_goals_month_year ON public.monthly_goals(month, year);
CREATE INDEX IF NOT EXISTS idx_performance_logs_user_id ON public.performance_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_logs_entry_date ON public.performance_logs(entry_date);
CREATE INDEX IF NOT EXISTS idx_profiles_is_sales_active ON public.profiles(is_sales_active);

-- =====================================================
-- Verificação
-- =====================================================
SELECT 'Tabelas criadas com sucesso!' as status;

