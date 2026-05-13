-- PlataformaEAD - Schema PostgreSQL
-- Definição completa do banco de dados

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabela: Usuários
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  sobrenome VARCHAR(255),
  foto_perfil VARCHAR(500),
  descricao_perfil TEXT,
  tipo_usuario VARCHAR(50) DEFAULT 'aluno', -- 'aluno', 'instructor', 'admin'
  ativo BOOLEAN DEFAULT true,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_ultimo_acesso TIMESTAMP
);

-- Tabela: Cursos
CREATE TABLE IF NOT EXISTS cursos (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  instrutor_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  categoria VARCHAR(100),
  nivel VARCHAR(50), -- 'iniciante', 'intermediário', 'avançado'
  duracao_horas INTEGER,
  preco DECIMAL(10, 2),
  imagem_capa VARCHAR(500),
  ativo BOOLEAN DEFAULT true,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: Aulas
CREATE TABLE IF NOT EXISTS aulas (
  id SERIAL PRIMARY KEY,
  curso_id INTEGER NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  conteudo TEXT,
  video_url VARCHAR(500),
  duracao_minutos INTEGER,
  ordem_aula INTEGER,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: Inscrições
CREATE TABLE IF NOT EXISTS inscricoes (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  curso_id INTEGER NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  data_inscricao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_conclusao TIMESTAMP,
  progresso_percentual INTEGER DEFAULT 0,
  UNIQUE(usuario_id, curso_id)
);

-- Tabela: Progresso de Aulas
CREATE TABLE IF NOT EXISTS progresso_aulas (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  aula_id INTEGER NOT NULL REFERENCES aulas(id) ON DELETE CASCADE,
  concluida BOOLEAN DEFAULT false,
  data_conclusao TIMESTAMP,
  data_primeira_visualizacao TIMESTAMP,
  tempo_assistido_minutos INTEGER DEFAULT 0,
  UNIQUE(usuario_id, aula_id)
);

-- Índices para melhor performance
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_cursos_instrutor ON cursos(instrutor_id);
CREATE INDEX idx_aulas_curso ON aulas(curso_id);
CREATE INDEX idx_inscricoes_usuario ON inscricoes(usuario_id);
CREATE INDEX idx_inscricoes_curso ON inscricoes(curso_id);
CREATE INDEX idx_progresso_usuario ON progresso_aulas(usuario_id);
CREATE INDEX idx_progresso_aula ON progresso_aulas(aula_id);
