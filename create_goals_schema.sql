-- 1. Tabela para definir as Metas Mensais de cada Vendedor
CREATE TABLE monthly_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  target_contacts INTEGER DEFAULT 0, -- Meta de Contatos
  target_quotes INTEGER DEFAULT 0,   -- Meta de Orçamentos
  target_orders INTEGER DEFAULT 0,   -- Meta de Pedidos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, month, year)
);

-- 2. Tabela para o Histórico de Lançamentos (Auditoria e Soma)
CREATE TABLE performance_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  entry_date DATE DEFAULT CURRENT_DATE NOT NULL,
  
  -- Valores realizados neste lançamento
  contacts_done INTEGER DEFAULT 0,
  quotes_done INTEGER DEFAULT 0,
  orders_done INTEGER DEFAULT 0,
  
  notes TEXT, 
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexação para performance
CREATE INDEX idx_goals_user_date ON monthly_goals(user_id, month, year);
CREATE INDEX idx_logs_user_date ON performance_logs(user_id, entry_date);

-- RLS (Row Level Security) Policies
ALTER TABLE monthly_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Vendedores podem ver suas próprias metas, Admins podem ver todas
CREATE POLICY "Users can view own goals" ON monthly_goals
  FOR SELECT USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Policy: Apenas Admins podem criar/editar metas
CREATE POLICY "Admins can manage goals" ON monthly_goals
  FOR ALL USING (EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Policy: Vendedores podem ver e criar seus próprios logs
CREATE POLICY "Users can manage own logs" ON performance_logs
  FOR ALL USING (auth.uid() = user_id);

-- Policy: Admins podem ver logs de todos
CREATE POLICY "Admins can view all logs" ON performance_logs
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));
