# Integração da versão local com a main — 2026-09-02

## Histórico preservado

- Backup: `codex/backup-local-2026-09-02`, commit
  `3c33d1fd537daa4afc39e94a7a507de8f7c04446`.
- Base remota inicial: `86bb29bdcdcde67085b211163d5825a5de271e15`.
- Integração: `codex/integrar-local-main`, reunindo os dois históricos.
- A main local e o banco existente não foram alterados. O PR #18 não foi
  incorporado: sua listagem administrativa foi reimplementada com segurança
  nesta branch e o PR antigo deve ser fechado como substituído.

## O que foi combinado

Da versão local: APIs reais de cursos/aulas, UUIDs, propriedade dos cursos,
papéis no banco, JWT com consulta ao usuário atual, DTOs e configuração por ambiente.
Da main remota: Zod, verificação/reenvio/recuperação, redirecionamento por papel,
proteção de rotas e telas de perfil.

Os contratos de autenticação foram unidos, sem refresh tokens. Cadastro público
aceita apenas `name`, `email`, `password`, `cpf`; login retorna
`{ access_token, user: { id, name, email, role } }`.
Os códigos de recuperação têm seis dígitos, prazo de quinze minutos e são
consumidos por atualização condicional atômica. Os testes verificam expiração,
reutilização e duas tentativas concorrentes com o mesmo código.

Administradores autenticados podem consultar `GET /usuarios?page=1&limit=50`.
O limite aceito é de 1 a 100 e a resposta paginada contém somente `id`, `name`,
`email`, `role` e `is_verified`; CPF, hashes e códigos internos nunca são
serializados. Alunos e professores recebem `403` e requisições sem JWT recebem
`401`.

Curso/aula continua no contrato português `/cursos` e UUIDs. O editor permite
criar, editar, ordenar e excluir aulas depois que o curso recebe seu UUID. A
camada duplicada sem consumidores para `/courses` foi removida, junto com React
Query sem uso.
Axios e fetch compartilham `VITE_API_URL`; o bearer token usa a chave `token`.
Cookies de autenticação não são utilizados.

Edição de perfil, comprovação institucional e indicadores administrativos
continuam locais/simulados, com avisos explícitos. Remover perfil limpa dados do
navegador e encerra a sessão; não exclui a conta do servidor.

## Banco e configuração: aplicação posterior, não executada aqui

Nenhum SQL foi executado no banco existente. Antes de aplicar qualquer script,
faça backup e confirme o estado do schema.

- Instalação nova: schema atualizado ou migrações documentadas na ordem.
- Migração 3 revisada: transação sem exclusões; preserva proprietários válidos
  e aborta com diagnóstico quando falta um mapeamento de cursos/aulas para usuários.
- Não use a migração 3 de versões antigas: ela era destrutiva.
- Migração 4: adiciona somente os campos de recuperação de senha.
- Bancos já atualizados para papéis/propriedade precisam apenas da migração 4.
- Manter `DB_SYNCHRONIZE=false`; não habilitar sincronização automática para
  contornar uma migração pendente.
- Configurar JWT, banco e SMTP em `backend/.env`. Em produção, SMTP é obrigatório.
  Em desenvolvimento sem SMTP, os códigos são registrados somente nos logs locais.
- Configurar apenas `VITE_API_URL` em `frontend/.env.local`.

Veja `backend/database/README.md` para os comandos e diagnóstico de dados legados.

## Validação e limites

Comandos de aceite: `npm ci`, build e lint nos dois projetos; `npm test`
no frontend/backend e `npm run test:e2e -- --runInBand` no backend.

Cobertura: 19 testes de interface, 31 testes unitários de backend e 13 testes HTTP
com repositórios em memória. Nenhum usa o banco existente ou envia e-mails reais.
Inclui login por papel, token ausente/inválido/expirado, recarga de permissões do
usuário, isolamento de propriedade, gestão de aulas, listagem administrativa,
verificação/reenvio e recuperação de senha.

As instalações reportam avisos de auditoria de dependências (10 no frontend e
12 no backend), e o build frontend mantém aviso de bundle grande. Não foram
executadas atualizações automáticas de segurança fora do escopo.

O backup preserva o histórico original. Rotação de credenciais e limpeza de
segredos históricos continuam pendências separadas; esta integração remove
segredos da árvore atual, mas não reescreve histórico.

O merge final, deploy, aplicação de migrações e teste com banco/SMTP reais
dependem de aprovação e execução posteriores.
