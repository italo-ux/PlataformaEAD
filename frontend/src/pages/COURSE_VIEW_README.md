# Course View mockada

Esta tela esta funcionando somente com dados locais enquanto o backend real nao entra.

## Rotas atuais

- `/courses` abre a home/lista de cursos.
- `/courses/:courseId` abre o curso mockado pelo ID da rota.
- `/course` redireciona para `/courses/1` por compatibilidade.

## Dados usados

- Cursos e aulas: `src/data/courseData.ts`
- Servico mockado de cursos: `src/services/courseService.ts`
- Sessao e usuarios mockados: `src/services/userService.tsx`
- Documentacao geral dos mocks: `src/data/MOCKS.md`

## Comportamento

- Clicar em um curso na home navega para `/courses/:courseId`.
- `CourseView` busca o curso com `getMockCourseById`.
- Se o ID nao existir, a tela mostra `Curso nao encontrado`.
- Trocar de aula muda titulo, duracao e conteudo exibidos no player.

## Integracao futura

Quando o backend estiver pronto, mantenha as assinaturas publicas dos services sempre que possivel e troque apenas a implementacao interna de:

- `userService.tsx` para login, cadastro e sessao reais.
- `courseService.ts` para leitura de cursos, aulas, progresso e feedback.

Assim os componentes continuam consumindo a mesma camada de servico e a migracao fica menor.
