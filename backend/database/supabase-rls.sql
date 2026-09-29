-- Segurança do Supabase para a arquitetura atual.
--
-- O frontend acessa somente a API NestJS. A API autentica os usuários e se
-- conecta ao Postgres com a role dedicada plataformaead_app. Por isso, a Data
-- API do Supabase (roles anon/authenticated) não deve acessar estas tabelas.
--
-- Pré-requisito: a role plataformaead_app deve existir e ter somente os grants
-- necessários de SELECT, INSERT, UPDATE e DELETE nas tabelas da aplicação.

BEGIN;

DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY ARRAY[
        'users',
        'programas',
        'trilhas',
        'cursos',
        'aulas',
        'questionarios',
        'perguntas_questionario',
        'alternativas_questionario',
        'matricula',
        'progresso_aula',
        'tentativas_questionario',
        'respostas_questionario',
        'sessao_reproducao',
        'certificados',
        'usuario_curso',
        'usuario_trilha',
        'trilha_curso',
        'conquistas',
        'usuario_conquista',
        'avaliacao_curso',
        'endereco'
    ]
    LOOP
        EXECUTE format(
            'ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',
            table_name
        );
        EXECUTE format(
            'ALTER TABLE public.%I FORCE ROW LEVEL SECURITY',
            table_name
        );
        EXECUTE format(
            'DROP POLICY IF EXISTS backend_service_full_access ON public.%I',
            table_name
        );
        EXECUTE format(
            'CREATE POLICY backend_service_full_access ON public.%I '
            'FOR ALL TO plataformaead_app USING (true) WITH CHECK (true)',
            table_name
        );
    END LOOP;
END
$$;

-- Defesa em profundidade: a aplicação não usa a Data API do Supabase.
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public
    FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public
    FROM anon, authenticated;

-- Novas tabelas e sequences também nascem fechadas para a Data API.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    REVOKE ALL PRIVILEGES ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    REVOKE ALL PRIVILEGES ON SEQUENCES FROM anon, authenticated;

COMMIT;
