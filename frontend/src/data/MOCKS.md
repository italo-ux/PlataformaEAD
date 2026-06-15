# Mocks do frontend

O frontend esta temporariamente padronizado para funcionar sem chamadas reais de API.

- Usuarios mockados ficam em `userMock.ts`.
- As contas mockadas atuais sao:
  - `aluno@plataforma.com` / `aluno123`
  - `professor@plataforma.com` / `professor123`
  - `admin@plataforma.com` / `admin123`
- Permissoes tambem ficam em `userMock.ts`: aluno acessa cursos/home, professor cria cursos, admin tambem podera criar professores. `Meu Desempenho` fica oculto na navbar ate a tela separada ser implementada.
- Login, cadastro e sessao passam por `services/userService.tsx`.
- O `localStorage` salva apenas os dados minimos da sessao simulada, sem senha.
- Cursos e aulas mockados ficam em `courseData.ts`.
- Criacao mockada de curso passa por `services/courseService.ts` e fica somente em memoria ate o refresh da pagina.
- A tela de curso usa o ID da rota (`/courses/:courseId`) para buscar o curso em memoria.

Quando o backend estiver pronto, substitua a implementacao interna de `userService.tsx` e `courseService.ts` por chamadas HTTP reais, mantendo as mesmas assinaturas publicas sempre que possivel.
