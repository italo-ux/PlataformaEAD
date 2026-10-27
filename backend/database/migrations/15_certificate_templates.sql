-- Modelos persistentes e snapshots imutáveis de certificados.
BEGIN;

CREATE TABLE IF NOT EXISTS modelos_certificado (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_reference VARCHAR(100) UNIQUE,
  name VARCHAR(120) NOT NULL,
  eyebrow VARCHAR(180) NOT NULL,
  title VARCHAR(180) NOT NULL,
  body VARCHAR(1000) NOT NULL,
  signature VARCHAR(180) NOT NULL,
  primary_color CHAR(7) NOT NULL,
  accent_color CHAR(7) NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "CHK_modelo_certificado_primary_color"
    CHECK (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  CONSTRAINT "CHK_modelo_certificado_accent_color"
    CHECK (accent_color ~ '^#[0-9A-Fa-f]{6}$')
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_modelo_certificado_padrao
  ON modelos_certificado (is_default)
  WHERE is_default = TRUE;

CREATE TABLE IF NOT EXISTS modelo_certificado_imagens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_modelo UUID NOT NULL,
  kind VARCHAR(20) NOT NULL,
  name VARCHAR(255) NOT NULL,
  png_data BYTEA NOT NULL,
  identification VARCHAR(150),
  ordem INTEGER NOT NULL,
  CONSTRAINT "FK_modelo_certificado_imagem"
    FOREIGN KEY (id_modelo) REFERENCES modelos_certificado(id) ON DELETE CASCADE,
  CONSTRAINT "UQ_modelo_certificado_imagem_ordem"
    UNIQUE (id_modelo, kind, ordem),
  CONSTRAINT "CHK_modelo_certificado_imagem_kind"
    CHECK (kind IN ('logo', 'signature')),
  CONSTRAINT "CHK_modelo_certificado_imagem_png"
    CHECK (
      octet_length(png_data) BETWEEN 1 AND 1048576
      AND substring(png_data FROM 1 FOR 8) = decode('89504e470d0a1a0a', 'hex')
    ),
  CONSTRAINT "CHK_modelo_certificado_assinatura_identificada"
    CHECK (
      (kind = 'logo' AND identification IS NULL)
      OR (kind = 'signature' AND length(btrim(identification)) > 0)
    )
);

ALTER TABLE certificados
  ADD COLUMN IF NOT EXISTS modelo_snapshot JSONB;

CREATE TABLE IF NOT EXISTS certificado_imagens_snapshot (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_certificado UUID NOT NULL,
  kind VARCHAR(20) NOT NULL,
  name VARCHAR(255) NOT NULL,
  png_data BYTEA NOT NULL,
  identification VARCHAR(150),
  ordem INTEGER NOT NULL,
  CONSTRAINT "FK_certificado_imagem_snapshot"
    FOREIGN KEY (id_certificado) REFERENCES certificados(id) ON DELETE CASCADE,
  CONSTRAINT "UQ_certificado_imagem_snapshot_ordem"
    UNIQUE (id_certificado, kind, ordem),
  CONSTRAINT "CHK_certificado_imagem_snapshot_kind"
    CHECK (kind IN ('logo', 'signature')),
  CONSTRAINT "CHK_certificado_imagem_snapshot_png"
    CHECK (
      octet_length(png_data) BETWEEN 1 AND 1048576
      AND substring(png_data FROM 1 FOR 8) = decode('89504e470d0a1a0a', 'hex')
    ),
  CONSTRAINT "CHK_certificado_snapshot_assinatura_identificada"
    CHECK (
      (kind = 'logo' AND identification IS NULL)
      OR (kind = 'signature' AND length(btrim(identification)) > 0)
    )
);

INSERT INTO modelos_certificado (
  id, client_reference, name, eyebrow, title, body, signature,
  primary_color, accent_color, is_default
) VALUES
  (
    'c0000000-0000-4000-8000-000000000001',
    'institucional-azul',
    'Institucional azul',
    'Plataforma EAD Inovação Barueri',
    'Certificado de conclusão',
    'Certificamos que {aluno} concluiu o curso {curso}.',
    'Inovação Barueri',
    '#2563EB',
    '#172033',
    TRUE
  ),
  (
    'c0000000-0000-4000-8000-000000000002',
    'conquista-verde',
    'Conquista',
    'Formação e desenvolvimento',
    'Certificado',
    'Concedido a {aluno} pela conclusão do curso {curso}.',
    'Coordenação pedagógica',
    '#059669',
    '#134E4A',
    FALSE
  ),
  (
    'c0000000-0000-4000-8000-000000000003',
    'essencial-violeta',
    'Essencial',
    'Conhecimento que transforma',
    'Certificado de participação',
    'Reconhecemos a participação de {aluno} no curso {curso}.',
    'Equipe de formação',
    '#7C3AED',
    '#312E81',
    FALSE
  )
ON CONFLICT DO NOTHING;

-- Bancos que já possuíam algum modelo, mas nenhum padrão, recebem um padrão
-- determinístico sem sobrescrever conteúdo editado.
UPDATE modelos_certificado
SET is_default = TRUE,
    updated_at = NOW()
WHERE id = (
  SELECT id
  FROM modelos_certificado
  ORDER BY created_at ASC, id ASC
  LIMIT 1
)
AND NOT EXISTS (
  SELECT 1 FROM modelos_certificado WHERE is_default = TRUE
);

COMMIT;
