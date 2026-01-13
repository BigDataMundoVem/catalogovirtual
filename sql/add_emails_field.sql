-- =====================================================
-- Script para adicionar campo de Emails nas tabelas existentes
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- Adicionar campo target_emails na tabela monthly_goals (se não existir)
ALTER TABLE public.monthly_goals 
ADD COLUMN IF NOT EXISTS target_emails INTEGER DEFAULT 0;

-- Adicionar campo emails_done na tabela performance_logs (se não existir)
ALTER TABLE public.performance_logs 
ADD COLUMN IF NOT EXISTS emails_done INTEGER DEFAULT 0;

-- Verificação
SELECT 'Campos de emails adicionados com sucesso!' as status;

