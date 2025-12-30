-- Adiciona coluna para controlar visibilidade nas metas
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_sales_active BOOLEAN DEFAULT TRUE;

-- Atualiza a View/Lógica se necessário (neste caso, é direto na tabela)
