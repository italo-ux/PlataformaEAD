DO $$ BEGIN
  CREATE TYPE aula_tipo AS ENUM ('video', 'pdf', 'link', 'imagem', 'questionario');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE aulas
  ADD COLUMN IF NOT EXISTS tipo aula_tipo NOT NULL DEFAULT 'video';

ALTER TABLE aulas ALTER COLUMN url_video DROP NOT NULL;

CREATE TABLE IF NOT EXISTS questionarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_aula UUID NOT NULL UNIQUE,
  nota_minima NUMERIC(5,2) NOT NULL DEFAULT 60,
  max_tentativas INTEGER,
  pontos_base INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "CHK_questionario_nota_minima" CHECK (nota_minima BETWEEN 0 AND 100),
  CONSTRAINT "CHK_questionario_max_tentativas" CHECK (max_tentativas IS NULL OR max_tentativas > 0),
  CONSTRAINT "CHK_questionario_pontos_base" CHECK (pontos_base >= 0),
  FOREIGN KEY (id_aula) REFERENCES aulas(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS perguntas_questionario (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_questionario UUID NOT NULL,
  enunciado TEXT NOT NULL,
  ordem INTEGER NOT NULL,
  pontos INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT "UQ_pergunta_questionario_ordem" UNIQUE (id_questionario, ordem),
  CONSTRAINT "CHK_pergunta_pontos" CHECK (pontos > 0),
  FOREIGN KEY (id_questionario) REFERENCES questionarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS alternativas_questionario (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_pergunta UUID NOT NULL,
  texto TEXT NOT NULL,
  ordem INTEGER NOT NULL,
  correta BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT "UQ_alternativa_pergunta_ordem" UNIQUE (id_pergunta, ordem),
  FOREIGN KEY (id_pergunta) REFERENCES perguntas_questionario(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_alternativa_correta_por_pergunta
  ON alternativas_questionario(id_pergunta) WHERE correta = TRUE;

CREATE TABLE IF NOT EXISTS tentativas_questionario (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_questionario UUID NOT NULL,
  id_matricula UUID NOT NULL,
  numero INTEGER NOT NULL,
  acertos INTEGER NOT NULL,
  total_perguntas INTEGER NOT NULL,
  pontos_obtidos INTEGER NOT NULL DEFAULT 0,
  pontos_possiveis INTEGER NOT NULL DEFAULT 0,
  percentual NUMERIC(5,2) NOT NULL,
  aprovado BOOLEAN NOT NULL,
  concluida_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "UQ_tentativa_numero" UNIQUE (id_questionario, id_matricula, numero),
  CONSTRAINT "CHK_tentativa_percentual" CHECK (percentual BETWEEN 0 AND 100),
  FOREIGN KEY (id_questionario) REFERENCES questionarios(id) ON DELETE RESTRICT,
  FOREIGN KEY (id_matricula) REFERENCES matricula(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS respostas_questionario (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_tentativa UUID NOT NULL,
  id_pergunta UUID NOT NULL,
  id_alternativa UUID NOT NULL,
  correta BOOLEAN NOT NULL,
  pontos_obtidos INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "UQ_resposta_tentativa_pergunta" UNIQUE (id_tentativa, id_pergunta),
  FOREIGN KEY (id_tentativa) REFERENCES tentativas_questionario(id) ON DELETE CASCADE,
  FOREIGN KEY (id_pergunta) REFERENCES perguntas_questionario(id) ON DELETE RESTRICT,
  FOREIGN KEY (id_alternativa) REFERENCES alternativas_questionario(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_tentativa_questionario_matricula
  ON tentativas_questionario(id_matricula, id_questionario, numero DESC);
