-- Agenda persistente para revalidar vídeos sem bloquear a leitura do catálogo.
BEGIN;

ALTER TABLE aulas
  ADD COLUMN IF NOT EXISTS youtube_proxima_validacao_em TIMESTAMPTZ;

-- Vídeos já publicados entram no ciclo respeitando, quando possível, a última
-- validação conhecida. Aulas em rascunho não são processadas pelo agendador.
UPDATE aulas AS aula
SET youtube_proxima_validacao_em = CASE
  WHEN aula.youtube_validado_em IS NULL THEN NOW()
  ELSE GREATEST(aula.youtube_validado_em + INTERVAL '15 minutes', NOW())
END
FROM cursos AS curso
WHERE aula.id_curso = curso.id
  AND curso.status = 'publicado'
  AND aula.tipo = 'video'
  AND aula.youtube_video_id IS NOT NULL
  AND aula.youtube_proxima_validacao_em IS NULL;

CREATE INDEX IF NOT EXISTS idx_aulas_youtube_proxima_validacao
  ON aulas (youtube_proxima_validacao_em, id)
  WHERE tipo = 'video'
    AND youtube_video_id IS NOT NULL
    AND youtube_proxima_validacao_em IS NOT NULL;

COMMIT;
