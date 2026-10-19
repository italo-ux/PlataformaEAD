# Backend da Plataforma EAD

API NestJS com JWT, autorização por papel, TypeORM/PostgreSQL, matrícula,
progresso sequencial e certificado PDF com QR Code.

## Executar

```bash
npm ci
npm run start:dev
```

Configure `backend/.env` a partir de `../.env.example`. Use migrations com
`DB_SYNCHRONIZE=false`.

## Módulos principais

- `auth` e `usuarios`: cadastro, verificação, login, sessão e perfil.
- `cursos` e `trilhas`: conteúdo em rascunho/publicado.
- `jornada`: matrícula, sessões temporizadas, intervalos assistidos, retomada e conclusão.
- `certificados`: consulta do aluno, validação pública e PDF.

Os contratos da jornada estão em `../docs/JORNADA_ALUNO.md`; a ordem de
migrations e os diagnósticos estão em `database/README.md`.

## Testes

```bash
npm run build
npm test -- --runInBand
npm run test:e2e -- --runInBand
npm run test:postgres
npm run test:journey:e2e
```

Os testes unitários/E2E HTTP usam repositórios isolados. `test:postgres`
complementa a suíte aplicando as migrations em PostgreSQL real descartável.

## Progresso confiável

A duração é informada como `MM:SS` na interface de gestão, convertida para
segundos e persistida antes da publicação. Ela não é aceita nos endpoints usados pelo
player do aluno. O backend concede cobertura somente a heartbeats contínuos
compatíveis com o tempo transcorrido, limitado a 2x. Sessões ficam inativas
após 20 segundos. Nesta fase não há consulta à YouTube Data API; disponibilidade,
privacidade e permissão de incorporação precisam ser conferidas pela gestão.
