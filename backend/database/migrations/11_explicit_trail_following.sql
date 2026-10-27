BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS uq_usuario_trilha_usuario_trilha
  ON usuario_trilha (id_usuario, id_trilha);

COMMIT;
