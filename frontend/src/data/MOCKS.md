# Mocks do frontend

O frontend esta temporariamente padronizado para funcionar sem chamadas reais de API.

- Usuarios mockados ficam em `userMock.ts`.
- Login, cadastro e sessao passam por `services/userService.tsx`.
- O `localStorage` salva apenas os dados minimos da sessao simulada, sem senha.
- Cursos e aulas mockados ficam em `courseData.ts`.
- A tela de curso usa o ID da rota (`/courses/:courseId`) para buscar o curso em memoria.

Quando o backend estiver pronto, substitua a implementacao interna de `userService.tsx` e `courseService.ts` por chamadas HTTP reais, mantendo as mesmas assinaturas publicas sempre que possivel.
