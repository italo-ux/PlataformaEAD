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

    const tables = await testDatabase.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name IN ('matricula', 'progresso_aula', 'certificados', 'sessao_reproducao')`,
    );
    assert.deepEqual(
      new Set(tables.rows.map(({ table_name }) => table_name)),
      new Set(['matricula', 'progresso_aula', 'certificados', 'sessao_reproducao']),
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

    const constraints = await testDatabase.query(
      `SELECT conname
       FROM pg_constraint
       WHERE conrelid IN ('matricula'::regclass, 'progresso_aula'::regclass, 'certificados'::regclass)`,
    );
    const names = new Set(constraints.rows.map(({ conname }) => conname));
    assert(names.has('UQ_matricula_usuario_curso'));
    assert(names.has('CHK_matricula_progresso'));
    assert(names.has('UQ_progresso_aula_matricula_aula'));
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
