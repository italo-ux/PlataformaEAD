-- Migração aditiva; não altera usuários, senhas ou códigos existentes.
BEGIN;

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_code VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMP;

COMMIT;
