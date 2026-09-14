# Cursos e aulas

Documento técnico do conteúdo da Plataforma EAD. Última revisão: 12/09/2026.

## Estados

Todo curso nasce em `rascunho`. `POST /cursos/:id/publicar` muda o estado
para `publicado` somente quando a carga horária é positiva e existe ao menos
uma aula com URL válida do YouTube e duração positiva informada pela gestão.
Alunos listam e consultam somente cursos publicados;
professores e administradores podem ver rascunhos.

Depois da primeira matrícula, a API retorna conflito ao tentar excluir o curso
ou criar, alterar ou remover suas aulas. Uma mudança estrutural deve gerar nova
versão do curso para não invalidar progresso e certificados.

## Permissões

| Operação | Aluno | Professor | Admin |
|---|:---:|:---:|:---:|
| Listar/consultar cursos publicados | Sim | Sim | Sim |
| Criar, editar e publicar curso | Não | Sim | Sim |
| Criar, editar e excluir aulas | Não | Sim | Sim |
| Pré-visualizar jornada | Não | Sim | Sim |
| Matricular e registrar progresso | Sim | Não | Não |

Todas as rotas da tabela, exceto a validação pública de certificado, exigem
`Authorization: Bearer <JWT>`.

## Endpoints de conteúdo

| Método | Rota | Observação |
|---|---|---|
| `GET` | `/cursos` | filtro de publicação aplicado pelo papel |
| `GET` | `/cursos/:id` | UUID obrigatório |
| `POST` | `/cursos` | cria rascunho e define o instrutor autenticado |
| `PATCH` | `/cursos/:id` | atualização parcial |
| `POST` | `/cursos/:id/publicar` | valida carga horária e aulas |
| `DELETE` | `/cursos/:id` | bloqueado depois da primeira matrícula |
| `GET` | `/cursos/:id/aulas` | gestão por professor/admin |
| `POST` | `/cursos/:id/aulas` | URL do YouTube e duração em segundos |
| `PATCH` | `/cursos/:id/aulas/:aulaId` | bloqueado após matrícula |
| `DELETE` | `/cursos/:id/aulas/:aulaId` | bloqueado após matrícula |

Exemplo de curso:

```json
{
  "nome": "Introdução à inovação",
  "descricao": "Fundamentos e aplicações práticas.",
  "carga_horaria": 10,
  "categoria": "Tecnologia",
  "nivel": "Iniciante"
}
```

Exemplo de aula:

```json
{
  "titulo": "Conceitos iniciais",
  "descricao": "Conteúdo complementar.",
  "url_video": "https://www.youtube.com/watch?v=VIDEO_ID",
  "duracao_segundos": 600,
  "ordem": 1
}
```

IDs, vínculo com curso e instrutor são definidos no servidor. O backend extrai
o `youtube_video_id` da URL e persiste `duracao_segundos`; `duracao_minutos` é
derivada automaticamente. Não há consulta à YouTube Data API nesta fase, então
a gestão deve conferir duração, disponibilidade e incorporação. A validação
global rejeita campos não declarados. Consulte `JORNADA_ALUNO.md` para
matrícula, progresso, conclusão e certificado.
