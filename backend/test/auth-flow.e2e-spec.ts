import {
  Controller,
  Get,
  INestApplication,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Server } from 'node:http';
import * as jwt from 'jsonwebtoken';
import request from 'supertest';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { JwtStrategy } from '../src/auth/jwt.strategy';
import { MailService } from '../src/auth/mail.service';
import { Roles } from '../src/auth/roles.decorator';
import { RolesGuard } from '../src/auth/roles.guard';
import { UserRole } from '../src/auth/user-role.enum';
import { User } from '../src/auth/user.entity';
import { UsuariosController } from '../src/usuarios/usuarios.controller';
import { UsuariosService } from '../src/usuarios/usuarios.service';

const secret = 'isolated-auth-flow-test-secret';
const password = 'Password1!';
const newPassword = 'NewPassword2!';

@Controller('test-only')
@UseGuards(JwtAuthGuard, RolesGuard)
class ProtectedTestController {
  @Get('manage')
  @Roles(UserRole.PROFESSOR, UserRole.ADMIN)
  manage() {
    return { allowed: true };
  }
}

describe('Integrated auth HTTP flow (no database or SMTP)', () => {
  let app: INestApplication<Server>;
  let users: Map<string, User>;
  let previousSecret: string | undefined;
  const mail = {
    sendVerificationCode: jest.fn(),
    sendPasswordResetCode: jest.fn(),
  };
  const input = {
    name: 'Test User',
    email: 'test@example.com',
    password,
    cpf: '12345678901',
  };

  beforeEach(async () => {
    previousSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = secret;
    users = new Map();
    jest.clearAllMocks();
    const repository = {
      create: (data: Partial<User>): User => ({
        id: randomUUID(),
        name: '',
        email: '',
        password_hash: '',
        cpf: '',
        role: UserRole.ALUNO,
        is_verified: false,
        verification_code: null,
        password_reset_code: null,
        password_reset_expires_at: null,
        ...data,
      }),
      save: (user: User) => {
        users.set(user.id, user);
        return Promise.resolve(user);
      },
      findOne: ({ where }: { where: { email: string } }) =>
        Promise.resolve(
          [...users.values()].find((user) => user.email === where.email) ??
            null,
        ),
      findOneBy: ({ id }: { id: string }) =>
        Promise.resolve(users.get(id) ?? null),
      update: (
        criteria: {
          email: string;
          is_verified: boolean;
          password_reset_code: string;
          password_reset_expires_at: { value: Date };
        },
        partial: Partial<User>,
      ) => {
        const user = [...users.values()].find(
          (candidate) =>
            candidate.email === criteria.email &&
            candidate.is_verified === criteria.is_verified &&
            candidate.password_reset_code === criteria.password_reset_code &&
            Boolean(
              candidate.password_reset_expires_at &&
              candidate.password_reset_expires_at >
                criteria.password_reset_expires_at.value,
            ),
        );
        if (!user) {
          return Promise.resolve({ affected: 0, generatedMaps: [], raw: [] });
        }
        Object.assign(user, partial);
        users.set(user.id, user);
        return Promise.resolve({ affected: 1, generatedMaps: [], raw: [] });
      },
      findAndCount: ({
        skip = 0,
        take = 50,
      }: {
        skip?: number;
        take?: number;
      }) => {
        const sortedUsers = [...users.values()].sort(
          (left, right) =>
            left.name.localeCompare(right.name) ||
            left.id.localeCompare(right.id),
        );
        return Promise.resolve([
          sortedUsers.slice(skip, skip + take),
          sortedUsers.length,
        ]);
      },
    };
    const module = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({ secret, signOptions: { expiresIn: '1h' } }),
      ],
      controllers: [
        AuthController,
        ProtectedTestController,
        UsuariosController,
      ],
      providers: [
        AuthService,
        JwtStrategy,
        RolesGuard,
        UsuariosService,
        { provide: getRepositoryToken(User), useValue: repository },
        { provide: MailService, useValue: mail },
      ],
    }).compile();
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
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  });

  async function register() {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(input)
      .expect(201);
    return [...users.values()][0];
  }

  async function verify(user: User) {
    await request(app.getHttpServer())
      .post('/auth/verify')
      .send({ email: user.email, code: user.verification_code })
      .expect(201);
  }

  it('validates public fields, verifies once and returns a real role and JWT', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ ...input, role: 'admin' })
      .expect(400);
    expect(users.size).toBe(0);
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ ...input, email: ' TEST@example.com ', cpf: '123.456.789-01' })
      .expect(201);
    const user = [...users.values()][0];
    expect(user.email).toBe(input.email);
    expect(user.cpf).toBe(input.cpf);
    expect(user.role).toBe(UserRole.ALUNO);
    await request(app.getHttpServer())
      .post('/auth/login')
      .send(input)
      .expect(400);
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: input.email, password })
      .expect(401);
    await request(app.getHttpServer())
      .post('/auth/verify')
      .send({ email: input.email, code: 'wrong' })
      .expect(400);
    const code = user.verification_code;
    await verify(user);
    await request(app.getHttpServer())
      .post('/auth/verify')
      .send({ email: input.email, code })
      .expect(401);
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: input.email, password })
      .expect(201);
    const body = response.body as {
      access_token: string;
      user: { id: string; role: string };
    };
    expect(body.user).toEqual({
      id: user.id,
      name: input.name,
      email: input.email,
      role: UserRole.ALUNO,
    });
    expect(jwt.verify(body.access_token, secret)).toMatchObject({
      sub: user.id,
    });
  });

  it('returns generic resend/recovery responses and never sends to ineligible accounts', async () => {
    const user = await register();
    mail.sendVerificationCode.mockClear();
    const missing = await request(app.getHttpServer())
      .post('/auth/resend-verification')
      .send({ email: 'missing@example.com' })
      .expect(201);
    const resend = await request(app.getHttpServer())
      .post('/auth/resend-verification')
      .send({ email: user.email })
      .expect(201);
    expect(resend.body).toEqual(missing.body);
    expect(mail.sendVerificationCode).toHaveBeenCalledTimes(1);
    const unknown = await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: 'missing@example.com' })
      .expect(201);
    const pending = await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: user.email })
      .expect(201);
    expect(unknown.body).toEqual(pending.body);
    expect(mail.sendPasswordResetCode).not.toHaveBeenCalled();
    await verify(user);
    const verified = await request(app.getHttpServer())
      .post('/auth/resend-verification')
      .send({ email: user.email })
      .expect(201);
    expect(verified.body).toEqual(missing.body);
    expect(mail.sendVerificationCode).toHaveBeenCalledTimes(1);
  });

  it('resets a password once and permits login only with the new password', async () => {
    const user = await register();
    await verify(user);
    await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: user.email })
      .expect(201);
    const code = user.password_reset_code!;
    const invalid = code === '111111' ? '222222' : '111111';
    await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({ email: user.email, code: invalid, password: newPassword })
      .expect(400);
    const expiry = user.password_reset_expires_at!;
    user.password_reset_expires_at = new Date(0);
    await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({ email: user.email, code, password: newPassword })
      .expect(400);
    user.password_reset_expires_at = expiry;
    await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({ email: user.email, code, password: newPassword })
      .expect(201);
    expect(user.password_reset_code).toBeNull();
    expect(user.password_reset_expires_at).toBeNull();
    await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({ email: user.email, code, password: newPassword })
      .expect(400);
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: user.email, password })
      .expect(401);
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: user.email, password: newPassword })
      .expect(201);
  });

  it('allows exactly one concurrent HTTP reset with the same code', async () => {
    const user = await register();
    await verify(user);
    await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: user.email })
      .expect(201);
    const code = user.password_reset_code!;

    const attempts = await Promise.all([
      request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ email: user.email, code, password: newPassword }),
      request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ email: user.email, code, password: 'AnotherPassword3!' }),
    ]);

    expect(attempts.map(({ status }) => status).sort()).toEqual([201, 400]);
    const acceptedPassword =
      attempts[0].status === 201 ? newPassword : 'AnotherPassword3!';
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: user.email, password: acceptedPassword })
      .expect(201);
  });

  it('lists paginated safe user data only for administrators', async () => {
    const admin = await register();
    await verify(admin);
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: admin.email, password })
      .expect(201);
    const token = (login.body as { access_token: string }).access_token;

    await request(app.getHttpServer()).get('/usuarios').expect(401);
    await request(app.getHttpServer())
      .get('/usuarios')
      .auth(token, { type: 'bearer' })
      .expect(403);
    admin.role = UserRole.PROFESSOR;
    await request(app.getHttpServer())
      .get('/usuarios')
      .auth(token, { type: 'bearer' })
      .expect(403);

    users.set('user-2', {
      ...admin,
      id: 'user-2',
      name: 'Zeta User',
      email: 'zeta@example.com',
      role: UserRole.ALUNO,
    });
    admin.role = UserRole.ADMIN;
    const response = await request(app.getHttpServer())
      .get('/usuarios?page=2&limit=1')
      .auth(token, { type: 'bearer' })
      .expect(200);

    expect(response.body).toEqual({
      items: [
        {
          id: 'user-2',
          name: 'Zeta User',
          email: 'zeta@example.com',
          role: UserRole.ALUNO,
          is_verified: true,
        },
      ],
      page: 2,
      limit: 1,
      total: 2,
    });
    expect(response.text).not.toContain('password_hash');
    expect(response.text).not.toContain('cpf');
    expect(response.text).not.toContain('verification_code');
    await request(app.getHttpServer())
      .get('/usuarios?limit=101')
      .auth(token, { type: 'bearer' })
      .expect(400);
  });

  it('rejects missing/invalid/expired JWTs and uses the current database role', async () => {
    const user = await register();
    await verify(user);
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: user.email, password })
      .expect(201);
    const token = (response.body as { access_token: string }).access_token;
    await request(app.getHttpServer()).get('/test-only/manage').expect(401);
    await request(app.getHttpServer())
      .get('/test-only/manage')
      .auth('invalid', { type: 'bearer' })
      .expect(401);
    await request(app.getHttpServer())
      .get('/test-only/manage')
      .auth(jwt.sign({ sub: user.id }, secret, { expiresIn: -1 }), {
        type: 'bearer',
      })
      .expect(401);
    await request(app.getHttpServer())
      .get('/test-only/manage')
      .auth(token, { type: 'bearer' })
      .expect(403);
    for (const role of [UserRole.PROFESSOR, UserRole.ADMIN]) {
      user.role = role;
      await request(app.getHttpServer())
        .get('/test-only/manage')
        .auth(token, { type: 'bearer' })
        .expect(200);
    }
    users.delete(user.id);
    await request(app.getHttpServer())
      .get('/test-only/manage')
      .auth(token, { type: 'bearer' })
      .expect(401);
  });
});
