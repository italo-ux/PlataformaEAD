BEGIN;

UPDATE questionarios
SET nota_minima = 70,
    max_tentativas = 3;

ALTER TABLE questionarios
  ALTER COLUMN nota_minima SET DEFAULT 70,
  ALTER COLUMN max_tentativas SET DEFAULT 3,
  ALTER COLUMN max_tentativas SET NOT NULL;

ALTER TABLE questionarios
  DROP CONSTRAINT IF EXISTS "CHK_questionario_nota_minima",
  DROP CONSTRAINT IF EXISTS "CHK_questionario_max_tentativas";

ALTER TABLE questionarios
  ADD CONSTRAINT "CHK_questionario_nota_minima" CHECK (nota_minima = 70),
  ADD CONSTRAINT "CHK_questionario_max_tentativas" CHECK (max_tentativas = 3);

COMMIT;
