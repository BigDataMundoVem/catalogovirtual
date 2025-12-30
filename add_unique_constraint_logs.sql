-- Garante que um usuário só tenha 1 linha de log por data
-- Se a constraint já existir, o comando pode falhar, então idealmente verificamos antes ou usamos um bloco DO
-- Mas para simplicidade e execução direta no editor:

ALTER TABLE performance_logs 
ADD CONSTRAINT unique_user_date UNIQUE (user_id, entry_date);