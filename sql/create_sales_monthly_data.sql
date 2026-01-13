-- ==========================================================================
-- TABELA: sales_monthly_data
-- Armazena dados de vendas/faturamento por usuário, canal e mês
-- ==========================================================================

-- Criar tabela principal
CREATE TABLE IF NOT EXISTS public.sales_monthly_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  nome TEXT NOT NULL,
  codigo TEXT,
  setor TEXT NOT NULL,
  canal TEXT NOT NULL CHECK (canal IN ('consumo', 'revenda', 'cozinhas')),
  meta_mensal NUMERIC(15, 2) DEFAULT 0,
  valor_realizado NUMERIC(15, 2) DEFAULT 0,
  pedidos_em_aberto NUMERIC(15, 2) DEFAULT 0,
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint única: um usuário só pode ter um registro por canal/mês
  CONSTRAINT unique_user_canal_mes UNIQUE (user_id, canal, ano, mes)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_sales_monthly_canal_ano_mes 
  ON public.sales_monthly_data (canal, ano, mes);

CREATE INDEX IF NOT EXISTS idx_sales_monthly_user_id 
  ON public.sales_monthly_data (user_id);

-- Comentários
COMMENT ON TABLE public.sales_monthly_data IS 'Dados de vendas e faturamento mensais por usuário e canal';
COMMENT ON COLUMN public.sales_monthly_data.user_id IS 'ID único do usuário (pode ser gerado localmente)';
COMMENT ON COLUMN public.sales_monthly_data.canal IS 'Canal de vendas: consumo, revenda ou cozinhas';
COMMENT ON COLUMN public.sales_monthly_data.meta_mensal IS 'Meta de vendas do mês em R$';
COMMENT ON COLUMN public.sales_monthly_data.valor_realizado IS 'Valor já faturado no mês em R$';
COMMENT ON COLUMN public.sales_monthly_data.pedidos_em_aberto IS 'Valor de pedidos em aberto em R$';

-- ==========================================================================
-- RLS (Row Level Security)
-- ==========================================================================

ALTER TABLE public.sales_monthly_data ENABLE ROW LEVEL SECURITY;

-- Política: Admins podem fazer tudo
CREATE POLICY "admin_full_access_sales_monthly" ON public.sales_monthly_data
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Política: Usuários autenticados podem ler
CREATE POLICY "authenticated_read_sales_monthly" ON public.sales_monthly_data
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- ==========================================================================
-- FUNÇÃO: Atualizar updated_at automaticamente
-- ==========================================================================

CREATE OR REPLACE FUNCTION update_sales_monthly_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_sales_monthly_updated_at ON public.sales_monthly_data;
CREATE TRIGGER trigger_update_sales_monthly_updated_at
  BEFORE UPDATE ON public.sales_monthly_data
  FOR EACH ROW
  EXECUTE FUNCTION update_sales_monthly_updated_at();

-- ==========================================================================
-- GRANT: Permissões para usuários autenticados
-- ==========================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_monthly_data TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

