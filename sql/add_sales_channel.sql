-- Script de migração para adicionar o campo 'sales_channel' na tabela 'profiles'
-- O campo define de qual canal de vendas o usuário faz parte
-- Valores possíveis: 'consumo', 'revenda', 'cozinhas', 'all' (para admins)

-- Adicionar campo sales_channel na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS sales_channel TEXT DEFAULT 'all' 
CHECK (sales_channel IN ('consumo', 'revenda', 'cozinhas', 'all'));

-- Comentário para documentação
COMMENT ON COLUMN public.profiles.sales_channel IS 'Canal de vendas do usuário: consumo, revenda, cozinhas ou all (para admins/visualização total)';

-- Criar índice para melhor performance nas consultas
CREATE INDEX IF NOT EXISTS idx_profiles_sales_channel ON public.profiles(sales_channel);

SELECT 'Campo sales_channel adicionado com sucesso!' as status;

