import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { MailService } from './mail.service';
import { User } from './user.entity';
import { UserRole } from './user-role.enum';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let sign: jest.Mock;
  let repository: jest.Mocked<
    Pick<Repository<User>, 'findOne' | 'save' | 'create'>
  >;
  let mailService: jest.Mocked<
    Pick<MailService, 'sendVerificationCode' | 'sendPasswordResetCode'>
  >;

  const makeUser = (overrides: Partial<User> = {}): User => ({
    id: 'user-1',
    name: 'Usuário',
    email: 'user@example.com',
    password_hash: 'old-hash',
    is_verified: true,
    verification_code: null,
    password_reset_code: null,
    password_reset_expires_at: null,
    cpf: '12345678901',
    role: UserRole.ALUNO,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    sign = jest.fn(() => 'signed-token');
    repository = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };
    mailService = {
      sendVerificationCode: jest.fn(),
      sendPasswordResetCode: jest.fn(),
    };
    service = new AuthService(
      { sign } as unknown as JwtService,
      repository as unknown as Repository<User>,
      mailService as unknown as MailService,
    );
  });

  it('returns a generic recovery response for an unknown email', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(
      service.forgotPassword('missing@example.com'),
    ).resolves.toEqual({
      message: 'Se o e-mail estiver cadastrado, um código será enviado.',
    });
    expect(repository.save).not.toHaveBeenCalled();
    expect(mailService.sendPasswordResetCode).not.toHaveBeenCalled();
  });

  it('creates an expiring password reset code for a verified user', async () => {
    const user = makeUser();
    repository.findOne.mockResolvedValue(user);

    await service.forgotPassword('USER@example.com');

    expect(user.password_reset_code).toMatch(/^\d{6}$/);
    expect(user.password_reset_expires_at?.getTime()).toBeGreaterThan(
      Date.now(),
    );
    expect(repository.save).toHaveBeenCalledWith(user);
    expect(mailService.sendPasswordResetCode).toHaveBeenCalledWith(
      user.email,
      user.password_reset_code,
    );
  });

  it('resends verification only for an unverified user', async () => {
    const user = makeUser({ is_verified: false });
    repository.findOne.mockResolvedValue(user);

    await service.resendVerification(user.email);

    expect(user.verification_code).toMatch(/^\d{6}$/);
    expect(repository.save).toHaveBeenCalledWith(user);
    expect(mailService.sendVerificationCode).toHaveBeenCalledWith(
      user.email,
      user.verification_code,
    );
  });

  it('does not reveal that a verified account cannot receive verification codes', async () => {
    repository.findOne.mockResolvedValue(makeUser());

    await expect(
      service.resendVerification('user@example.com'),
    ).resolves.toEqual({
      message: 'Se a conta estiver pendente, um novo código será enviado.',
    });
    expect(mailService.sendVerificationCode).not.toHaveBeenCalled();
  });

  it('resets the password and consumes a valid code', async () => {
    const user = makeUser({
      password_reset_code: '123456',
      password_reset_expires_at: new Date(Date.now() + 60_000),
    });
    repository.findOne.mockResolvedValue(user);
    (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');

    await expect(
      service.resetPassword(user.email, '123456', 'NovaSenha1!'),
    ).resolves.toEqual({ message: 'Senha alterada com sucesso.' });

    expect(user.password_hash).toBe('new-hash');
    expect(user.password_reset_code).toBeNull();
    expect(user.password_reset_expires_at).toBeNull();
    expect(repository.save).toHaveBeenCalledWith(user);
  });

  it.each([
    ['wrong code', '654321', new Date(Date.now() + 60_000)],
    ['expired code', '123456', new Date(Date.now() - 60_000)],
  ])('rejects a reset with %s', async (_case, code, expiresAt) => {
    repository.findOne.mockResolvedValue(
      makeUser({
        password_reset_code: '123456',
        password_reset_expires_at: expiresAt,
      }),
    );

    await expect(
      service.resetPassword('user@example.com', code, 'NovaSenha1!'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.save).not.toHaveBeenCalled();
  });
  it.each([UserRole.ALUNO, UserRole.PROFESSOR, UserRole.ADMIN])(
    'returns the persisted %s role at login',
    async (role) => {
      const user = makeUser({ role });
      repository.findOne.mockResolvedValue(user);
      jest.mocked(bcrypt.compare).mockResolvedValue(true as never);
      await expect(
        service.login(' USER@example.com ', 'Password1!'),
      ).resolves.toEqual({
        access_token: 'signed-token',
        user: { id: user.id, name: user.name, email: user.email, role },
      });
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: user.email },
      });
      expect(sign).toHaveBeenCalledWith({ sub: user.id, email: user.email });
    },
  );

  it('registers, verifies once and then allows login', async () => {
    const user = makeUser({ is_verified: false });
    repository.create.mockReturnValue(user);
    repository.findOne.mockResolvedValue(user);
    jest.mocked(bcrypt.hash).mockResolvedValue('hash' as never);
    jest.mocked(bcrypt.compare).mockResolvedValue(true as never);

    await service.register(
      user.name,
      ' USER@example.com ',
      'Password1!',
      user.cpf,
    );
    expect(repository.create).toHaveBeenCalledWith({
      name: user.name,
      email: user.email,
      password_hash: 'hash',
      cpf: user.cpf,
    });
    expect(user.verification_code).toMatch(/^\d{6}$/);
    await expect(
      service.login(user.email, 'Password1!'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    const code = user.verification_code!;
    await expect(
      service.verifyEmail(user.email, 'wrong'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await service.verifyEmail(user.email, code);
    expect(user.verification_code).toBeNull();
    expect(user.is_verified).toBe(true);
    await expect(service.verifyEmail(user.email, code)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(
      service.login(user.email, 'Password1!'),
    ).resolves.toHaveProperty('access_token');
  });

  it('rejects incorrect passwords', async () => {
    repository.findOne.mockResolvedValue(makeUser());
    jest.mocked(bcrypt.compare).mockResolvedValue(false as never);
    await expect(
      service.login('user@example.com', 'wrong'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(sign).not.toHaveBeenCalled();
  });

  it('does not reveal an unknown account when resending verification', async () => {
    repository.findOne.mockResolvedValue(null);
    await expect(
      service.resendVerification('missing@example.com'),
    ).resolves.toEqual({
      message: 'Se a conta estiver pendente, um novo código será enviado.',
    });
    expect(mailService.sendVerificationCode).not.toHaveBeenCalled();
  });

  it('does not send recovery codes to unverified accounts', async () => {
    repository.findOne.mockResolvedValue(makeUser({ is_verified: false }));
    await expect(service.forgotPassword('user@example.com')).resolves.toEqual({
      message: 'Se o e-mail estiver cadastrado, um código será enviado.',
    });
    expect(repository.save).not.toHaveBeenCalled();
    expect(mailService.sendPasswordResetCode).not.toHaveBeenCalled();
  });

  it('rejects a consumed recovery code', async () => {
    const user = makeUser({
      password_reset_code: '123456',
      password_reset_expires_at: new Date(Date.now() + 60_000),
    });
    repository.findOne.mockResolvedValue(user);
    jest.mocked(bcrypt.hash).mockResolvedValue('new-hash' as never);
    await service.resetPassword(user.email, '123456', 'Password1!');
    await expect(
      service.resetPassword(user.email, '123456', 'OtherPass1!'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(bcrypt.hash).toHaveBeenCalledTimes(1);
  });

  it('expires recovery codes at exactly fifteen minutes', async () => {
    const now = Date.now();
    const clock = jest.spyOn(Date, 'now').mockReturnValue(now);
    try {
      const user = makeUser();
      repository.findOne.mockResolvedValue(user);
      await service.forgotPassword(user.email);
      expect(user.password_reset_expires_at?.getTime()).toBe(now + 15 * 60_000);
      const code = user.password_reset_code!;
      clock.mockReturnValue(now + 15 * 60_000);
      await expect(
        service.resetPassword(user.email, code, 'Password1!'),
      ).rejects.toBeInstanceOf(BadRequestException);
    } finally {
      clock.mockRestore();
    }
  });
});
