-- =============================================
-- SCHEMA DO CATALOGO - Execute no SQL Editor do Supabase
-- =============================================

-- Tabela de Categorias (Famílias)
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Produtos
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  image TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Histórico de Login
CREATE TABLE IF NOT EXISTS login_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  logged_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_login_history_user ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_date ON login_history(logged_in_at DESC);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at em products
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- POLÍTICAS DE SEGURANÇA (RLS)
-- =============================================

-- Habilitar RLS nas tabelas
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;

-- Políticas para categories (leitura pública, escrita autenticada)
CREATE POLICY "Categorias visíveis para todos" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Apenas autenticados podem criar categorias" ON categories
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Apenas autenticados podem atualizar categorias" ON categories
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Apenas autenticados podem deletar categorias" ON categories
  FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para products (leitura pública, escrita autenticada)
CREATE POLICY "Produtos visíveis para todos" ON products
  FOR SELECT USING (true);

CREATE POLICY "Apenas autenticados podem criar produtos" ON products
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Apenas autenticados podem atualizar produtos" ON products
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Apenas autenticados podem deletar produtos" ON products
  FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para login_history (apenas autenticados)
CREATE POLICY "Autenticados podem ver histórico" ON login_history
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Sistema pode inserir histórico" ON login_history
  FOR INSERT WITH CHECK (true);

-- =============================================
-- STORAGE BUCKET PARA IMAGENS
-- =============================================
-- Execute estas linhas no SQL Editor:

INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Política para upload de imagens (autenticados)
CREATE POLICY "Autenticados podem fazer upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'products' AND
    auth.role() = 'authenticated'
  );

-- Política para visualizar imagens (público)
CREATE POLICY "Imagens públicas" ON storage.objects
  FOR SELECT USING (bucket_id = 'products');

-- Política para deletar imagens (autenticados)
CREATE POLICY "Autenticados podem deletar imagens" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'products' AND
    auth.role() = 'authenticated'
  );
