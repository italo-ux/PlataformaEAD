import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import bcrypt from 'bcrypt';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Client } from 'pg';
import { spawn } from 'node:child_process';

const testDatabaseName =
  'plataforma_ead_journey_' +
  process.pid +
  '_' +
  randomBytes(4).toString('hex');
assert.match(testDatabaseName, /^plataforma_ead_journey_[a-z0-9_]+$/);
const quotedDatabase = '"' + testDatabaseName + '"';
const baseConnection = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? '',
};
const admin = new Client({
  ...baseConnection,
  database: process.env.DB_MAINTENANCE_NAME ?? 'postgres',
});
const previousDatabase = process.env.DB_NAME;
const previousSecret = process.env.JWT_SECRET;
let databaseCreated = false;
let app;
let frontend;

const delay = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function startFrontend(apiUrl) {
  const port = 5200 + (process.pid % 200);
  const logs = [];
  const child = spawn(
    process.execPath,
    [
      'node_modules/vite/bin/vite.js',
      '--host',
      '127.0.0.1',
      '--port',
      String(port),
    ],
    {
      cwd: path.resolve('..', 'frontend'),
      windowsHide: true,
      env: { ...process.env, VITE_API_URL: apiUrl },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  child.stdout.on('data', (chunk) => logs.push(chunk.toString()));
  child.stderr.on('data', (chunk) => logs.push(chunk.toString()));
  const url = 'http://127.0.0.1:' + port;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error('Frontend encerrou durante a inicialização:\n' + logs.join(''));
    }
    try {
      const response = await fetch(url);
      if (response.ok) {
        assert.match(await response.text(), /<div id="root"><\/div>/);
        return child;
      }
    } catch {
      // Vite ainda está inicializando.
    }
    await delay(250);
  }
  child.kill();
  throw new Error('Tempo esgotado aguardando o frontend:\n' + logs.join(''));
}

async function expectJson(baseUrl, route, options, expectedStatus) {
  const response = await fetch(baseUrl + route, options);
  const body = await response.json().catch(() => null);
  assert.equal(
    response.status,
    expectedStatus,
    route + ' retornou ' + response.status + ': ' + JSON.stringify(body),
  );
  return body;
}

