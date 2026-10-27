# Escalabilidade da validação de vídeos

Este guia descreve como operar a revalidação de vídeos do catálogo em uma ou
mais instâncias do backend. As rotas de cursos e trilhas leem apenas o estado
persistido em PostgreSQL; elas não aguardam uma resposta do YouTube.

## Arquitetura atual

1. Cada instância acorda a cada minuto, salvo quando
   `YOUTUBE_VALIDATION_WORKER_ENABLED=false`.
2. Uma conexão dedicada tenta obter o advisory lock de sessão `2026100301`.
   Somente a instância que obteve o lock processa o ciclo. As demais liberam a
   conexão sem esperar.
3. A instância vencedora lê até 100 aulas de vídeo publicadas com
   `youtube_proxima_validacao_em <= agora`, ordenadas pela data e pelo ID. A
   migration 16 cria um índice parcial para essa busca.
4. Até três verificações externas ocorrem simultaneamente, cada uma com timeout
   de cinco segundos. As gravações usam a mesma conexão dedicada, sem manter
   uma transação aberta durante a chamada externa.
5. A gravação confirma que o ID do vídeo não mudou e que a aula ainda estava
   vencida no início do ciclo. Uma correção recente de URL não é sobrescrita por
   uma validação anterior.
6. O lock é liberado no fim do lote. Se a instância cair, o PostgreSQL encerra a
   sessão e libera o lock; outra instância poderá trabalhar no próximo ciclo.

Uma validação bem-sucedida, inclusive a confirmação de vídeo indisponível,
atualiza `youtube_embeddable`, `youtube_validado_em` e agenda a próxima checagem
após `YOUTUBE_VALIDATION_TTL_MINUTES` (15 minutos por padrão). Timeout, HTTP
408/429, erro 5xx ou falha de rede **não mudam a disponibilidade conhecida**:
apenas a próxima tentativa é agendada. A publicação e o reparo de URL também
agendam a validação seguinte após confirmarem o vídeo.

O estado é eventual. Um vídeo removido pode permanecer visível até a próxima
verificação elegível. Quando o player relata erro, a rota autenticada apenas
antecipa a próxima validação persistida; ela não chama o YouTube na requisição.
Se a aula foi validada no último minuto, a rota mantém a agenda atual para
evitar revalidações repetidas. A publicação e o reparo de URL continuam fazendo
uma validação síncrona antes de confirmar a alteração. O limite de três cobre
todas as revalidações acionadas pelo player e pelo agendador.

## Conexão PostgreSQL obrigatória

O advisory lock é de **sessão**. Use conexão direta ao PostgreSQL ou pooler em
**modo sessão**. Não execute o worker através de pooler em modo transação:
nesse modo, o estado da sessão não é preservado entre operações e o lock pode
deixar de coordenar as instâncias. Para Supabase, selecione a conexão direta ou
o *Shared pooler, session mode* na opção **Connect** do painel. Consulte a
[documentação de modos de conexão do Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres).

O lock ocupa uma conexão do pool durante o lote. Mantenha `DB_POOL_MAX` em pelo
menos 2; o padrão do projeto é 5. Dimensione o total de conexões considerando
`número de instâncias × DB_POOL_MAX` e a capacidade disponível no PostgreSQL.
Se alguma instância só puder usar pooler em modo transação, configure nela
`YOUTUBE_VALIDATION_WORKER_ENABLED=false` e mantenha ao menos uma instância do
worker conectada diretamente ou em modo sessão.

## Implantação

1. Faça backup e confirme quais migrations já foram aplicadas. O projeto não
   mantém uma tabela automática de histórico de migrations.
2. Aplique as migrations pendentes em ordem numérica, incluindo
   `backend/database/migrations/16_youtube_validation_schedule.sql`, **antes**
   de implantar o backend que usa a nova coluna. Consulte
   `backend/database/README.md` para o comando `psql` e use
   `DB_SYNCHRONIZE=false`.
3. Em uma instalação grande, programe a migration 16 em janela de manutenção:
   ela atualiza a agenda dos vídeos já publicados e cria o índice.
4. Configure a conexão direta ou de sessão, `DB_POOL_MAX` e o TTL. Implante uma
   instância, confirme os logs e a redução da fila vencida, e só então aumente
   o número de instâncias.
5. Nunca habilite o worker em todas as instâncias se todas usam pooler de
   transação. Se ele estiver desabilitado em todas, nenhuma revalidação
   periódica ocorrerá.

## Acompanhamento

Consulte o volume de vídeos vencidos sem alterar dados:

```sql
SELECT count(*) AS videos_vencidos
FROM aulas AS aula
JOIN cursos AS curso ON curso.id = aula.id_curso
WHERE curso.status = 'publicado'
  AND aula.tipo = 'video'
  AND aula.youtube_video_id IS NOT NULL
  AND aula.youtube_proxima_validacao_em <= NOW();
```

Consulte os itens mais atrasados:

```sql
SELECT aula.id, aula.titulo, aula.youtube_proxima_validacao_em,
       aula.youtube_validado_em, aula.youtube_embeddable
FROM aulas AS aula
JOIN cursos AS curso ON curso.id = aula.id_curso
WHERE curso.status = 'publicado'
  AND aula.tipo = 'video'
  AND aula.youtube_video_id IS NOT NULL
  AND aula.youtube_proxima_validacao_em <= NOW()
ORDER BY aula.youtube_proxima_validacao_em, aula.id
LIMIT 20;
```

Monitore os avisos `YoutubeVideoValidationService` para falhas de YouTube e os
erros de banco/lock. Se `videos_vencidos` crescer continuamente, verifique
conectividade, modo de pooler, conexões livres e a duração de cada lote. O lock
é global apenas entre instâncias que usam o mesmo banco e a mesma chave.

## Quando evoluir

O lote de 100 vídeos e a concorrência de 3 são limites deliberadamente
conservadores. Meça a fila vencida e a carga do banco antes de aumentá-los no
serviço. Se um único coordenador não der vazão, a próxima arquitetura é uma
reserva persistente por vídeo, com prazo de expiração e
`FOR UPDATE SKIP LOCKED`, permitindo vários trabalhadores sem processar o mesmo
item. Essa mudança exige uma nova migration e testes de falha/recuperação; não
é necessária apenas para adicionar mais instâncias de API.

Referências: [advisory locks no PostgreSQL](https://www.postgresql.org/docs/current/explicit-locking.html#ADVISORY-LOCKS)
e [SKIP LOCKED no PostgreSQL](https://www.postgresql.org/docs/current/sql-select.html).
