-- Identificação/duração cadastrada do vídeo e sessões temporizadas de reprodução.
BEGIN;

ALTER TABLE aulas
  ADD COLUMN IF NOT EXISTS youtube_video_id VARCHAR(20),
  ADD COLUMN IF NOT EXISTS duracao_segundos INTEGER,
  ADD COLUMN IF NOT EXISTS youtube_embeddable BOOLEAN,
  ADD COLUMN IF NOT EXISTS youtube_validado_em TIMESTAMPTZ;

ALTER TABLE progresso_aula
  ADD COLUMN IF NOT EXISTS tempo_reproducao_validado_segundos
    NUMERIC(12,2) NOT NULL DEFAULT 0;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'CHK_aulas_duracao_oficial'
      AND conrelid = 'aulas'::regclass
  ) THEN
    ALTER TABLE aulas
      ADD CONSTRAINT "CHK_aulas_duracao_oficial"
      CHECK (duracao_segundos IS NULL OR duracao_segundos > 0);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS sessao_reproducao (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_progresso_aula UUID NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ativa',
  sequencia INTEGER NOT NULL DEFAULT 0,
  ultima_posicao NUMERIC(10,2) NOT NULL,
  ultimo_estado VARCHAR(20) NOT NULL DEFAULT 'playing',
  ultimo_heartbeat_em TIMESTAMPTZ NOT NULL,
  expira_em TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "FK_sessao_reproducao_progresso"
    FOREIGN KEY (id_progresso_aula) REFERENCES progresso_aula(id) ON DELETE CASCADE,
  CONSTRAINT "CHK_sessao_reproducao_status"
    CHECK (status IN ('ativa', 'encerrada', 'expirada', 'revogada')),
  CONSTRAINT "CHK_sessao_reproducao_estado"
    CHECK (ultimo_estado IN ('playing', 'paused', 'ended')),
  CONSTRAINT "CHK_sessao_reproducao_sequencia" CHECK (sequencia >= 0),
  CONSTRAINT "CHK_sessao_reproducao_posicao" CHECK (ultima_posicao >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_sessao_reproducao_ativa
  ON sessao_reproducao(id_progresso_aula)
  WHERE status = 'ativa';
CREATE INDEX IF NOT EXISTS idx_sessao_reproducao_expiracao
  ON sessao_reproducao(expira_em)
  WHERE status = 'ativa';

-- Cursos antigos precisam receber ID e duração antes de voltar ao catálogo.
UPDATE cursos AS curso
SET status = 'rascunho', publicado_em = NULL, updated_at = NOW()
WHERE curso.status = 'publicado'
  AND (
    NOT EXISTS (SELECT 1 FROM aulas WHERE id_curso = curso.id)
    OR EXISTS (
      SELECT 1
      FROM aulas
      WHERE id_curso = curso.id
        AND (
          youtube_video_id IS NULL
          OR duracao_segundos IS NULL
        )
    )
  );

COMMIT;
