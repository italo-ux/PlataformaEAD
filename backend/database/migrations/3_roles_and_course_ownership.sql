-- Migração destrutiva autorizada: remove cursos e todos os dados dependentes.
-- Preserve um backup do banco antes da execução.

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('aluno', 'professor', 'admin');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS role user_role NOT NULL DEFAULT 'aluno';

TRUNCATE TABLE cursos CASCADE;

ALTER TABLE cursos ADD COLUMN IF NOT EXISTS id_instrutor UUID;
ALTER TABLE cursos ALTER COLUMN id_instrutor SET NOT NULL;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_cursos_instrutor'
    ) THEN
        ALTER TABLE cursos
            ADD CONSTRAINT fk_cursos_instrutor
            FOREIGN KEY (id_instrutor) REFERENCES users(id) ON DELETE RESTRICT;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_aulas_instrutor'
    ) THEN
        ALTER TABLE aulas
            ADD CONSTRAINT fk_aulas_instrutor
            FOREIGN KEY (id_instrutor) REFERENCES users(id) ON DELETE RESTRICT;
    END IF;
END $$;
