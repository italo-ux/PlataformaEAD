# Frontend da Plataforma EAD

Aplicação React, TypeScript e Vite para a Plataforma EAD.

## Execução

```bash
npm install
npm run dev
```

## Autenticação

Login e cadastro usam a API real:

- `POST http://localhost:3000/auth/login`
- `POST http://localhost:3000/auth/register`

O login espera `access_token` e `user` com `id` (UUID ou número) e `email`.
Os dados públicos da sessão ficam em `localStorage` na chave `ead.auth.user`;
o token fica na chave `token`. Senhas não são armazenadas no navegador.

No momento, a API não retorna papéis. O frontend trata todo usuário autenticado
como `aluno`, permitindo catálogo, trilhas e visualização dos cursos, mas
bloqueando a criação e gestão de cursos.

## Cursos mockados

Os cursos, aulas e trilhas são dados locais em `src/data/courseData.ts`.
`src/services/courseService.ts` simula as operações em memória, portanto cursos
e aulas adicionados desaparecem após atualizar a página. Detalhes adicionais
estão em `src/data/MOCKS.md` e `src/pages/COURSE_VIEW_README.md`.

## Verificação

```bash
npm run build
npm run lint
```
