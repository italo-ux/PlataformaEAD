-- Permite identificar cursos descartáveis que concluem a jornada na matrícula.
BEGIN;

ALTER TABLE cursos
  ADD COLUMN IF NOT EXISTS ambiente_teste BOOLEAN NOT NULL DEFAULT FALSE;

COMMIT;
