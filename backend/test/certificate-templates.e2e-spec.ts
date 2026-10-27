/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import {
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AuthenticatedUser } from '../src/auth/authenticated-user.interface';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { RolesGuard } from '../src/auth/roles.guard';
import { UserRole } from '../src/auth/user-role.enum';
import { CertificateTemplatesController } from '../src/certificados/certificate-templates.controller';
import { CertificateTemplatesService } from '../src/certificados/certificate-templates.service';

const templateId = '11111111-1111-4111-8111-111111111111';
const payload = {
  name: 'Modelo institucional',
  eyebrow: 'Instituição',
  title: 'Certificado',
  body: '{aluno} concluiu {curso}.',
  signature: 'Coordenação',
  primaryColor: '#112233',
  accentColor: '#445566',
  logos: [],
  signatures: [],
};

describe('Certificate templates authorization (e2e)', () => {
  let app: INestApplication;
  const templates = {
    list: jest.fn().mockResolvedValue([]),
    create: jest
      .fn()
      .mockImplementation((input) =>
        Promise.resolve({ id: templateId, isDefault: true, ...input }),
      ),
    update: jest
      .fn()
      .mockImplementation((id, input) =>
        Promise.resolve({ id, isDefault: true, ...input }),
      ),
    setDefault: jest.fn().mockResolvedValue({
      id: templateId,
      isDefault: true,
      ...payload,
    }),
    sync: jest.fn().mockResolvedValue({ imported: 0, skipped: 1 }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      controllers: [CertificateTemplatesController],
      providers: [
        RolesGuard,
        { provide: CertificateTemplatesService, useValue: templates },
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
          const role = httpRequest.headers.authorization?.replace(
            /^Bearer /,
            '',
          ) as UserRole | undefined;
          if (!role || !Object.values(UserRole).includes(role)) {
            throw new UnauthorizedException();
          }
          httpRequest.user = {
            userId: 'actor-id',
            email: `${role}@example.com`,
            role,
          };
          return true;
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

  afterEach(async () => {
    await app.close();
  });

  const as = (role: UserRole) => ({ Authorization: `Bearer ${role}` });

  it('exige autenticação e bloqueia aluno e professor', async () => {
    await request(app.getHttpServer())
      .get('/admin/modelos-certificado')
      .expect(401);
    await request(app.getHttpServer())
      .get('/admin/modelos-certificado')
      .set(as(UserRole.ALUNO))
      .expect(403);
    await request(app.getHttpServer())
      .post('/admin/modelos-certificado')
      .set(as(UserRole.PROFESSOR))
      .send(payload)
      .expect(403);
  });

  it('permite ao administrador listar, criar, editar e definir o padrão', async () => {
    await request(app.getHttpServer())
      .get('/admin/modelos-certificado')
      .set(as(UserRole.ADMIN))
      .expect(200);
    await request(app.getHttpServer())
      .post('/admin/modelos-certificado')
      .set(as(UserRole.ADMIN))
      .send(payload)
      .expect(201)
      .expect(({ body }) => expect(body.id).toBe(templateId));
    await request(app.getHttpServer())
      .patch(`/admin/modelos-certificado/${templateId}`)
      .set(as(UserRole.ADMIN))
      .send({ ...payload, title: 'Novo título' })
      .expect(200);
    await request(app.getHttpServer())
      .post(`/admin/modelos-certificado/${templateId}/padrao`)
      .set(as(UserRole.ADMIN))
      .expect(201);
  });

  it('mantém a rota de sincronização idempotente distinta da rota por UUID', async () => {
    await request(app.getHttpServer())
      .post('/admin/modelos-certificado/sincronizar')
      .set(as(UserRole.ADMIN))
      .send({
        templates: [{ ...payload, clientId: 'modelo-local', isDefault: true }],
      })
      .expect(201)
      .expect({ imported: 0, skipped: 1 });
    expect(templates.sync).toHaveBeenCalledTimes(1);
  });

  it('rejeita campos extras, UUID inválido e payload incompleto', async () => {
    await request(app.getHttpServer())
      .post('/admin/modelos-certificado')
      .set(as(UserRole.ADMIN))
      .send({ ...payload, unexpected: true })
      .expect(400);
    await request(app.getHttpServer())
      .patch('/admin/modelos-certificado/id-invalido')
      .set(as(UserRole.ADMIN))
      .send(payload)
      .expect(400);
    await request(app.getHttpServer())
      .post('/admin/modelos-certificado')
      .set(as(UserRole.ADMIN))
      .send({ name: '' })
      .expect(400);
  });
});
