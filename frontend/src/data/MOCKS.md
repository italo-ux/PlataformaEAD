# Dados mockados do frontend

Os cursos, aulas e trilhas continuam locais em `courseData.ts`. A criação de
curso e aula usa `courseService.ts` e existe somente em memória até a página
ser recarregada.

Autenticação não é mockada: login e cadastro chamam a API em
`POST /auth/login` e `POST /auth/register`. A sessão salva no navegador contém
somente dados públicos do usuário e o token de acesso, nunca a senha.

Enquanto a API não fornecer papéis, toda sessão autenticada é tratada como
`aluno`. Por isso, criação e gestão de cursos ficam indisponíveis para usuários
da API. Os professores e administradores de `userMock.ts` são mantidos apenas
para desenvolvimento futuro dos fluxos mockados de gestão.
