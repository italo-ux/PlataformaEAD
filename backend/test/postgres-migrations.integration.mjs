import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { Client } from 'pg';

const databaseName = `plataforma_ead_test_${process.pid}_${randomBytes(4).toString('hex')}`;
assert.match(databaseName, /^plataforma_ead_test_[a-z0-9_]+$/);
const quotedDatabase = `"${databaseName}"`;
const connection = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? '',
};
const admin = new Client({
  ...connection,
  database: process.env.DB_MAINTENANCE_NAME ?? 'postgres',
});
let databaseCreated = false;

try {
  await admin.connect();
  await admin.query(`CREATE DATABASE ${quotedDatabase}`);
  databaseCreated = true;

  const testDatabase = new Client({ ...connection, database: databaseName });
  await testDatabase.connect();
  try {
    const migrationDirectory = path.resolve('database', 'migrations');
    const files = (await readdir(migrationDirectory))
      .filter((file) => /^\d+_.+\.sql$/.test(file))
      .sort(
        (left, right) =>
          Number(left.split('_')[0]) - Number(right.split('_')[0]),
      );

    for (const file of files) {
      await testDatabase.query(
        await readFile(path.join(migrationDirectory, file), 'utf8'),
      );
    }

    const rlsScript = await readFile(
      path.resolve('database', 'supabase-rls.sql'),
      'utf8',
    );
    const rlsTableList = rlsScript.match(/FOREACH table_name IN ARRAY ARRAY\[([\s\S]*?)\]/)?.[1];
    assert(rlsTableList, 'A lista de tabelas protegidas por RLS deve existir.');
    const protectedTables = new Set(
      [...rlsTableList.matchAll(/'([a-z_]+)'/g)].map((match) => match[1]),
    );
    const publicTables = await testDatabase.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`,
    );
    assert.deepEqual(
      protectedTables,
      new Set(publicTables.rows.map(({ tablename }) => tablename)),
      'Toda tabela pública criada pelas migrations deve constar no script de RLS.',
    );

    const tables = await testDatabase.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name IN (
           'matricula',
           'progresso_aula',
           'certificados',
           'sessao_reproducao',
           'questionarios',
           'perguntas_questionario',
           'alternativas_questionario',
           'tentativas_questionario',
           'respostas_questionario',
           'modelos_certificado',
           'modelo_certificado_imagens',
           'certificado_imagens_snapshot',
           'aula_pdfs'
         )`,
    );
    assert.deepEqual(
      new Set(tables.rows.map(({ table_name }) => table_name)),
      new Set([
        'matricula',
        'progresso_aula',
        'certificados',
        'sessao_reproducao',
        'questionarios',
        'perguntas_questionario',
        'alternativas_questionario',
        'tentativas_questionario',
        'respostas_questionario',
        'modelos_certificado',
        'modelo_certificado_imagens',
        'certificado_imagens_snapshot',
        'aula_pdfs',
      ]),
    );

    const courseColumns = await testDatabase.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'cursos'
         AND column_name IN ('status', 'publicado_em')`,
    );
    assert.deepEqual(
      new Set(courseColumns.rows.map(({ column_name }) => column_name)),
      new Set(['status', 'publicado_em']),
    );

    const lessonColumns = await testDatabase.query(
      `SELECT column_name, is_nullable, udt_name
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'aulas'
         AND column_name IN ('tipo', 'url_video')`,
    );
    const lessonColumnMap = new Map(
      lessonColumns.rows.map((column) => [column.column_name, column]),
    );
    assert.equal(lessonColumnMap.get('tipo')?.udt_name, 'aula_tipo');
    assert.equal(lessonColumnMap.get('url_video')?.is_nullable, 'YES');

    const validationScheduleColumn = await testDatabase.query(
      `SELECT data_type
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'aulas'
         AND column_name = 'youtube_proxima_validacao_em'`,
    );
    assert.equal(
      validationScheduleColumn.rows[0]?.data_type,
      'timestamp with time zone',
    );
    const validationScheduleIndex = await testDatabase.query(
      `SELECT indexdef FROM pg_indexes
       WHERE schemaname = 'public'
         AND indexname = 'idx_aulas_youtube_proxima_validacao'`,
    );
    assert.equal(validationScheduleIndex.rowCount, 1);
    assert.match(validationScheduleIndex.rows[0].indexdef, /WHERE/i);

    const competingConnection = new Client({ ...connection, database: databaseName });
    await competingConnection.connect();
    try {
      const key = 2026100301;
      const first = await testDatabase.query(
        'SELECT pg_try_advisory_lock($1) AS acquired', [key],
      );
      assert.equal(first.rows[0].acquired, true);
      try {
        const competing = await competingConnection.query(
          'SELECT pg_try_advisory_lock($1) AS acquired', [key],
        );
        assert.equal(competing.rows[0].acquired, false);
      } finally {
        await testDatabase.query('SELECT pg_advisory_unlock($1)', [key]);
      }
      const afterRelease = await competingConnection.query(
        'SELECT pg_try_advisory_lock($1) AS acquired', [key],
      );
      assert.equal(afterRelease.rows[0].acquired, true);
      await competingConnection.query('SELECT pg_advisory_unlock($1)', [key]);
    } finally {
      await competingConnection.end();
    }

    const certificateSnapshotColumn = await testDatabase.query(
      `SELECT data_type
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'certificados'
         AND column_name = 'modelo_snapshot'`,
    );
    assert.equal(certificateSnapshotColumn.rows[0]?.data_type, 'jsonb');

    const defaultTemplates = await testDatabase.query(
      `SELECT client_reference, is_default
       FROM modelos_certificado
       ORDER BY client_reference`,
    );
    assert.equal(defaultTemplates.rowCount, 3);
    assert.equal(
      defaultTemplates.rows.filter(({ is_default }) => is_default).length,
      1,
    );

    const defaultIndex = await testDatabase.query(
      `SELECT indexdef
       FROM pg_indexes
       WHERE schemaname = 'public'
         AND indexname = 'uq_modelo_certificado_padrao'`,
    );
    assert.equal(defaultIndex.rowCount, 1);
    assert.match(defaultIndex.rows[0].indexdef, /UNIQUE INDEX/i);
    assert.match(defaultIndex.rows[0].indexdef, /WHERE \(is_default = true\)/i);

    const constraints = await testDatabase.query(
      `SELECT conname
       FROM pg_constraint
       WHERE conrelid IN (
         'matricula'::regclass,
         'progresso_aula'::regclass,
         'certificados'::regclass,
         'questionarios'::regclass,
         'perguntas_questionario'::regclass,
         'tentativas_questionario'::regclass,
         'respostas_questionario'::regclass
       )`,
    );
    const names = new Set(constraints.rows.map(({ conname }) => conname));
    assert(names.has('UQ_matricula_usuario_curso'));
    assert(names.has('CHK_matricula_progresso'));
    assert(names.has('UQ_progresso_aula_matricula_aula'));
    assert(names.has('questionarios_id_aula_key'));
    assert(names.has('UQ_pergunta_questionario_ordem'));
    assert(names.has('UQ_tentativa_numero'));
    assert(names.has('UQ_resposta_tentativa_pergunta'));
    const playbackIndexes = await testDatabase.query(
      `SELECT indexname FROM pg_indexes
       WHERE schemaname = 'public' AND tablename = 'sessao_reproducao'`,
    );
    assert(
      playbackIndexes.rows.some(
        ({ indexname }) => indexname === 'uq_sessao_reproducao_ativa',
      ),
    );
    console.log(
      `PostgreSQL descartável validado com ${files.length} migrations.`,
    );
  } finally {
    await testDatabase.end();
  }
} finally {
  if (databaseCreated) {
    await admin.query(`DROP DATABASE IF EXISTS ${quotedDatabase} WITH (FORCE)`);
  }
  await admin.end().catch(() => undefined);
}
