-- =============================================
-- INSERIR FAMÍLIAS - Execute no SQL Editor do Supabase
-- =============================================

INSERT INTO categories (name, slug) VALUES
('CREMEIRAS', 'cremeiras'),
('SOPEIRAS', 'sopeiras'),
('COPOS', 'copos'),
('TRAVESSAS', 'travessas'),
('RAMEQUINS', 'ramequins'),
('SALADEIRAS', 'saladeiras'),
('CLOCHES', 'cloches'),
('BANDEJAS', 'bandejas'),
('TACAS', 'tacas'),
('TAMPAS PVC (CAIXA)', 'tampas-pvc-caixa'),
('UTENSILIOS DOMESTICOS', 'utensilios-domesticos'),
('XICARAS', 'xicaras'),
('PRATOS', 'pratos'),
('REVENDA', 'revenda'),
('BOWLS', 'bowls'),
('TAMPAS', 'tampas'),
('BARCAS', 'barcas'),
('UTENSILIOS DE SILICONE', 'utensilios-de-silicone'),
('GALHETEIROS', 'galheteiros'),
('KITS EXCLUSIVOS', 'kits-exclusivos'),
('BOLEIRAS', 'boleiras'),
('JARRAS', 'jarras'),
('PORTA SACHES', 'porta-saches'),
('EMBALAGENS', 'embalagens'),
('POTES', 'potes'),
('ACESSORIOS WOODENGLOW', 'acessorios-woodenglow'),
('ESPATULAS', 'espatulas'),
('CUBAS', 'cubas'),
('MOLHEIRAS', 'molheiras')
ON CONFLICT (slug) DO NOTHING;
