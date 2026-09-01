-- Adiciona os campos usados pelo conteúdo em vídeo sem remover dados legados.
ALTER TABLE aulas ADD COLUMN IF NOT EXISTS duracao_minutos INTEGER;
ALTER TABLE aulas ALTER COLUMN url_video TYPE VARCHAR(500);
