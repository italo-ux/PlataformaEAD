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
psql -v ON_ERROR_STOP=1 -U seu_usuario -d plataforma_ead -f database/migrations/1_initial_schema.sql
psql -v ON_ERROR_STOP=1 -U seu_usuario -d plataforma_ead -f database/migrations/2_course_lessons.sql
psql -v ON_ERROR_STOP=1 -U seu_usuario -d plataforma_ead -f database/migrations/3_roles_and_course_ownership.sql
psql -v ON_ERROR_STOP=1 -U seu_usuario -d plataforma_ead -f database/migrations/4_password_recovery.sql
```

> Use somente os scripts desta versão: a migração 3 histórica era destrutiva.
> A versão integrada é transacional e não remove dados. Ela aborta se cursos
> ou aulas tiverem proprietários ausentes/inválidos. Faça backup antes de qualquer
> aplicação e forneça um mapeamento explícito de cada registro para um usuário
> existente; o script não inventa proprietários. A migração 4 adiciona os campos
> de recuperação de senha. Scripts já aplicados não precisam ser repetidos;
> bancos que já têm papéis e propriedade devem aplicar somente a migração 4.
> Nenhuma migração foi executada no banco existente durante esta integração.

Para diagnosticar cursos legados, depois de confirmar que a coluna
`id_instrutor` existe, consulte registros com proprietário nulo ou ausente:

```sql
SELECT c.id, c.id_instrutor
FROM cursos c LEFT JOIN users u ON u.id = c.id_instrutor
WHERE c.id_instrutor IS NULL OR u.id IS NULL;
```

Se a coluna não existir, todos os cursos precisam de mapeamento antes de impor
a restrição. Faça a inclusão da coluna e o preenchimento aprovado em uma
transação de manutenção separada. A mesma verificação vale para `aulas`.
Não remova registros nem atribua todos a um administrador para contornar o erro.

### 4️⃣ Popular com Dados de Teste

```bash
psql -U seu_usuario -d plataforma_ead -f database/seeds/seed.sql
```

## 📊 Tabelas Principais

### `users`

- Armazena contas de alunos, professores e administradores.
- Campos principais: `id`, `name`, `email`, `password_hash`, `cpf`,
  `is_verified`, `verification_code`, `password_reset_code`,
  `password_reset_expires_at` e `role`.

### `cursos`

- Cursos criados por instrutores
- Campos: `id`, `nome`, `descricao`, `id_instrutor`, `categoria`, `nivel`, etc.

### `aulas`

- Aulas que compõem os cursos
- Campos: `id`, `id_curso`, `id_instrutor`, `titulo`, `url_video`,
  `duracao_minutos`, `ordem`, etc.

### `matricula`

- Controla quais alunos estão inscritos em quais cursos
- Campos: `id_usuario`, `id_curso`, `progresso`, `conclusao`, etc.

### Relações de conteúdo

- `usuario_curso`: vínculo e conclusão de cursos por usuário.
- `usuario_trilha`: progresso e conclusão de trilhas por usuário.
- `trilha_curso`: ordenação dos cursos dentro de uma trilha.

## 🔐 Papéis de usuário

O cadastro público sempre cria usuários com papel `aluno`. Depois de confirmar
o e-mail do usuário, um operador autorizado pode promover a conta diretamente
no banco:

```sql
UPDATE users SET role = 'professor' WHERE email = 'professor@example.com';
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

Substitua os endereços de exemplo. Nunca aceite `role` no cadastro público e
nunca mantenha senhas ou credenciais reais em seeds versionados.

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
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=plataforma_ead
DB_SYNCHRONIZE=false
```

Mantenha `DB_SYNCHRONIZE=false` quando usar as migrations. O modo automático
só deve ser habilitado explicitamente em um banco de desenvolvimento
descartável.

## 📞 Suporte

Para dúvidas sobre as tabelas ou estrutura, consulte o arquivo `schema.sql` ou execute:

```bash
psql -U seu_usuario -d plataforma_ead -c "\d"
```

Para listar todas as tabelas:

```bash
psql -U seu_usuario -d plataforma_ead -c "SELECT tablename FROM pg_tables WHERE schemaname='public';"
```
