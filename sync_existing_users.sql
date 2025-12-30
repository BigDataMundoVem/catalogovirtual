-- 1. Copia usuários existentes do sistema de Auth para a tabela de Perfis
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  id, 
  email, 
  split_part(email, '@', 1) as full_name, -- Usa a parte antes do @ como nome inicial
  'viewer' as role
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 2. Garante que os roles estejam sincronizados também (opcional, mas bom para garantir)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'viewer' FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
