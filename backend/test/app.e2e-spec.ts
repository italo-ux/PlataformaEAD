/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import * as jwt from 'jsonwebtoken';
import request from 'supertest';
import { AuthenticatedUser } from '../src/auth/authenticated-user.interface';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { RolesGuard } from '../src/auth/roles.guard';
import { UserRole } from '../src/auth/user-role.enum';
import { Aula } from '../src/cursos/aula.entity';
import { AulasController } from '../src/cursos/aulas.controller';
import { AulasService } from '../src/cursos/aulas.service';
import { Curso } from '../src/cursos/curso.entity';
import { CursosController } from '../src/cursos/cursos.controller';
import { CursosService } from '../src/cursos/cursos.service';

const testSecret = 'e2e-test-secret';
const courseId = '11111111-1111-4111-8111-111111111111';
const professorId = '22222222-2222-4222-8222-222222222222';
const otherProfessorId = '33333333-3333-4333-8333-333333333333';
const adminId = '44444444-4444-4444-8444-444444444444';
const studentId = '55555555-5555-4555-8555-555555555555';
const missingId = '66666666-6666-4666-8666-666666666666';
const lessonId = '77777777-7777-4777-8777-777777777777';

describe('Cursos authorization (e2e)', () => {
  let app: INestApplication;
  let courses: Curso[];
  let lessons: Aula[];
  const repository = {
    create: jest.fn(
      (data: Partial<Curso>) => ({ id: courseId, aulas: [], ...data }) as Curso,
    ),
    save: jest.fn((course: Curso) => {
      const index = courses.findIndex((item) => item.id === course.id);
      if (index >= 0) courses[index] = course;
      else courses.push(course);
      return Promise.resolve(course);
    }),
    find: jest.fn(() =>
      Promise.resolve(
        [...courses].sort((a, b) => a.nome.localeCompare(b.nome)),
      ),
    ),
    findOneBy: jest.fn(({ id }: { id: string }) =>
      Promise.resolve(courses.find((course) => course.id === id) ?? null),
    ),
    merge: jest.fn((course: Curso, data: Partial<Curso>) =>
      Object.assign(course, data),
    ),
    remove: jest.fn((course: Curso) => {
      courses = courses.filter((item) => item.id !== course.id);
      return Promise.resolve(course);
    }),
  };
  const lessonRepository = {
    count: jest.fn(({ where }: { where: { curso: { id: string } } }) =>
      Promise.resolve(
        lessons.filter((lesson) => lesson.curso.id === where.curso.id).length,
      ),
    ),
    create: jest.fn(
      (data: Partial<Aula>) => ({ id: lessonId, ...data }) as Aula,
    ),
    save: jest.fn((lesson: Aula) => {
      const index = lessons.findIndex((item) => item.id === lesson.id);
      if (index >= 0) lessons[index] = lesson;
      else lessons.push(lesson);
      return Promise.resolve(lesson);
    }),
    find: jest.fn(({ where }: { where: { curso: { id: string } } }) =>
      Promise.resolve(
        lessons
          .filter((lesson) => lesson.curso.id === where.curso.id)
          .sort(
            (a, b) => a.ordem - b.ordem || a.titulo.localeCompare(b.titulo),
          ),
      ),
    ),
    findOne: jest.fn(
      ({ where }: { where: { id: string; curso: { id: string } } }) =>
        Promise.resolve(
          lessons.find(
            (lesson) =>
              lesson.id === where.id && lesson.curso.id === where.curso.id,
          ) ?? null,
        ),
    ),
    merge: jest.fn((lesson: Aula, data: Partial<Aula>) =>
      Object.assign(lesson, data),
    ),
    remove: jest.fn((lesson: Aula) => {
      lessons = lessons.filter((item) => item.id !== lesson.id);
      return Promise.resolve(lesson);
    }),
  };

  beforeEach(async () => {
    courses = [];
    lessons = [];
    const module = await Test.createTestingModule({
      controllers: [CursosController, AulasController],
      providers: [
        CursosService,
        AulasService,
        RolesGuard,
        { provide: getRepositoryToken(Curso), useValue: repository },
        { provide: getRepositoryToken(Aula), useValue: lessonRepository },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: {
          switchToHttp: () => {
            getRequest: () => {
              headers: { authorization?: string };
              user?: AuthenticatedUser;
            };
          };
        }) => {
          const httpRequest = context.switchToHttp().getRequest();
          const authorization = httpRequest.headers.authorization;
          if (!authorization?.startsWith('Bearer ')) {
            throw new UnauthorizedException();
          }
          try {
            const payload = jwt.verify(
              authorization.slice(7),
              testSecret,
            ) as jwt.JwtPayload;
            httpRequest.user = {
              userId: String(payload.sub),
              email: String(payload.email),
              role: payload.role as UserRole,
            };
            return true;
          } catch {
            throw new UnauthorizedException();
          }
        },
      })
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => app.close());

  const token = (userId: string, role: UserRole) =>
    jwt.sign({ sub: userId, email: `${role}@example.com`, role }, testSecret);
  const authorization = (userId: string, role: UserRole) => ({
    Authorization: `Bearer ${token(userId, role)}`,
  });
  const coursePayload = {
    nome: 'Curso de TypeScript',
    descricao: 'Fundamentos',
    carga_horaria: 12,
    categoria: 'Tecnologia',
    nivel: 'Iniciante',
  };
  const lessonPayload = {
    titulo: 'Introdução',
    url_video: 'https://youtu.be/dQw4w9WgXcQ',
    duracao_minutos: 10,
  };

  const createOwnedCourse = async () => {
    await request(app.getHttpServer())
      .post('/cursos')
      .set(authorization(professorId, UserRole.PROFESSOR))
      .send(coursePayload)
      .expect(201)
      .expect(({ body }) =>
        expect(body).toMatchObject({
          ...coursePayload,
          id_instrutor: professorId,
        }),
      );
  };

  it('permite CRUD ao professor proprietário e mantém leituras públicas', async () => {
    await createOwnedCourse();
    await request(app.getHttpServer()).get('/cursos').expect(200);
    await request(app.getHttpServer()).get(`/cursos/${courseId}`).expect(200);
    await request(app.getHttpServer())
      .patch(`/cursos/${courseId}`)
      .set(authorization(professorId, UserRole.PROFESSOR))
      .send({ nome: 'Curso atualizado' })
      .expect(200);
    await request(app.getHttpServer())
      .delete(`/cursos/${courseId}`)
      .set(authorization(professorId, UserRole.PROFESSOR))
      .expect(204);
  });

  it('bloqueia escritas sem token', async () => {
    await request(app.getHttpServer())
      .post('/cursos')
      .send(coursePayload)
      .expect(401);
    await request(app.getHttpServer())
      .patch(`/cursos/${courseId}`)
      .send({ nome: 'Novo nome' })
      .expect(401);
  });

  it('bloqueia aluno autenticado', async () => {
    await request(app.getHttpServer())
      .post('/cursos')
      .set(authorization(studentId, UserRole.ALUNO))
      .send(coursePayload)
      .expect(403);
  });

  it('bloqueia outro professor e permite administrador', async () => {
    await createOwnedCourse();
    await request(app.getHttpServer())
      .patch(`/cursos/${courseId}`)
      .set(authorization(otherProfessorId, UserRole.PROFESSOR))
      .send({ nome: 'Não permitido' })
      .expect(403);
    await request(app.getHttpServer())
      .patch(`/cursos/${courseId}`)
      .set(authorization(adminId, UserRole.ADMIN))
      .send({ nome: 'Atualizado pelo admin' })
      .expect(200);
    await request(app.getHttpServer())
      .delete(`/cursos/${courseId}`)
      .set(authorization(adminId, UserRole.ADMIN))
      .expect(204);
  });

  it('rejeita payload e UUID inválidos', async () => {
    await request(app.getHttpServer())
      .post('/cursos')
      .set(authorization(professorId, UserRole.PROFESSOR))
      .send({ nome: '', carga_horaria: -1 })
      .expect(400);
    await request(app.getHttpServer()).get('/cursos/id-invalido').expect(400);
  });

  it('retorna 404 para UUID válido inexistente', async () => {
    await request(app.getHttpServer()).get(`/cursos/${missingId}`).expect(404);
  });

  it('aplica papéis e propriedade nas escritas de aulas', async () => {
    await createOwnedCourse();
    const lessonsUrl = `/cursos/${courseId}/aulas`;

    await request(app.getHttpServer()).get(lessonsUrl).expect(200, []);
    await request(app.getHttpServer())
      .post(lessonsUrl)
      .send(lessonPayload)
      .expect(401);
    await request(app.getHttpServer())
      .post(lessonsUrl)
      .set(authorization(studentId, UserRole.ALUNO))
      .send(lessonPayload)
      .expect(403);
    await request(app.getHttpServer())
      .post(lessonsUrl)
      .set(authorization(otherProfessorId, UserRole.PROFESSOR))
      .send(lessonPayload)
      .expect(403);

    await request(app.getHttpServer())
      .post(lessonsUrl)
      .set(authorization(professorId, UserRole.PROFESSOR))
      .send(lessonPayload)
      .expect(201)
      .expect(({ body }) =>
        expect(body).toMatchObject({
          titulo: lessonPayload.titulo,
          id_instrutor: professorId,
        }),
      );
    await request(app.getHttpServer())
      .patch(`${lessonsUrl}/${lessonId}`)
      .send({ titulo: 'Sem token' })
      .expect(401);
    await request(app.getHttpServer())
      .patch(`${lessonsUrl}/${lessonId}`)
      .set(authorization(studentId, UserRole.ALUNO))
      .send({ titulo: 'Aluno não pode editar' })
      .expect(403);
    await request(app.getHttpServer())
      .delete(`${lessonsUrl}/${lessonId}`)
      .set(authorization(studentId, UserRole.ALUNO))
      .expect(403);
    await request(app.getHttpServer())
      .patch(`${lessonsUrl}/${lessonId}`)
      .set(authorization(otherProfessorId, UserRole.PROFESSOR))
      .send({ titulo: 'Outro professor não pode editar' })
      .expect(403);
    await request(app.getHttpServer())
      .delete(`${lessonsUrl}/${lessonId}`)
      .set(authorization(otherProfessorId, UserRole.PROFESSOR))
      .expect(403);
    await request(app.getHttpServer())
      .patch(`${lessonsUrl}/${lessonId}`)
      .set(authorization(professorId, UserRole.PROFESSOR))
      .send({ titulo: 'Introdução atualizada' })
      .expect(200);
    await request(app.getHttpServer())
      .delete(`${lessonsUrl}/${lessonId}`)
      .set(authorization(professorId, UserRole.PROFESSOR))
      .expect(204);

    await request(app.getHttpServer())
      .post(lessonsUrl)
      .set(authorization(adminId, UserRole.ADMIN))
      .send(lessonPayload)
      .expect(201);
    await request(app.getHttpServer())
      .delete(`${lessonsUrl}/${lessonId}`)
      .set(authorization(adminId, UserRole.ADMIN))
      .expect(204);
  });
});
