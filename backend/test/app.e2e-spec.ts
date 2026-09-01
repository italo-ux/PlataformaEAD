/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
import { UnauthorizedException, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import request from 'supertest';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { Curso } from '../src/cursos/curso.entity';
import { CursosController } from '../src/cursos/cursos.controller';
import { CursosService } from '../src/cursos/cursos.service';

const testSecret = 'e2e-test-secret';
const courseId = '11111111-1111-4111-8111-111111111111';
const missingId = '22222222-2222-4222-8222-222222222222';

describe('Cursos (e2e)', () => {
  let app: INestApplication;
  let courses: Curso[];
  const repository = {
    create: jest.fn(
      (data: Partial<Curso>) => ({ id: courseId, ...data }) as Curso,
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

  beforeEach(async () => {
    courses = [];
    const module = await Test.createTestingModule({
      controllers: [CursosController],
      providers: [
        CursosService,
        { provide: getRepositoryToken(Curso), useValue: repository },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: {
          switchToHttp: () => {
            getRequest: () => { headers: { authorization?: string } };
          };
        }) => {
          const authorization = context.switchToHttp().getRequest()
            .headers.authorization;
          if (!authorization?.startsWith('Bearer '))
            throw new UnauthorizedException();
          try {
            jwt.verify(authorization.slice(7), testSecret);
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

  const token = () =>
    jwt.sign({ sub: 'user-id', email: 'user@example.com' }, testSecret);
  const authorization = () => ({ Authorization: `Bearer ${token()}` });
  const coursePayload = {
    nome: 'Curso de TypeScript',
    descricao: 'Fundamentos',
    carga_horaria: 12,
    categoria: 'Tecnologia',
    nivel: 'Iniciante',
  };

  it('cria, lista, consulta, atualiza e remove um curso', async () => {
    await request(app.getHttpServer())
      .post('/cursos')
      .set(authorization())
      .send(coursePayload)
      .expect(201)
      .expect(({ body }) => expect(body).toMatchObject(coursePayload));
    await request(app.getHttpServer())
      .get('/cursos')
      .expect(200)
      .expect(({ body }) => expect(body).toHaveLength(1));
    await request(app.getHttpServer())
      .get(`/cursos/${courseId}`)
      .expect(200)
      .expect(({ body }) => expect(body.nome).toBe(coursePayload.nome));
    await request(app.getHttpServer())
      .patch(`/cursos/${courseId}`)
      .set(authorization())
      .send({ nome: 'Curso atualizado' })
      .expect(200)
      .expect(({ body }) => expect(body.nome).toBe('Curso atualizado'));
    await request(app.getHttpServer())
      .delete(`/cursos/${courseId}`)
      .set(authorization())
      .expect(204);
    await request(app.getHttpServer()).get(`/cursos/${courseId}`).expect(404);
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
    await request(app.getHttpServer())
      .delete(`/cursos/${courseId}`)
      .expect(401);
  });

  it('rejeita payload e UUID inválidos', async () => {
    await request(app.getHttpServer())
      .post('/cursos')
      .set(authorization())
      .send({ nome: '', carga_horaria: -1 })
      .expect(400);
    await request(app.getHttpServer()).get('/cursos/id-invalido').expect(400);
  });

  it('retorna 404 para UUID válido inexistente', async () => {
    await request(app.getHttpServer()).get(`/cursos/${missingId}`).expect(404);
  });
});
