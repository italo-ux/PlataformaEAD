-- Seed: Dados Iniciais para Testes
-- Execute este arquivo depois de rodar as migrations

-- Inserir Usuários de Teste
INSERT INTO usuarios (email, senha, nome, sobrenome, tipo_usuario, ativo) VALUES
  ('admin@plataforma.com', 'admin123', 'Admin', 'Sistema', 'admin', true),
  ('instrutor@plataforma.com', 'instructor123', 'João', 'Silva', 'instructor', true),
  ('aluno@plataforma.com', 'aluno123', 'Maria', 'Santos', 'aluno', true),
  ('aluno2@plataforma.com', 'aluno123', 'Pedro', 'Costa', 'aluno', true)
ON CONFLICT (email) DO NOTHING;

-- Inserir Cursos
INSERT INTO cursos (titulo, descricao, instrutor_id, categoria, nivel, duracao_horas, preco, ativo) VALUES
  (
    'Introdução ao React',
    'Aprenda os fundamentos do React desde o zero',
    (SELECT id FROM usuarios WHERE email = 'instrutor@plataforma.com'),
    'Programação',
    'iniciante',
    30,
    199.90,
    true
  ),
  (
    'TypeScript Avançado',
    'Domine TypeScript em um nível profissional',
    (SELECT id FROM usuarios WHERE email = 'instrutor@plataforma.com'),
    'Programação',
    'avançado',
    40,
    249.90,
    true
  )
ON CONFLICT DO NOTHING;

-- Inserir Aulas
INSERT INTO aulas (curso_id, titulo, descricao, duracao_minutos, ordem_aula) VALUES
  (
    (SELECT id FROM cursos WHERE titulo = 'Introdução ao React'),
    'O que é React?',
    'Entender os conceitos básicos de React',
    15,
    1
  ),
  (
    (SELECT id FROM cursos WHERE titulo = 'Introdução ao React'),
    'Componentes Funcionais',
    'Aprender a criar componentes funcionais',
    25,
    2
  ),
  (
    (SELECT id FROM cursos WHERE titulo = 'Introdução ao React'),
    'Hooks - useState',
    'Entender o hook useState',
    30,
    3
  ),
  (
    (SELECT id FROM cursos WHERE titulo = 'TypeScript Avançado'),
    'Tipos Avançados',
    'Trabalhar com tipos complexos no TypeScript',
    45,
    1
  )
ON CONFLICT DO NOTHING;

-- Inserir Inscrições
INSERT INTO inscricoes (usuario_id, curso_id, progresso_percentual) VALUES
  (
    (SELECT id FROM usuarios WHERE email = 'aluno@plataforma.com'),
    (SELECT id FROM cursos WHERE titulo = 'Introdução ao React'),
    50
  ),
  (
    (SELECT id FROM usuarios WHERE email = 'aluno2@plataforma.com'),
    (SELECT id FROM cursos WHERE titulo = 'TypeScript Avançado'),
    0
  )
ON CONFLICT (usuario_id, curso_id) DO NOTHING;

COMMIT;
