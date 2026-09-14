-- Migração 6: endereço obtido automaticamente pelo CEP no cadastro público.
BEGIN;

ALTER TABLE endereco
  DROP COLUMN IF EXISTS numero;

ALTER TABLE endereco
  ADD COLUMN IF NOT EXISTS uf CHAR(2);

UPDATE endereco
SET cep = LEFT(REGEXP_REPLACE(cep, '\D', '', 'g'), 8);

ALTER TABLE endereco
  ALTER COLUMN cep TYPE VARCHAR(8);

ALTER TABLE endereco
  DROP CONSTRAINT IF EXISTS endereco_id_usuario_fkey;

ALTER TABLE endereco
  ADD CONSTRAINT endereco_id_usuario_fkey
  FOREIGN KEY (id_usuario) REFERENCES users(id) ON DELETE CASCADE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'UQ_endereco_id_usuario'
      AND conrelid = 'endereco'::regclass
  ) THEN
    ALTER TABLE endereco
      ADD CONSTRAINT "UQ_endereco_id_usuario" UNIQUE (id_usuario);
  END IF;
END
$$;

COMMIT;