try {
  await admin.connect();
  await admin.query('CREATE DATABASE ' + quotedDatabase);
  databaseCreated = true;

  const database = new Client({
    ...baseConnection,
    database: testDatabaseName,
  });
  await database.connect();
  try {
    const migrationDirectory = path.resolve('database', 'migrations');
    const migrations = (await readdir(migrationDirectory))
      .filter((file) => /^\d+_.+\.sql$/.test(file))
      .sort(
        (left, right) =>
          Number(left.split('_')[0]) - Number(right.split('_')[0]),
      );
    for (const migration of migrations) {
      await database.query(
        await readFile(path.join(migrationDirectory, migration), 'utf8'),
      );
    }

    const password = 'JourneyPassword1!';
    const passwordHash = await bcrypt.hash(password, 4);
    const professor = await database.query(
      `INSERT INTO users
       (name, email, password_hash, is_verified, role, cpf)
       VALUES ('Professor E2E', 'professor-e2e@example.com', $1, TRUE, 'professor', '12345678901')
       RETURNING id`,
      [passwordHash],
    );
    const student = await database.query(
      `INSERT INTO users
       (name, email, password_hash, is_verified, role, cpf)
       VALUES ('Aluno E2E', 'aluno-e2e@example.com', $1, TRUE, 'aluno', '10987654321')
       RETURNING id`,
      [passwordHash],
    );
    const otherProfessor = await database.query(
      `INSERT INTO users
       (name, email, password_hash, is_verified, role, cpf)
       VALUES ('Outro professor E2E', 'outro-professor-e2e@example.com', $1, TRUE, 'professor', '12345678903')
       RETURNING id`,
      [passwordHash],
    );
    await database.query(
      `INSERT INTO users (name, email, password_hash, is_verified, role, cpf)
       VALUES ('Admin E2E', 'admin-e2e@example.com', $1, TRUE, 'admin', '12345678902')`,
      [passwordHash],
    );
    await database.query(
      `INSERT INTO endereco (id_usuario, cep, cidade, uf)
       VALUES ($1, '01001000', 'São Paulo', 'SP')`,
      [student.rows[0].id],
    );
    const course = await database.query(
      `INSERT INTO cursos
       (id_instrutor, nome, carga_horaria, status, publicado_em)
       VALUES ($1, 'Curso E2E', 4, 'publicado', NOW())
       RETURNING id`,
      [professor.rows[0].id],
    );
    const hiddenDraft = await database.query(
      `INSERT INTO cursos (id_instrutor, nome, status)
       VALUES ($1, 'Rascunho reservado', 'rascunho') RETURNING id`,
      [otherProfessor.rows[0].id],
    );
    const trail = await database.query(
      `INSERT INTO trilhas (nome) VALUES ('Trilha E2E') RETURNING id`,
    );
    await database.query(
      `INSERT INTO trilha_curso (id_trilha, id_curso) VALUES ($1, $2)`,
      [trail.rows[0].id, course.rows[0].id],
    );
    await database.query(
      `INSERT INTO trilha_curso (id_trilha, id_curso, ordem) VALUES ($1, $2, 2)`,
      [trail.rows[0].id, hiddenDraft.rows[0].id],
    );
    const lessons = await database.query(
      `INSERT INTO aulas
       (id_curso, id_instrutor, titulo, url_video, ordem, duracao_minutos,
        youtube_video_id, duracao_segundos, youtube_embeddable, youtube_validado_em)
       VALUES
         ($1, $2, 'Aula 1', 'https://youtu.be/dQw4w9WgXcQ', 1, 1,
          'dQw4w9WgXcQ', 10, TRUE, NOW()),
         ($1, $2, 'Aula 2', 'https://youtu.be/dQw4w9WgXcQ', 2, 1,
          'dQw4w9WgXcQ', 10, TRUE, NOW())
       RETURNING id, ordem`,
      [course.rows[0].id, professor.rows[0].id],
    );

    process.env.DB_NAME = testDatabaseName;
    process.env.JWT_SECRET = 'student-journey-postgres-e2e-secret';
    const loaded = await import('../dist/app.module.js');
    const AppModule = loaded.AppModule ?? loaded.default?.AppModule;
    app = await NestFactory.create(AppModule, { logger: ['error'] });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.listen(0, '127.0.0.1');
    const address = app.getHttpServer().address();
    assert(address && typeof address !== 'string');
    const baseUrl = 'http://127.0.0.1:' + address.port;
    frontend = await startFrontend(baseUrl);

    const login = await expectJson(
      baseUrl,
      '/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'aluno-e2e@example.com',
          password,
        }),
      },
      201,
    );
    const authorization = {
      Authorization: 'Bearer ' + login.access_token,
      'Content-Type': 'application/json',
    };
    const me = await expectJson(
      baseUrl,
      '/usuarios/me',
      { headers: authorization },
      200,
    );
    assert.equal(me.id, student.rows[0].id);
    assert.equal(me.role, 'aluno');
    const studentCatalog = await expectJson(
      baseUrl,
      '/cursos',
      { headers: authorization },
      200,
    );
    assert.equal(studentCatalog.some((item) => item.id === hiddenDraft.rows[0].id), false);
    const studentTrails = await expectJson(
      baseUrl,
      '/trilhas',
      { headers: authorization },
      200,
    );
    assert.equal(studentTrails[0].cursos.some((item) => item.id === hiddenDraft.rows[0].id), false);

    const professorLogin = await expectJson(
      baseUrl,
      '/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'professor-e2e@example.com', password }),
      },
      201,
    );
    const professorHeaders = {
      Authorization: 'Bearer ' + professorLogin.access_token,
    };
    const professorCatalog = await expectJson(
      baseUrl,
      '/cursos',
      { headers: professorHeaders },
      200,
    );
    assert.equal(professorCatalog.some((item) => item.id === hiddenDraft.rows[0].id), false);
    const professorTrails = await expectJson(
      baseUrl,
      '/trilhas',
      { headers: professorHeaders },
      200,
    );
    assert.equal(professorTrails[0].cursos.some((item) => item.id === hiddenDraft.rows[0].id), false);
    await expectJson(
      baseUrl,
      '/cursos/' + hiddenDraft.rows[0].id,
      { headers: professorHeaders },
      404,
    );
    await expectJson(
      baseUrl,
      '/cursos/' + hiddenDraft.rows[0].id + '/aulas',
      { headers: professorHeaders },
      404,
    );

    const enrollmentRoute = '/cursos/' + course.rows[0].id + '/matricula';
    const firstEnrollment = await expectJson(
      baseUrl,
      enrollmentRoute,
      { method: 'POST', headers: authorization },
      201,
    );
    const secondEnrollment = await expectJson(
      baseUrl,
      enrollmentRoute,
      { method: 'POST', headers: authorization },
      201,
    );
    assert.equal(firstEnrollment.matricula.id, secondEnrollment.matricula.id);
    assert.equal(firstEnrollment.aulas[0].status, 'disponivel');
    assert.equal(firstEnrollment.aulas[1].status, 'bloqueada');
    assert.equal(firstEnrollment.aulas[1].url_video, null);

    const orderedLessons = lessons.rows.sort((a, b) => a.ordem - b.ordem);
    const lessonRoute = (lessonId) =>
      '/cursos/' + course.rows[0].id + '/aulas/' + lessonId;
    const startPlayback = (lessonId, position = 0) =>
      expectJson(
        baseUrl,
        lessonRoute(lessonId) + '/reproducao',
        {
          method: 'POST',
          headers: authorization,
          body: JSON.stringify({ posicao_segundos: position }),
        },
        201,
      );
    const heartbeat = (lessonId, sessionId, sequence, position, state = 'playing') => ({
      method: 'POST',
      headers: authorization,
      body: JSON.stringify({
        sequencia: sequence,
        posicao_segundos: position,
        estado: state,
      }),
    });

    await expectJson(
      baseUrl,
      lessonRoute(orderedLessons[1].id) + '/reproducao',
      {
        method: 'POST',
        headers: authorization,
        body: JSON.stringify({ posicao_segundos: 0 }),
      },
      403,
    );
    await expectJson(
      baseUrl,
      lessonRoute(orderedLessons[0].id) + '/progresso',
      {
        method: 'POST',
        headers: authorization,
        body: JSON.stringify({ inicio: 0, fim: 9, duracao: 10, posicao: 9 }),
      },
      410,
    );

    const attackSession = await startPlayback(orderedLessons[0].id);
    const burst = await expectJson(
      baseUrl,
      lessonRoute(orderedLessons[0].id) +
        '/reproducao/' +
        attackSession.id +
        '/heartbeat',
      heartbeat(orderedLessons[0].id, attackSession.id, 1, 5),
      200,
    );
    assert.equal(burst.creditado, false);
    assert.equal(burst.aula.percentual, 0);

    const firstSession = await startPlayback(orderedLessons[0].id);
    const revoked = await database.query(
      'SELECT status FROM sessao_reproducao WHERE id = $1',
      [attackSession.id],
    );
    assert.equal(revoked.rows[0].status, 'revogada');
    await expectJson(
      baseUrl,
      lessonRoute(orderedLessons[0].id) +
        '/reproducao/' +
        firstSession.id +
        '/heartbeat',
      heartbeat(orderedLessons[0].id, firstSession.id, 2, 0),
      409,
    );
    await delay(4500);
    const firstCompleted = await expectJson(
      baseUrl,
      lessonRoute(orderedLessons[0].id) +
        '/reproducao/' +
        firstSession.id +
        '/heartbeat',
      heartbeat(orderedLessons[0].id, firstSession.id, 1, 9, 'ended'),
      200,
    );
    assert.equal(firstCompleted.aula.concluida, true);
    const afterFirst = await expectJson(
      baseUrl,
      '/cursos/' + course.rows[0].id + '/jornada',
      { headers: authorization },
      200,
    );
    assert.equal(afterFirst.aulas[0].status, 'concluida');
    assert.equal(afterFirst.aulas[1].status, 'disponivel');

    const expiredSession = await startPlayback(orderedLessons[1].id);
    await database.query(
      `UPDATE sessao_reproducao
       SET expira_em = NOW() - INTERVAL '1 second'
       WHERE id = $1`,
      [expiredSession.id],
    );
    await expectJson(
      baseUrl,
      lessonRoute(orderedLessons[1].id) +
        '/reproducao/' +
        expiredSession.id +
        '/heartbeat',
      heartbeat(orderedLessons[1].id, expiredSession.id, 1, 1),
      409,
    );
    const expired = await database.query(
      'SELECT status FROM sessao_reproducao WHERE id = $1',
      [expiredSession.id],
    );
    assert.equal(expired.rows[0].status, 'expirada');

    const secondSession = await startPlayback(orderedLessons[1].id);
    await delay(4500);
    const finalRoute =
      lessonRoute(orderedLessons[1].id) +
      '/reproducao/' +
      secondSession.id +
      '/heartbeat';
    const finalRequests = await Promise.all([
      expectJson(
        baseUrl,
        finalRoute,
        heartbeat(orderedLessons[1].id, secondSession.id, 1, 9, 'playing'),
        200,
      ),
      expectJson(
        baseUrl,
        finalRoute,
        heartbeat(orderedLessons[1].id, secondSession.id, 1, 9, 'playing'),
        200,
      ),
    ]);
    assert(finalRequests.some((item) => item.matricula.conclusao));
    const completed = await expectJson(
      baseUrl,
      '/cursos/' + course.rows[0].id + '/jornada',
      { headers: authorization },
      200,
    );
    assert.equal(completed.matricula.progresso, 100);
    assert(completed.certificado);

    const certificateCount = await database.query(
      'SELECT COUNT(*)::int AS count FROM certificados',
    );
    assert.equal(certificateCount.rows[0].count, 1);
    const certificate = completed.certificado;
    const publicValidation = await expectJson(
      baseUrl,
      '/certificados/validar/' + certificate.codigo,
      {},
      200,
    );
    assert.equal(publicValidation.nome_aluno, 'Aluno E2E');
    assert.equal(publicValidation.nome_curso, 'Curso E2E');
    assert(!('cpf' in publicValidation));
    assert(!('email' in publicValidation));
    assert(!('phone' in publicValidation));

    const pdfResponse = await fetch(
      baseUrl + '/certificados/' + certificate.id + '/pdf',
      { headers: authorization },
    );
    assert.equal(pdfResponse.status, 200);
    assert.equal(pdfResponse.headers.get('content-type'), 'application/pdf');
    const pdf = Buffer.from(await pdfResponse.arrayBuffer());
    assert.equal(pdf.subarray(0, 4).toString(), '%PDF');
    const adminLogin = await expectJson(
      baseUrl,
      '/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin-e2e@example.com', password }),
      },
      201,
    );
    const adminAuthorization = { Authorization: 'Bearer ' + adminLogin.access_token };
    await expectJson(baseUrl, '/admin/dashboard/resumo', { headers: authorization }, 403);
    const summary = await expectJson(
      baseUrl, '/admin/dashboard/resumo', { headers: adminAuthorization }, 200,
    );
    assert.equal(summary.overview.alunosCadastrados, 1);
    assert.equal(summary.overview.matriculasIniciadas, 1);
    assert.equal(summary.overview.taxaConclusao, 100);
    assert.equal(summary.overview.certificadosEmitidos, 1);
    assert.equal(summary.ufDistribution[0].uf, 'SP');
    assert.equal(summary.courseTrackPerformance.length, 2);
    assert.equal(summary.learningFunnel[3].quantidade, 1);
    assert.equal(summary.certificatesOverTime.reduce((total, row) => total + row.certificados, 0), 1);
    const filtered = await expectJson(
      baseUrl, '/admin/dashboard/resumo?uf=RJ', { headers: adminAuthorization }, 200,
    );
    assert.equal(filtered.overview.matriculasIniciadas, 0);
    await expectJson(
      baseUrl, '/admin/dashboard/resumo?periodoInicio=2026-12-31&periodoFim=2026-01-01',
      { headers: adminAuthorization }, 400,
    );
    await expectJson(
      baseUrl, '/admin/dashboard/resumo?cursoId=nao-e-uuid',
      { headers: adminAuthorization }, 400,
    );
    console.log(
      'Projeto executado: jornada, certificado e dashboard administrativo com filtros e permissões validados.',
    );
  } finally {
    if (frontend && frontend.exitCode === null) {
      frontend.kill();
      frontend = undefined;
    }
    if (app) {
      await app.close();
      app = undefined;
    }
    await database.end();
  }
} finally {
  if (frontend && frontend.exitCode === null) frontend.kill();
  if (previousDatabase === undefined) delete process.env.DB_NAME;
  else process.env.DB_NAME = previousDatabase;
  if (previousSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = previousSecret;
  if (databaseCreated) {
    await admin.query(
      'DROP DATABASE IF EXISTS ' + quotedDatabase + ' WITH (FORCE)',
    );
  }
  await admin.end().catch(() => undefined);
}
