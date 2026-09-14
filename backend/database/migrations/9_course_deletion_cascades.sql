BEGIN;

DO $$
DECLARE
  course_foreign_key RECORD;
BEGIN
  FOR course_foreign_key IN
    SELECT conrelid::regclass AS table_name, conname
    FROM pg_constraint
    WHERE contype = 'f'
      AND confrelid = 'cursos'::regclass
      AND (
        (
          conrelid = 'aulas'::regclass
          AND conkey = ARRAY[
            (
              SELECT attnum
              FROM pg_attribute
              WHERE attrelid = 'aulas'::regclass
                AND attname = 'id_curso'
            )
          ]::smallint[]
        )
        OR (
          conrelid = 'trilha_curso'::regclass
          AND conkey = ARRAY[
            (
              SELECT attnum
              FROM pg_attribute
              WHERE attrelid = 'trilha_curso'::regclass
                AND attname = 'id_curso'
            )
          ]::smallint[]
        )
      )
  LOOP
    EXECUTE format(
      'ALTER TABLE %s DROP CONSTRAINT %I',
      course_foreign_key.table_name,
      course_foreign_key.conname
    );
  END LOOP;
END $$;

ALTER TABLE aulas
  ADD CONSTRAINT aulas_id_curso_fkey
  FOREIGN KEY (id_curso) REFERENCES cursos(id) ON DELETE CASCADE;

ALTER TABLE trilha_curso
  ADD CONSTRAINT trilha_curso_id_curso_fkey
  FOREIGN KEY (id_curso) REFERENCES cursos(id) ON DELETE CASCADE;

COMMIT;
