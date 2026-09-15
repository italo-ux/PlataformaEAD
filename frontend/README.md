# Frontend da Plataforma EAD

Aplicação React, TypeScript, Vite e Tailwind CSS.

## Execução

```bash
npm ci
npm run dev
```

Configure `VITE_API_URL` em `frontend/.env.local`; o padrão é
`http://localhost:3000`. Variáveis `VITE_*` são públicas no bundle.
Para exibir a checkbox **Ambiente de teste** em um build de produção de
homologação, configure `VITE_ENABLE_TEST_COURSES=true` e habilite também
`ALLOW_TEST_COURSE_BYPASS=true` no backend.

## Sessão e privacidade

O `AuthProvider` restaura o usuário com `GET /usuarios/me` e encerra a
sessão em respostas 401. O navegador persiste somente JWT, id, nome, e-mail,
papel e flags operacionais. CPF e telefone permanecem apenas na memória da
sessão.

## Jornada

- Home e dashboard usam matrículas reais.
- O curso cria a matrícula ao clicar em “Iniciar curso”.
- O player usa a YouTube IFrame API e envia intervalos contínuos.
- Aulas bloqueadas não recebem URL do backend.
- Certificados podem ser baixados e validados na rota pública
  `/certificados/validar/:codigo`.

## Validação

```bash
npm run build
npm test -- --run
```
