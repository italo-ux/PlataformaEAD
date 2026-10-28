import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import bcrypt from 'bcrypt';
import PDFDocument from 'pdfkit';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Client } from 'pg';

const databaseName = `plataforma_ead_pdf_${process.pid}_${randomBytes(4).toString('hex')}`;
assert.match(databaseName, /^plataforma_ead_pdf_[a-z0-9_]+$/);
const quotedDatabase = `"${databaseName}"`;
const connection = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? '',
};
const admin = new Client({ ...connection, database: process.env.DB_MAINTENANCE_NAME ?? 'postgres' });
const previousDatabase = process.env.DB_NAME;
const previousSecret = process.env.JWT_SECRET;
let created = false;
let app;

async function makePdf(title) {
  const document = new PDFDocument();
  const chunks = [];
  document.on('data', (chunk) => chunks.push(chunk));
  const finished = new Promise((resolve) => document.on('end', () => resolve(Buffer.concat(chunks))));
  document.text(title);
  document.end();
  return finished;
}

async function request(baseUrl, route, token, method = 'GET', body, status = 200) {
  const response = await fetch(baseUrl + route, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json().catch(() => null);
  assert.equal(response.status, status, `${route}: ${response.status} ${JSON.stringify(data)}`);
  return data;
}

try {
  await admin.connect();
  await admin.query(`CREATE DATABASE ${quotedDatabase}`);
  created = true;
  const database = new Client({ ...connection, database: databaseName });
  await database.connect();
  try {
    const migrationDirectory = path.resolve('database', 'migrations');
    const migrations = (await readdir(migrationDirectory))
      .filter((file) => /^\d+_.+\.sql$/.test(file))
      .sort((a, b) => Number(a.split('_')[0]) - Number(b.split('_')[0]));
    for (const migration of migrations) {
      await database.query(await readFile(path.join(migrationDirectory, migration), 'utf8'));
    }

    const password = 'PdfJourneyPassword1!';
    const hash = await bcrypt.hash(password, 4);
    for (const [email, role, cpf] of [
      ['pdf-prof@example.com', 'professor', '12345678901'],
      ['other-prof@example.com', 'professor', '12345678902'],
      ['pdf-student@example.com', 'aluno', '12345678903'],
    ]) {
      await database.query(
        'INSERT INTO users (name, email, password_hash, is_verified, role, cpf) VALUES ($1, $2, $3, TRUE, $4, $5)',
        [email, email, hash, role, cpf],
      );
    }

    process.env.DB_NAME = databaseName;
    process.env.JWT_SECRET = 'pdf-lesson-postgres-e2e-secret';
    const loaded = await import('../dist/app.module.js');
    const AppModule = loaded.AppModule ?? loaded.default?.AppModule;
    app = await NestFactory.create(AppModule, { logger: ['error'] });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.listen(0, '127.0.0.1');
    const address = app.getHttpServer().address();
    assert(address && typeof address !== 'string');
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const login = async (email) => (await request(baseUrl, '/auth/login', null, 'POST', { email, password }, 201)).access_token;
    const professor = await login('pdf-prof@example.com');
    const otherProfessor = await login('other-prof@example.com');
    const student = await login('pdf-student@example.com');
    const course = await request(baseUrl, '/cursos', professor, 'POST', { nome: 'Curso PDF', carga_horaria: 1 }, 201);
    const original = await makePdf('Material original');
    const replacement = await makePdf('Material atualizado');
    const lessonRoute = `/cursos/${course.id}/aulas`;
    await request(baseUrl, lessonRoute, professor, 'POST', {
      titulo: 'Arquivo inválido', tipo: 'pdf',
      pdf_arquivo: { nome_arquivo: 'invalido.pdf', dados_base64: Buffer.from('não é PDF').toString('base64') },
    }, 400);
    await request(baseUrl, lessonRoute, professor, 'POST', {
      titulo: 'Arquivo truncado', tipo: 'pdf',
      pdf_arquivo: { nome_arquivo: 'truncado.pdf', dados_base64: Buffer.from('%PDF-1.7\n%%EOF').toString('base64') },
    }, 400);
    const invalidCount = await database.query('SELECT count(*)::int AS total FROM aulas WHERE id_curso = $1', [course.id]);
    assert.equal(invalidCount.rows[0].total, 0);
    const lesson = await request(baseUrl, lessonRoute, professor, 'POST', {
      titulo: 'Leia o material', tipo: 'pdf',
      pdf_arquivo: { nome_arquivo: 'aula.pdf', dados_base64: original.toString('base64') },
    }, 201);
    const secondLesson = await request(baseUrl, lessonRoute, professor, 'POST', {
      titulo: 'Leia o segundo material', tipo: 'pdf',
      pdf_arquivo: { nome_arquivo: 'segundo.pdf', dados_base64: original.toString('base64') },
    }, 201);
    assert.equal(lesson.tipo, 'pdf');
    assert.equal(lesson.pdf_anexo.nome_arquivo, 'aula.pdf');
    assert(!('conteudo' in lesson.pdf_anexo));
    const updated = await request(baseUrl, `${lessonRoute}/${lesson.id}`, professor, 'PATCH', {
      pdf_arquivo: { nome_arquivo: 'material.pdf', dados_base64: replacement.toString('base64') },
    });
    assert.equal(updated.pdf_anexo.nome_arquivo, 'material.pdf');
    const lessons = await request(baseUrl, lessonRoute, professor);
    assert(!('conteudo' in lessons[0].pdf_anexo));

    const pdfRoute = `${lessonRoute}/${lesson.id}/pdf`;
    const secondPdfRoute = `${lessonRoute}/${secondLesson.id}/pdf`;
    assert.equal((await fetch(baseUrl + pdfRoute)).status, 401);
    await request(baseUrl, pdfRoute, otherProfessor, 'GET', undefined, 403);
    await request(baseUrl, pdfRoute, student, 'GET', undefined, 404);
    await request(baseUrl, `/cursos/${course.id}/publicar`, professor, 'POST', undefined, 201);
    await request(baseUrl, `${lessonRoute}/${lesson.id}`, professor, 'PATCH', { titulo: 'Edição tardia' }, 409);
    await request(baseUrl, pdfRoute, student, 'GET', undefined, 403);
    await request(baseUrl, `${pdfRoute}/concluir`, student, 'POST', undefined, 403);
    const enrollment = await request(baseUrl, `/cursos/${course.id}/matricula`, student, 'POST', undefined, 201);
    assert.equal(enrollment.aulas[0].pdf_nome_arquivo, 'material.pdf');
    assert.equal(enrollment.aulas[1].pdf_nome_arquivo, null);
    await request(baseUrl, secondPdfRoute, student, 'GET', undefined, 403);
    await request(baseUrl, `${secondPdfRoute}/concluir`, student, 'POST', undefined, 403);
    const downloaded = await fetch(baseUrl + pdfRoute, { headers: { Authorization: `Bearer ${student}` } });
    assert.equal(downloaded.status, 200);
    assert.equal(downloaded.headers.get('content-type'), 'application/pdf');
    assert.match(downloaded.headers.get('content-disposition'), /material\.pdf/);
    assert.equal(downloaded.headers.get('cache-control'), 'private, no-store');
    assert.deepEqual(Buffer.from(await downloaded.arrayBuffer()), replacement);
    const firstCompleted = await request(baseUrl, `${pdfRoute}/concluir`, student, 'POST', undefined, 201);
    assert.equal(firstCompleted.aulas[0].status, 'concluida');
    assert.equal(firstCompleted.aulas[1].status, 'disponivel');
    assert.equal(firstCompleted.matricula.progresso, 50);
    assert.equal(firstCompleted.certificado, null);
    const unlocked = await fetch(baseUrl + secondPdfRoute, { headers: { Authorization: `Bearer ${student}` } });
    assert.equal(unlocked.status, 200);
    const completed = await request(baseUrl, `${secondPdfRoute}/concluir`, student, 'POST', undefined, 201);
    assert.equal(completed.matricula.progresso, 100);
    assert.equal(completed.matricula.conclusao, true);
    assert(completed.certificado);
    await request(baseUrl, `${pdfRoute}/concluir`, student, 'POST', undefined, 201);
    const certificates = await database.query('SELECT count(*)::int AS total FROM certificados');
    assert.equal(certificates.rows[0].total, 1);

    const draft = await request(baseUrl, '/cursos', professor, 'POST', { nome: 'Troca de tipo', carga_horaria: 1 }, 201);
    const draftRoute = `/cursos/${draft.id}/aulas`;
    const convertible = await request(baseUrl, draftRoute, professor, 'POST', {
      titulo: 'Conversível', tipo: 'video', url_video: 'https://youtu.be/dQw4w9WgXcQ', duracao_segundos: 60,
    }, 201);
    const asPdf = await request(baseUrl, `${draftRoute}/${convertible.id}`, professor, 'PATCH', {
      tipo: 'pdf', pdf_arquivo: { nome_arquivo: 'troca.pdf', dados_base64: original.toString('base64') },
    });
    assert.equal(asPdf.tipo, 'pdf');
    assert.equal(asPdf.url_video, null);
    assert.equal(asPdf.pdf_anexo.nome_arquivo, 'troca.pdf');
    const asVideo = await request(baseUrl, `${draftRoute}/${convertible.id}`, professor, 'PATCH', {
      tipo: 'video', url_video: 'https://youtu.be/dQw4w9WgXcQ', duracao_segundos: 60,
    });
    assert.equal(asVideo.tipo, 'video');
    assert.equal(asVideo.pdf_anexo, null);
    const removed = await database.query('SELECT count(*)::int AS total FROM aula_pdfs WHERE id_aula = $1', [convertible.id]);
    assert.equal(removed.rows[0].total, 0);
    const deletable = await request(baseUrl, draftRoute, professor, 'POST', {
      titulo: 'Removível', tipo: 'pdf',
      pdf_arquivo: { nome_arquivo: 'remover.pdf', dados_base64: original.toString('base64') },
    }, 201);
    const deleted = await fetch(baseUrl + `${draftRoute}/${deletable.id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${professor}` },
    });
    assert.equal(deleted.status, 204);
    const cascaded = await database.query('SELECT count(*)::int AS total FROM aula_pdfs WHERE id_aula = $1', [deletable.id]);
    assert.equal(cascaded.rows[0].total, 0);
    console.log('Aula PDF validada: anexo, substituição, permissões, download, progresso e certificado.');
  } finally {
    if (app) await app.close();
    await database.end();
  }
} finally {
  if (previousDatabase === undefined) delete process.env.DB_NAME;
  else process.env.DB_NAME = previousDatabase;
  if (previousSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = previousSecret;
  if (created) await admin.query(`DROP DATABASE IF EXISTS ${quotedDatabase} WITH (FORCE)`);
  await admin.end().catch(() => undefined);
}
