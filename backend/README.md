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
- `certificados`: consulta do aluno, validação pública, PDF, modelos
  persistentes e snapshots imutáveis por emissão.

Os contratos da jornada estão em `../docs/JORNADA_ALUNO.md`; a ordem de
migrations e os diagnósticos estão em `database/README.md`.

## Feedback por e-mail

O formulário de feedback envia mensagens por SMTP ao endereço definido em
`INSTITUTION_EMAIL` no `backend/.env`. Configure também as variáveis `SMTP_*`;
sem destinatário válido ou SMTP, a API retorna erro e não confirma o envio.
O e-mail da conta autenticada é usado como endereço de resposta.

## Modelos de certificado

Todas as rotas abaixo exigem JWT e papel `admin`:

- `GET /admin/modelos-certificado`: lista modelos e imagens;
- `POST /admin/modelos-certificado`: cria um modelo;
- `PATCH /admin/modelos-certificado/:id`: substitui os campos editáveis;
- `POST /admin/modelos-certificado/:id/padrao`: troca o padrão;
- `POST /admin/modelos-certificado/sincronizar`: importa modelos do antigo
  `localStorage` por `clientId`, sem sobrescrever uma referência já importada.

Os marcadores aceitos no corpo são `{aluno}` e `{curso}`. Cores usam `#RRGGBB`.
Cada modelo aceita até quatro logos e quatro assinaturas PNG, com 1 MiB por
imagem; assinaturas exigem identificação. O binário fica em `BYTEA`, e não em
texto base64. A troca de padrão usa transação, lock consultivo do PostgreSQL e
índice único parcial, portanto duas requisições simultâneas não criam dois
padrões.

Toda emissão passa por `CertificateIssuanceService` dentro da transação já
aberta pelo fluxo chamador. O certificado guarda o JSON do modelo e cópias das
imagens. A edição posterior do modelo não muda o documento emitido. Registros
antigos sem snapshot seguem pelo gerador PDF legado. A validação pública mantém
o contrato anterior e não expõe modelo, imagens ou dados administrativos.

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
