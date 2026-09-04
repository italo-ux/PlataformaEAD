# Frontend da Plataforma EAD

Aplicação React, TypeScript e Vite.

## Execução

```bash
npm ci
npm run dev
```

Configure `VITE_API_URL` em `frontend/.env.local` quando necessário.
O padrão é `http://localhost:3000`; login, recuperação e cursos usam a mesma base.
Nunca use variáveis `VITE_*` para segredos: elas são públicas no bundle.

## Autenticação

- Cadastro: `POST /auth/register` com nome (`name`), e-mail, senha e CPF.
- Login: `POST /auth/login`, retornando `access_token` e usuário com papel persistido.
- Verificação: `POST /auth/verify` e `POST /auth/resend-verification`.
- Recuperação: `POST /auth/forgot-password` e `POST /auth/reset-password`.
- A sessão utiliza `token` e `ead.auth.user` no localStorage. Não há refresh token
  nem autenticação por credenciais simuladas.
- Após cadastro, a navegação leva a `/verify-email?email=...`, sem criar sessão.
- Após login: aluno → `/home`, professor → `/professor/cursos/novo`,
  admin → `/perfil`.

O cadastro público não aceita `role` ou permissões. CPF é enviado somente com
dígitos. O servidor valida os quatro campos permitidos e rejeita campos extras.
Tipo de perfil institucional e comprovação são demonstrativos: apenas tipo/status
são guardados localmente em `ead.profile.metadata`, sem envio de comprovação
ou concessão de privilégios.

## Cursos e permissões

Catálogo, player e gestão utilizam a API real `/cursos` e
`/cursos/:id/aulas`, com IDs UUID. Escritas enviam o JWT.
Professor gerencia somente seus próprios cursos; admin pode gerenciar todos.
A criação e a edição possuem proteção de rota no frontend e autorização no backend.

Trilhas, indicadores administrativos e partes do perfil continuam demonstrativos.
Editar/remover perfil nesta tela afeta somente o navegador, não a conta no servidor.
Para alterar a senha real, utilize o fluxo de recuperação.

## Validação sem banco ou SMTP reais

```bash
npm run build
npm run lint
npm test
```

Os testes usam DOM, armazenamento e respostas HTTP simulados para conferir
cadastro, verificação, recuperação, navegação por papel e uso da sessão.
