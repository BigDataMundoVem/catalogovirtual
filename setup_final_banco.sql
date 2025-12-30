CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'viewer',
  avatar_url TEXT,
  is_sales_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_sales_active') THEN
    ALTER TABLE public.profiles ADD COLUMN is_sales_active BOOLEAN DEFAULT TRUE;
  END IF;
END $$;

ALTER TABLE public.performance_logs DROP CONSTRAINT IF EXISTS unique_user_date;
ALTER TABLE public.performance_logs ADD CONSTRAINT unique_user_date UNIQUE (user_id, entry_date);

INSERT INTO public.profiles (id, email, full_name, role, is_sales_active)
SELECT 
  id, 
  email, 
  split_part(email, '@', 1) as full_name,
  'viewer' as role,
  TRUE as is_sales_active
FROM auth.users
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
