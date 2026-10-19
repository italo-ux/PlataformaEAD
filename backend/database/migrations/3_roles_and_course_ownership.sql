-- Preserve todos os dados existentes. Execute com ON_ERROR_STOP e backup.
-- Se houver registros sem proprietário válido, esta transação será abortada.
-- O operador deve fornecer um mapeamento explícito antes de tentar novamente.
BEGIN;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('aluno', 'professor', 'admin');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS role user_role NOT NULL DEFAULT 'aluno';

ALTER TABLE cursos ADD COLUMN IF NOT EXISTS id_instrutor UUID;

DO $$
DECLARE
    invalid_courses BIGINT;
    invalid_lessons BIGINT;
BEGIN
    SELECT count(*) INTO invalid_courses
    FROM cursos c LEFT JOIN users u ON u.id = c.id_instrutor
    WHERE c.id_instrutor IS NULL OR u.id IS NULL;

    SELECT count(*) INTO invalid_lessons
    FROM aulas a LEFT JOIN users u ON u.id = a.id_instrutor
    WHERE a.id_instrutor IS NULL OR u.id IS NULL;

    IF invalid_courses > 0 OR invalid_lessons > 0 THEN
        RAISE EXCEPTION
            'Migração abortada: % cursos e % aulas sem proprietário válido. Forneça mapeamento explícito para users(id); nenhum dado será removido.',
            invalid_courses, invalid_lessons;
    END IF;
END $$;

ALTER TABLE cursos ALTER COLUMN id_instrutor SET NOT NULL;
ALTER TABLE aulas ALTER COLUMN id_instrutor SET NOT NULL;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'cursos'::regclass AND contype = 'f'
          AND confrelid = 'users'::regclass
          AND conkey = ARRAY[
              (SELECT attnum FROM pg_attribute
               WHERE attrelid = 'cursos'::regclass AND attname = 'id_instrutor')
          ]::smallint[]
    ) THEN
        ALTER TABLE cursos ADD CONSTRAINT fk_cursos_instrutor
            FOREIGN KEY (id_instrutor) REFERENCES users(id) ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'aulas'::regclass AND contype = 'f'
          AND confrelid = 'users'::regclass
          AND conkey = ARRAY[
              (SELECT attnum FROM pg_attribute
               WHERE attrelid = 'aulas'::regclass AND attname = 'id_instrutor')
          ]::smallint[]
    ) THEN
        ALTER TABLE aulas ADD CONSTRAINT fk_aulas_instrutor
            FOREIGN KEY (id_instrutor) REFERENCES users(id) ON DELETE RESTRICT;
    END IF;
END $$;

COMMIT;
