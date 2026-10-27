BEGIN;

CREATE TABLE IF NOT EXISTS aula_pdfs (
  id_aula UUID PRIMARY KEY REFERENCES aulas(id) ON DELETE CASCADE,
  nome_arquivo VARCHAR(255) NOT NULL,
  tamanho_bytes INTEGER NOT NULL CHECK (tamanho_bytes > 0 AND tamanho_bytes <= 6291456),
  conteudo BYTEA NOT NULL CHECK (octet_length(conteudo) = tamanho_bytes)
);

COMMIT;
