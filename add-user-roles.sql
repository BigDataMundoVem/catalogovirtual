-- =============================================
-- ADICIONAR ROLES DE USUÁRIOS
-- Execute no SQL Editor do Supabase
-- =============================================

-- Tabela de roles dos usuários
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  role VARCHAR(20) NOT NULL DEFAULT 'viewer', -- 'admin' ou 'viewer'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_role CHECK (role IN ('admin', 'viewer'))
);

-- Índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);

-- Habilitar RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Política: apenas admins podem ver roles
CREATE POLICY "Autenticados podem ver roles" ON user_roles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Política: apenas admins podem modificar roles
CREATE POLICY "Apenas admins podem modificar roles" ON user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Inserir você como admin (substitua pelo seu user_id do Supabase)
-- Você pode encontrar o user_id em Authentication > Users
-- INSERT INTO user_roles (user_id, role) VALUES ('SEU-USER-ID-AQUI', 'admin');
