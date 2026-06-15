-- Migração 1: Schema Inicial
-- Data: 2026-05-05
-- Descrição: Cria as tabelas principais do sistema

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabela: Usuários
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    cpf VARCHAR(11) NOT NULL,
    celular VARCHAR(11),
    foto_perfil VARCHAR(255),
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
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    url_foto VARCHAR(255),
    carga_horaria INTEGER,
    categoria VARCHAR(255),
    nivel VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS aulas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_curso UUID NOT NULL,
    id_instrutor UUID NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    url_video VARCHAR(255),
    ordem INTEGER,
    duracao INTERVAL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (id_curso) REFERENCES cursos(id)
);

CREATE TABLE IF NOT EXISTS matricula (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_usuario UUID NOT NULL,
    id_curso UUID NOT NULL,
    progresso INTEGER DEFAULT 0,
    data_matricula TIMESTAMPTZ DEFAULT NOW(),
    conclusao BOOLEAN DEFAULT FALSE,
    pontuacao INTEGER DEFAULT 0,
    horas_estudadas INTEGER DEFAULT 0,
    FOREIGN KEY (id_usuario) REFERENCES users(id),
    FOREIGN KEY (id_curso) REFERENCES cursos(id)
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
    FOREIGN KEY (id_curso) REFERENCES cursos(id)
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
    id_usuario UUID NOT NULL,
    cep VARCHAR(10) NOT NULL,
    rua VARCHAR(255),
    numero VARCHAR(50),
    bairro VARCHAR(255),
    cidade VARCHAR(255),
    estado VARCHAR(100),
    complemento VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (id_usuario) REFERENCES users(id)
);
