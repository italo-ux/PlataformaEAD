# Jornada do aluno

## Regras de negócio

- O catálogo do aluno contém apenas cursos com estado `publicado`.
- Publicar exige carga horária positiva, URL válida do YouTube e duração
  informada como `MM:SS` pela gestão para todas as aulas. O contrato HTTP recebe
  o valor convertido em `duracao_segundos`.
- Apenas aluno verificado pode se matricular.
- A matrícula é única por aluno/curso e o endpoint de criação é idempotente.
- A primeira aula é liberada após a matrícula; cada aula seguinte depende da
  conclusão da anterior.
- O player abre uma única sessão ativa por aula e envia heartbeats sequenciais a
  cada cinco segundos. A sessão expira após 20 segundos sem atualização.
- O backend deriva os intervalos usando seu próprio relógio e a duração
  persistida no cadastro da aula.
  Avanços de até 2x são aceitos; saltos, rajadas e repetições não aumentam a
  cobertura.
- A aula conclui ao atingir 90% da duração cadastrada.
- A conclusão do curso e a criação de um único certificado ocorrem na mesma
  transação protegida por bloqueio pessimista da matrícula.
- A URL de uma aula bloqueada não é retornada.

## Endpoints

| Método | Rota | Papel | Finalidade |
|---|---|---|---|
| `GET` | `/usuarios/me` | autenticado | restaurar a sessão |
| `POST` | `/cursos/:courseId/matricula` | aluno | criar ou retornar matrícula |
| `GET` | `/usuarios/me/matriculas` | aluno | home e dashboard |
| `GET` | `/cursos/:courseId/jornada` | todos | jornada ou pré-visualização |
| `POST` | `/cursos/:courseId/aulas/:lessonId/reproducao` | aluno | iniciar sessão segura |
| `POST` | `/cursos/:courseId/aulas/:lessonId/reproducao/:sessionId/heartbeat` | aluno | registrar posição temporizada |
| `POST` | `/cursos/:courseId/aulas/:lessonId/reproducao/:sessionId/encerrar` | aluno | salvar trecho final e encerrar |
| `GET` | `/usuarios/me/certificados` | aluno | listar certificados |
| `GET` | `/certificados/:id/pdf` | aluno proprietário | baixar PDF |
| `GET` | `/certificados/validar/:codigo` | público | validar certificado |
| `GET` | `/admin/metricas-jornada` | admin | indicadores mínimos |

Payload de heartbeat:

```json
{
  "sequencia": 2,
  "posicao_segundos": 20.1,
  "estado": "playing"
}
```

A validação pública retorna apenas código, nome do aluno, curso, carga horária,
data de conclusão/emissão e situação. CPF, e-mail, telefone e endereço nunca
fazem parte dessa resposta.

## Persistência

- `matricula`: vínculo canônico, progresso, conclusão, retomada e tempo.
- `progresso_aula`: snapshot de ordem, intervalos, duração cadastrada, orçamento
  temporal validado, posição e estado.
- `sessao_reproducao`: sequência, posição e expiração de cada sessão do player.
- `certificados`: dados congelados, código público e situação.
- `usuario_curso`: legado; não é usado pela nova jornada.

## Operação

`CERTIFICATE_ISSUER_NAME` define o emissor impresso no PDF.
`CERTIFICATE_VERIFY_BASE_URL` deve apontar para a rota pública do frontend.
Não há dependência da YouTube Data API nesta fase. A gestão deve conferir a
duração, a disponibilidade e a permissão de incorporação do vídeo. Cursos antigos
sem ID ou duração voltam a rascunho na migration 8.
O certificado não possui assinatura ICP-Brasil nesta versão.
