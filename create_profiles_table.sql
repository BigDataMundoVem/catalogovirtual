-- Cria tabela de perfis públicos para visualização na tabela de metas
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'viewer',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilita RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ver perfis (necessário para o ranking de metas)
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING ( true );

-- Política: Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT 
WITH CHECK ( auth.uid() = id );

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING ( auth.uid() = id );

-- Trigger simples para criar entry em profiles quando auth.users for criado
-- (Nota: Em produção, isso geralmente é feito via Supabase Functions, 
-- mas aqui podemos simular inserindo manualmente na criação do usuário via app)
