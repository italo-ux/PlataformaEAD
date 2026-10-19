-- Campos de perfil e marcadores de troca obrigatória do administrador inicial.
BEGIN;

ALTER TABLE users ADD COLUMN IF NOT EXISTS celular VARCHAR(11);
ALTER TABLE users ADD COLUMN IF NOT EXISTS foto_perfil VARCHAR(255);
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS must_change_email BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;

COMMIT;
