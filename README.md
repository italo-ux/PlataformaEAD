# Plataforma EAD

Aplicação de ensino com React, NestJS e PostgreSQL. A jornada principal do
aluno é persistida: login, matrícula, aulas sequenciais, retomada de vídeo,
conclusão e certificado PDF verificável.

## Estrutura

- `frontend/`: React, TypeScript, Vite e Tailwind CSS.
- `backend/`: NestJS, TypeORM, JWT e geração de PDF/QR Code.
- `backend/database/migrations/`: migrations SQL aditivas, executadas em ordem.
- `docs/JORNADA_ALUNO.md`: regras de negócio e contratos HTTP da jornada.

## Pré-requisitos

- Node.js 22 ou superior.
- PostgreSQL 14 ou superior.
- npm.

## Instalação

1. Copie `.env.example` para `backend/.env` e preencha banco, JWT e SMTP.
2. Crie o banco configurado em `DB_NAME`.
3. Faça backup se o banco já contiver dados.
4. Aplique, em ordem, os scripts de `backend/database/migrations/` com
   `ON_ERROR_STOP=1`. A migration 7 aborta se encontrar matrículas duplicadas.
5. Instale e execute cada aplicação:

```bash
cd backend
npm ci
npm run start:dev

cd ../frontend
npm ci
npm run dev
```

O backend usa `http://localhost:3000`; o frontend usa
`http://localhost:5173`. Configure `VITE_API_URL` se a API estiver em outro
endereço.

## Jornada por papel

- Aluno: verifica a conta, entra, vê apenas cursos publicados, inicia uma
  matrícula idempotente, assiste às aulas na ordem e recebe o certificado ao
  concluir todas.
- Professor: cria o curso em rascunho, cadastra as aulas, publica e usa a
  pré-visualização sem gerar progresso.
- Administrador: gerencia conteúdo/equipe e consulta as métricas reais de
  matrículas, aulas, cursos concluídos e certificados.

Uma aula conclui com 90% de cobertura única do vídeo. Temporariamente, a duração
é informada como `MM:SS` pelo professor ou administrador; o frontend a converte
para segundos ao cadastrar a aula. O
backend deriva os intervalos de heartbeats temporizados, aceita reprodução até
2x e não aceita duração nem intervalos enviados pelo player do aluno. Repetições e intervalos sobrepostos não
contam duas vezes. Depois da primeira matrícula, a estrutura de
aulas e a exclusão do curso ficam bloqueadas; mudanças estruturais futuras
devem usar uma nova versão do curso.

## Verificação

```bash
cd backend
npm run build
npm test -- --runInBand
npm run test:e2e -- --runInBand
npm run test:postgres
npm run test:journey:e2e

cd ../frontend
npm run build
npm test -- --run
```

`test:postgres` cria um banco temporário aleatório, aplica todas as migrations,
confere as restrições da jornada e remove o banco no final. Ele exige permissão
de `CREATE DATABASE` no PostgreSQL configurado e nunca usa `DB_NAME`.
`test:journey:e2e` também inicia a API sobre um banco temporário e percorre
login, matrícula, aulas sequenciais, conclusão concorrente, PDF e validação.

## Rollout

1. Execute `npm run test:postgres` em desenvolvimento.
2. Faça backup do banco de homologação.
3. Rode o diagnóstico de duplicidade descrito em
   `backend/database/README.md`.
4. Aplique a migration 7 em homologação com parada em qualquer erro.
5. A migration 8 retorna cursos antigos sem ID e duração cadastrados para
   rascunho. Revise a URL e informe a duração de cada aula antes de republicar.
6. Faça o fluxo completo com um curso piloto.
7. Só então repita o procedimento em produção.

Mantenha `DB_SYNCHRONIZE=false` fora de bancos descartáveis.
