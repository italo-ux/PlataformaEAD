# 🗄️ Database - PlataformaEAD

Documentação do banco de dados PostgreSQL para o projeto PlataformaEAD.

## 📁 Estrutura

```
database/
├── migrations/      # Scripts de versionamento (executar em ordem)
├── seeds/          # Dados iniciais para testes
├── schema.sql      # Esquema completo (backup/referência)
└── README.md       # Este arquivo
```

## 🚀 Como Usar

### 1️⃣ Criar o Banco de Dados

```bash
createdb plataforma_ead
```

### 2️⃣ Executar o Schema Completo (Primeira Vez)

```bash
psql -U seu_usuario -d plataforma_ead -f database/schema.sql
```

### 3️⃣ Ou Executar Migrations em Ordem

```bash
psql -U seu_usuario -d plataforma_ead -f database/migrations/1_initial_schema.sql
```

### 4️⃣ Popular com Dados de Teste

```bash
psql -U seu_usuario -d plataforma_ead -f database/seeds/seed.sql
```

## 📊 Tabelas Principais

### `usuarios`

- Armazena informações de usuários (alunos, instrutores, admins)
- Campos: `id`, `email`, `senha`, `nome`, `sobrenome`, `tipo_usuario`, etc.

### `cursos`

- Cursos criados por instrutores
- Campos: `id`, `titulo`, `descricao`, `instrutor_id`, `categoria`, `nivel`, etc.

### `aulas`

- Aulas que compõem os cursos
- Campos: `id`, `curso_id`, `titulo`, `video_url`, `duracao_minutos`, etc.

### `inscricoes`

- Controla quais alunos estão inscritos em quais cursos
- Campos: `usuario_id`, `curso_id`, `progresso_percentual`, etc.

### `progresso_aulas`

- Rastreia o progresso de cada aluno em cada aula
- Campos: `usuario_id`, `aula_id`, `concluida`, `tempo_assistido_minutos`, etc.

## 🔐 Credenciais Padrão de Teste

Após rodar o seed.sql, use estas credenciais:

| Email                    | Senha         | Tipo      |
| ------------------------ | ------------- | --------- |
| admin@plataforma.com     | admin123      | Admin     |
| instrutor@plataforma.com | instructor123 | Instrutor |
| aluno@plataforma.com     | aluno123      | Aluno     |
| aluno2@plataforma.com    | aluno123      | Aluno     |

## 🔄 Fluxo de Desenvolvimento

1. **Nova Feature com BD:** Criar arquivo `N_descricao.sql` em `migrations/`
2. **Testar Localmente:** Executar o novo arquivo SQL
3. **Commitar:** Adicionar ao versionamento
4. **Em Produção:** Rodar migrations em ordem

## 📝 Nomear Novas Migrations

Use o padrão:

```
N_descricao_clara.sql
```

Exemplos:

- `2_add_tabela_certificados.sql`
- `3_adicionar_coluna_foto_usuarios.sql`
- `4_criar_indice_performance.sql`

## 🛠️ Conectar com NestJS (TypeORM)

```bash
npm install @nestjs/typeorm typeorm pg
```

Criar `.env`:

```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=seu_usuario
DB_PASSWORD=sua_senha
DB_DATABASE=plataforma_ead
```

## 📞 Suporte

Para dúvidas sobre as tabelas ou estrutura, consulte o arquivo `schema.sql` ou execute:

```bash
psql -U seu_usuario -d plataforma_ead -c "\d"
```

Para listar todas as tabelas:

```bash
psql -U seu_usuario -d plataforma_ead -c "SELECT tablename FROM pg_tables WHERE schemaname='public';"
```
