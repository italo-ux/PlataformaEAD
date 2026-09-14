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
import { ThrottlerModule } from '@nestjs/throttler';
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
import { Address } from '../src/auth/address.entity';
import { CepService } from '../src/auth/cep.service';

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
  let addresses: Map<string, Address>;
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
    cep: '01001000',
  };

  beforeEach(async () => {
    previousSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = secret;
    users = new Map();
    addresses = new Map();
    jest.clearAllMocks();
    const addressRepository = {
      create: (data: Partial<Address>) =>
        ({
          id: randomUUID(),
          created_at: new Date(),
          updated_at: new Date(),
          ...data,
        }) as Address,
      save: (address: Address) => {
        addresses.set(address.id, address);
        return Promise.resolve(address);
      },
    };
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
        phone: null,
        avatar: null,
        must_change_email: false,
        must_change_password: false,
        ...data,
      }),
      save: (user: User) => {
        users.set(user.id, user);
        return Promise.resolve(user);
      },
      findOne: ({
        where,
      }: {
        where: {
          email: string;
          is_verified?: boolean;
          password_reset_code?: string;
          password_reset_expires_at?: { value: Date };
        };
      }) =>
        Promise.resolve(
          [...users.values()].find(
            (user) =>
              user.email === where.email &&
              (where.is_verified === undefined ||
                user.is_verified === where.is_verified) &&
              (where.password_reset_code === undefined ||
                user.password_reset_code === where.password_reset_code) &&
              (where.password_reset_expires_at === undefined ||
                Boolean(
                  user.password_reset_expires_at &&
                  user.password_reset_expires_at >
                    where.password_reset_expires_at.value,
                )),
          ) ?? null,
        ),
      findOneBy: ({ id }: { id: string }) =>
        Promise.resolve(users.get(id) ?? null),
      update: (
        criteria: {
          id: string;
          is_verified: boolean;
          password_reset_code: string;
          password_reset_expires_at: { value: Date };
        },
        partial: Partial<User>,
      ) => {
        const user = users.get(criteria.id);
        const matches =
          user &&
          user.is_verified === criteria.is_verified &&
          user.password_reset_code === criteria.password_reset_code &&
          Boolean(
            user.password_reset_expires_at &&
            user.password_reset_expires_at >
              criteria.password_reset_expires_at.value,
          );
        if (!user || !matches) {
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
    Object.assign(repository, {
      manager: {
        transaction: (
          callback: (manager: {
            save: (entity: User | Address) => Promise<User | Address>;
          }) => Promise<User>,
        ) =>
          callback({
            save: (entity: User | Address) =>
              'email' in entity
                ? repository.save(entity)
                : addressRepository.save(entity),
          }),
      },
    });
    const module = await Test.createTestingModule({
      imports: [
        PassportModule,
        ThrottlerModule.forRoot([{ ttl: 60_000, limit: 10 }]),
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
        { provide: getRepositoryToken(Address), useValue: addressRepository },
        {
          provide: CepService,
          useValue: {
            findAddress: jest.fn().mockResolvedValue({
              cep: input.cep,
              rua: 'Praça da Sé',
              bairro: 'Sé',
              cidade: 'São Paulo',
              uf: 'SP',
              estado: 'São Paulo',
              complemento: null,
            }),
          },
        },
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
    if (app) await app.close();
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
    expect([...addresses.values()][0]).toMatchObject({
      id_usuario: user.id,
      cep: input.cep,
      rua: 'Praça da Sé',
      cidade: 'São Paulo',
      uf: 'SP',
    });
    expect([...addresses.values()][0]).not.toHaveProperty('numero');
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
      cpf: input.cpf,
      phone: null,
      role: UserRole.ALUNO,
      mustChangeEmail: false,
      mustChangePassword: false,
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

  it('rate limits repeated public password reset attempts', async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          email: 'missing@example.com',
          code: '123456',
          password: newPassword,
        })
        .expect(400);
    }

    await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({
        email: 'missing@example.com',
        code: '123456',
        password: newPassword,
      })
      .expect(429);
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

  it('lets an administrator update initial credentials and create professors or admins', async () => {
    const admin = await register();
    await verify(admin);
    admin.role = UserRole.ADMIN;
    admin.must_change_email = true;
    admin.must_change_password = true;

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: admin.email, password })
      .expect(201);
    const loginBody = login.body as {
      access_token: string;
      user: {
        role: UserRole;
        mustChangeEmail: boolean;
        mustChangePassword: boolean;
      };
    };
    expect(loginBody.user).toMatchObject({
      role: UserRole.ADMIN,
      mustChangeEmail: true,
      mustChangePassword: true,
    });
    const token = loginBody.access_token;

    const unchangedProfile = await request(app.getHttpServer())
      .patch('/usuarios/me')
      .auth(token, { type: 'bearer' })
      .send({ email: admin.email })
      .expect(200);
    expect(
      (unchangedProfile.body as { mustChangeEmail: boolean }).mustChangeEmail,
    ).toBe(true);

    const changedEmail = 'admin.changed@example.com';
    await request(app.getHttpServer())
      .patch('/usuarios/me')
      .auth(token, { type: 'bearer' })
      .send({
        name: 'Administrador Alterado',
        email: changedEmail,
        cpf: '98765432100',
        phone: '11988887777',
      })
      .expect(200)
      .expect(({ body }) =>
        expect(body).toMatchObject({
          email: changedEmail,
          mustChangeEmail: false,
          mustChangePassword: true,
        }),
      );

    const changedPassword = await request(app.getHttpServer())
      .patch('/usuarios/me/password')
      .auth(token, { type: 'bearer' })
      .send({ currentPassword: password, newPassword })
      .expect(200);
    expect(
      (changedPassword.body as { mustChangePassword: boolean })
        .mustChangePassword,
    ).toBe(false);

    for (const role of [UserRole.PROFESSOR, UserRole.ADMIN]) {
      const managedEmail = `${role}@example.com`;
      const response = await request(app.getHttpServer())
        .post('/usuarios')
        .auth(token, { type: 'bearer' })
        .send({
          name: `Managed ${role}`,
          email: managedEmail,
          password: 'Temporary3!',
          cpf: role === UserRole.ADMIN ? '11122233344' : '55566677788',
          role,
        })
        .expect(201);
      expect(response.body).toMatchObject({
        email: managedEmail,
        role,
        is_verified: true,
      });

      const managedLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: managedEmail, password: 'Temporary3!' })
        .expect(201);
      expect(
        (managedLogin.body as { user: Record<string, unknown> }).user,
      ).toMatchObject({
        role,
        mustChangeEmail: false,
        mustChangePassword: true,
      });
    }

    const finalLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: changedEmail, password: newPassword })
      .expect(201);
    expect(
      (finalLogin.body as { user: Record<string, unknown> }).user,
    ).toMatchObject({
      mustChangeEmail: false,
      mustChangePassword: false,
    });
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
