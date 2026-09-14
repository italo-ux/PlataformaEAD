-- Migração 1: Schema Inicial
-- Data: 2026-05-05
-- Descrição: Cria as tabelas principais do sistema

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('aluno', 'professor', 'admin');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE curso_status AS ENUM ('rascunho', 'publicado');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE certificado_status AS ENUM ('valido', 'revogado');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Tabela: Usuários
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_code VARCHAR,
    password_reset_code VARCHAR,
    password_reset_expires_at TIMESTAMP,
    role user_role NOT NULL DEFAULT 'aluno',
    cpf VARCHAR(11) NOT NULL,
    celular VARCHAR(11),
    foto_perfil VARCHAR(255),
    must_change_email BOOLEAN NOT NULL DEFAULT FALSE,
    must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
    data_nasc DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS programas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    banner VARCHAR(255),
    icone VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trilhas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    capa VARCHAR(255),
    nivel VARCHAR(100),
    id_programa UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (id_programa) REFERENCES programas(id)
);

CREATE TABLE IF NOT EXISTS cursos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_instrutor UUID NOT NULL,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    url_foto VARCHAR(255),
    carga_horaria INTEGER,
    categoria VARCHAR(255),
    nivel VARCHAR(100),
    status curso_status NOT NULL DEFAULT 'rascunho',
    publicado_em TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (id_instrutor) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS aulas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_curso UUID NOT NULL,
    id_instrutor UUID NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    url_video VARCHAR(500),
    ordem INTEGER,
    duracao INTERVAL,
    duracao_minutos INTEGER,
    youtube_video_id VARCHAR(20),
    duracao_segundos INTEGER,
    youtube_embeddable BOOLEAN,
    youtube_validado_em TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (id_curso) REFERENCES cursos(id) ON DELETE CASCADE,
    FOREIGN KEY (id_instrutor) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS matricula (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_usuario UUID NOT NULL,
    id_curso UUID NOT NULL,
    progresso INTEGER DEFAULT 0,
    data_matricula TIMESTAMPTZ DEFAULT NOW(),
    conclusao BOOLEAN DEFAULT FALSE,
    concluido_em TIMESTAMPTZ,
    ultima_aula_id UUID,
    segundos_estudados INTEGER NOT NULL DEFAULT 0,
    pontuacao INTEGER DEFAULT 0,
    horas_estudadas INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT "UQ_matricula_usuario_curso" UNIQUE (id_usuario, id_curso),
    CONSTRAINT "CHK_matricula_progresso" CHECK (progresso BETWEEN 0 AND 100),
    FOREIGN KEY (id_usuario) REFERENCES users(id),
    FOREIGN KEY (id_curso) REFERENCES cursos(id),
    FOREIGN KEY (ultima_aula_id) REFERENCES aulas(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS progresso_aula (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_matricula UUID NOT NULL,
    id_aula UUID NOT NULL,
    ordem_snapshot INTEGER NOT NULL,
    intervalos_assistidos JSONB NOT NULL DEFAULT '[]'::jsonb,
    duracao_segundos INTEGER,
    posicao_segundos INTEGER NOT NULL DEFAULT 0,
    percentual NUMERIC(5,2) NOT NULL DEFAULT 0,
    tempo_reproducao_validado_segundos NUMERIC(12,2) NOT NULL DEFAULT 0,
    concluida BOOLEAN NOT NULL DEFAULT FALSE,
    concluida_em TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT "UQ_progresso_aula_matricula_aula" UNIQUE (id_matricula, id_aula),
    CONSTRAINT "CHK_progresso_aula_percentual" CHECK (percentual BETWEEN 0 AND 100),
    FOREIGN KEY (id_matricula) REFERENCES matricula(id) ON DELETE CASCADE,
    FOREIGN KEY (id_aula) REFERENCES aulas(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS sessao_reproducao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_progresso_aula UUID NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ativa',
    sequencia INTEGER NOT NULL DEFAULT 0,
    ultima_posicao NUMERIC(10,2) NOT NULL,
    ultimo_estado VARCHAR(20) NOT NULL DEFAULT 'playing',
    ultimo_heartbeat_em TIMESTAMPTZ NOT NULL,
    expira_em TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (id_progresso_aula) REFERENCES progresso_aula(id) ON DELETE CASCADE,
    CHECK (status IN ('ativa', 'encerrada', 'expirada', 'revogada')),
    CHECK (ultimo_estado IN ('playing', 'paused', 'ended')),
    CHECK (sequencia >= 0),
    CHECK (ultima_posicao >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_sessao_reproducao_ativa
    ON sessao_reproducao(id_progresso_aula) WHERE status = 'ativa';

CREATE TABLE IF NOT EXISTS certificados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_matricula UUID NOT NULL UNIQUE,
    codigo VARCHAR(40) NOT NULL UNIQUE,
    nome_aluno VARCHAR(255) NOT NULL,
    nome_curso VARCHAR(255) NOT NULL,
    carga_horaria INTEGER NOT NULL,
    concluido_em TIMESTAMPTZ NOT NULL,
    status certificado_status NOT NULL DEFAULT 'valido',
    emitido_em TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (id_matricula) REFERENCES matricula(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS usuario_curso (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_usuario UUID NOT NULL,
    id_curso UUID NOT NULL,
    concluido BOOLEAN DEFAULT FALSE,
    data_conclusao TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (id_usuario) REFERENCES users(id),
    FOREIGN KEY (id_curso) REFERENCES cursos(id)
);

CREATE TABLE IF NOT EXISTS usuario_trilha (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_usuario UUID NOT NULL,
    id_trilha UUID NOT NULL,
    progresso INTEGER DEFAULT 0,
    data_inicio TIMESTAMPTZ DEFAULT NOW(),
    concluida BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (id_usuario) REFERENCES users(id),
    FOREIGN KEY (id_trilha) REFERENCES trilhas(id)
);

CREATE TABLE IF NOT EXISTS trilha_curso (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_trilha UUID NOT NULL,
    id_curso UUID NOT NULL,
    ordem INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (id_trilha) REFERENCES trilhas(id),
    FOREIGN KEY (id_curso) REFERENCES cursos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS conquistas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    icone VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usuario_conquista (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_usuario UUID NOT NULL,
    id_conquista UUID NOT NULL,
    data_conquista TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (id_usuario) REFERENCES users(id),
    FOREIGN KEY (id_conquista) REFERENCES conquistas(id)
);

CREATE TABLE IF NOT EXISTS avaliacao_curso (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_usuario UUID NOT NULL,
    id_curso UUID NOT NULL,
    nota INTEGER CHECK (nota >= 1 AND nota <= 5),
    comentario TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (id_usuario) REFERENCES users(id),
    FOREIGN KEY (id_curso) REFERENCES cursos(id)
);

CREATE TABLE IF NOT EXISTS endereco (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_usuario UUID NOT NULL UNIQUE,
    cep VARCHAR(8) NOT NULL,
    rua VARCHAR(255),
    bairro VARCHAR(255),
    cidade VARCHAR(255),
    uf CHAR(2),
    estado VARCHAR(100),
    complemento VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (id_usuario) REFERENCES users(id) ON DELETE CASCADE
);
