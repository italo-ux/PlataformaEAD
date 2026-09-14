-- Jornada persistente do aluno: publicação, matrícula, progresso e certificado.
-- Migração aditiva. Não remove nem corrige dados automaticamente.
BEGIN;

DO $$ BEGIN
  CREATE TYPE curso_status AS ENUM ('rascunho', 'publicado');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE certificado_status AS ENUM ('valido', 'revogado');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE cursos
  ADD COLUMN IF NOT EXISTS status curso_status NOT NULL DEFAULT 'rascunho',
  ADD COLUMN IF NOT EXISTS publicado_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE matricula
  ADD COLUMN IF NOT EXISTS concluido_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ultima_aula_id UUID,
  ADD COLUMN IF NOT EXISTS segundos_estudados INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$
DECLARE
  duplicate_enrollments BIGINT;
BEGIN
  SELECT COUNT(*) INTO duplicate_enrollments
  FROM (
    SELECT id_usuario, id_curso
    FROM matricula
    GROUP BY id_usuario, id_curso
    HAVING COUNT(*) > 1
  ) duplicates;

  IF duplicate_enrollments > 0 THEN
    RAISE EXCEPTION
      'Migração abortada: existem % pares duplicados em matricula. Resolva-os explicitamente antes de continuar.',
      duplicate_enrollments;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'UQ_matricula_usuario_curso'
      AND conrelid = 'matricula'::regclass
  ) THEN
    ALTER TABLE matricula
      ADD CONSTRAINT "UQ_matricula_usuario_curso"
      UNIQUE (id_usuario, id_curso);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'CHK_matricula_progresso'
      AND conrelid = 'matricula'::regclass
  ) THEN
    ALTER TABLE matricula
      ADD CONSTRAINT "CHK_matricula_progresso"
      CHECK (progresso BETWEEN 0 AND 100);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'FK_matricula_ultima_aula'
      AND conrelid = 'matricula'::regclass
  ) THEN
    ALTER TABLE matricula
      ADD CONSTRAINT "FK_matricula_ultima_aula"
      FOREIGN KEY (ultima_aula_id) REFERENCES aulas(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS progresso_aula (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_matricula UUID NOT NULL,
  id_aula UUID NOT NULL,
  ordem_snapshot INTEGER NOT NULL,
  intervalos_assistidos JSONB NOT NULL DEFAULT '[]'::jsonb,
  duracao_segundos INTEGER,
  posicao_segundos INTEGER NOT NULL DEFAULT 0,
  percentual NUMERIC(5,2) NOT NULL DEFAULT 0,
  concluida BOOLEAN NOT NULL DEFAULT FALSE,
  concluida_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "UQ_progresso_aula_matricula_aula" UNIQUE (id_matricula, id_aula),
  CONSTRAINT "CHK_progresso_aula_percentual" CHECK (percentual BETWEEN 0 AND 100),
  CONSTRAINT "FK_progresso_aula_matricula"
    FOREIGN KEY (id_matricula) REFERENCES matricula(id) ON DELETE CASCADE,
  CONSTRAINT "FK_progresso_aula_aula"
    FOREIGN KEY (id_aula) REFERENCES aulas(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS certificados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_matricula UUID NOT NULL UNIQUE,
  codigo VARCHAR(40) NOT NULL UNIQUE,
  nome_aluno VARCHAR(255) NOT NULL,
  nome_curso VARCHAR(255) NOT NULL,
  carga_horaria INTEGER NOT NULL,
  concluido_em TIMESTAMPTZ NOT NULL,
  status certificado_status NOT NULL DEFAULT 'valido',
  emitido_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "FK_certificados_matricula"
    FOREIGN KEY (id_matricula) REFERENCES matricula(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_matricula_usuario ON matricula(id_usuario);
CREATE INDEX IF NOT EXISTS idx_matricula_curso ON matricula(id_curso);
CREATE INDEX IF NOT EXISTS idx_progresso_aula_matricula
  ON progresso_aula(id_matricula, ordem_snapshot);
CREATE INDEX IF NOT EXISTS idx_certificados_codigo ON certificados(codigo);

COMMIT;
