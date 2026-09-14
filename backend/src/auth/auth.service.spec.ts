import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { QueryFailedError, Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { MailService } from './mail.service';
import { User } from './user.entity';
import { UserRole } from './user-role.enum';
import { Address } from './address.entity';
import { CepAddress, CepService } from './cep.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let sign: jest.Mock;
  let repository: jest.Mocked<
    Pick<Repository<User>, 'findOne' | 'save' | 'create' | 'update'>
  >;
  let addressRepository: jest.Mocked<
    Pick<Repository<Address>, 'save' | 'create'>
  >;
  let mailService: jest.Mocked<
    Pick<MailService, 'sendVerificationCode' | 'sendPasswordResetCode'>
  >;
  let cepService: jest.Mocked<Pick<CepService, 'findAddress'>>;

  const cepAddress: CepAddress = {
    cep: '01001000',
    rua: 'Praça da Sé',
    bairro: 'Sé',
    cidade: 'São Paulo',
    uf: 'SP',
    estado: 'São Paulo',
    complemento: 'lado ímpar',
  };

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
    phone: null,
    avatar: null,
    role: UserRole.ALUNO,
    must_change_email: false,
    must_change_password: false,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    sign = jest.fn(() => 'signed-token');
    repository = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    repository.save.mockImplementation((user) => Promise.resolve(user));
    addressRepository = {
      save: jest.fn(),
      create: jest.fn((data) => data as Address),
    };
    addressRepository.save.mockImplementation((address) =>
      Promise.resolve(address),
    );
    Object.assign(repository, {
      manager: {
        transaction: jest.fn(
          async (
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
        ),
      },
    });
    mailService = {
      sendVerificationCode: jest.fn(),
      sendPasswordResetCode: jest.fn(),
    };
    cepService = {
      findAddress: jest.fn().mockResolvedValue(cepAddress),
    };
    service = new AuthService(
      { sign } as unknown as JwtService,
      repository as unknown as Repository<User>,
      addressRepository as unknown as Repository<Address>,
      mailService as unknown as MailService,
      cepService as unknown as CepService,
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
    (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
    repository.findOne.mockResolvedValue(user);
    repository.update.mockResolvedValue({
      affected: 1,
      generatedMaps: [],
      raw: [],
    });

    await expect(
      service.resetPassword(user.email, '123456', 'NovaSenha1!'),
    ).resolves.toEqual({ message: 'Senha alterada com sucesso.' });

    expect(repository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: user.id,
        is_verified: true,
        password_reset_code: '123456',
      }),
      {
        password_hash: 'new-hash',
        password_reset_code: null,
        password_reset_expires_at: null,
      },
    );
  });

  it.each([
    ['wrong code', '654321'],
    ['expired code', '123456'],
  ])('rejects a reset with %s', async (_case, code) => {
    repository.findOne.mockResolvedValue(null);

    await expect(
      service.resetPassword('user@example.com', code, 'NovaSenha1!'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(bcrypt.hash).not.toHaveBeenCalled();
    expect(repository.update).not.toHaveBeenCalled();
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
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          cpf: user.cpf,
          phone: user.phone,
          role,
          mustChangeEmail: false,
          mustChangePassword: false,
        },
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
    repository.findOne.mockResolvedValueOnce(null).mockResolvedValue(user);
    jest.mocked(bcrypt.hash).mockResolvedValue('hash' as never);
    jest.mocked(bcrypt.compare).mockResolvedValue(true as never);

    await service.register(
      user.name,
      ' USER@example.com ',
      'Password1!',
      user.cpf,
      cepAddress.cep,
    );
    expect(repository.create).toHaveBeenCalledWith({
      name: user.name,
      email: user.email,
      password_hash: 'hash',
      cpf: user.cpf,
    });
    expect(user.verification_code).toMatch(/^\d{6}$/);
    expect(cepService.findAddress).toHaveBeenCalledWith(cepAddress.cep);
    expect(addressRepository.create).toHaveBeenCalledWith({
      id_usuario: user.id,
      ...cepAddress,
    });
    expect(addressRepository.save).toHaveBeenCalledWith({
      id_usuario: user.id,
      ...cepAddress,
    });
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

  it('returns conflict when the registration email already exists', async () => {
    repository.findOne.mockResolvedValue(makeUser());

    await expect(
      service.register(
        'Outro usuário',
        ' USER@example.com ',
        'Password1!',
        '98765432100',
        cepAddress.cep,
      ),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(bcrypt.hash).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
    expect(mailService.sendVerificationCode).not.toHaveBeenCalled();
  });

  it('maps a concurrent unique-email violation to conflict', async () => {
    const user = makeUser({ is_verified: false });
    const driverError = Object.assign(new Error('duplicate key'), {
      code: '23505',
    });
    repository.findOne.mockResolvedValue(null);
    repository.create.mockReturnValue(user);
    repository.save.mockRejectedValue(
      new QueryFailedError('INSERT INTO users', [], driverError),
    );
    jest.mocked(bcrypt.hash).mockResolvedValue('hash' as never);

    await expect(
      service.register(
        user.name,
        user.email,
        'Password1!',
        user.cpf,
        cepAddress.cep,
      ),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(mailService.sendVerificationCode).not.toHaveBeenCalled();
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
    jest.mocked(bcrypt.hash).mockResolvedValue('new-hash' as never);
    repository.findOne.mockResolvedValueOnce(user).mockResolvedValueOnce(null);
    repository.update.mockResolvedValueOnce({
      affected: 1,
      generatedMaps: [],
      raw: [],
    });
    await service.resetPassword(user.email, '123456', 'Password1!');
    await expect(
      service.resetPassword(user.email, '123456', 'OtherPass1!'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(bcrypt.hash).toHaveBeenCalledTimes(1);
  });

  it('allows exactly one concurrent reset with the same code', async () => {
    const user = makeUser({
      password_reset_code: '123456',
      password_reset_expires_at: new Date(Date.now() + 60_000),
    });
    jest.mocked(bcrypt.hash).mockResolvedValue('new-hash' as never);
    repository.findOne.mockResolvedValue(user);
    repository.update
      .mockResolvedValueOnce({ affected: 1, generatedMaps: [], raw: [] })
      .mockResolvedValueOnce({ affected: 0, generatedMaps: [], raw: [] });

    const results = await Promise.allSettled([
      service.resetPassword('user@example.com', '123456', 'Password1!'),
      service.resetPassword('user@example.com', '123456', 'OtherPass1!'),
    ]);

    expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(
      1,
    );
    expect(results.filter(({ status }) => status === 'rejected')).toHaveLength(
      1,
    );
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
      repository.findOne.mockResolvedValue(null);
      await expect(
        service.resetPassword(user.email, code, 'Password1!'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(bcrypt.hash).not.toHaveBeenCalled();
    } finally {
      clock.mockRestore();
    }
  });
});
