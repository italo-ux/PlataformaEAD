# Tela de cursos mockada

## Rotas

- `/courses` lista os cursos locais.
- `/courses/:courseId` abre um curso pelo ID mockado.
- `/course` redireciona para `/courses/1` por compatibilidade.
- `/professor/cursos/novo` é reservada a professor/admin e redireciona a
  sessão atual de aluno.

## Fonte dos dados

- Cursos, aulas e trilhas: `src/data/courseData.ts`.
- Operações mockadas de cursos: `src/services/courseService.ts`.
- Login, cadastro e sessão: `src/services/userService.tsx`, usando a API real.

Os cursos criados no fluxo mockado desaparecem após recarregar a página. A API
de autenticação atual não fornece papéis; portanto todos os usuários reais são
tratados como alunos até que o backend implemente professor/admin.
