import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { UserRole } from '../auth/user-role.enum';
import { User } from '../auth/user.entity';
import { UsuariosService } from './usuarios.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('UsuariosService', () => {
  let service: UsuariosService;
  let repository: jest.Mocked<
    Pick<Repository<User>, 'findAndCount' | 'findOneBy' | 'save' | 'create'>
  >;

  const makeUser = (overrides: Partial<User> = {}): User => ({
    id: 'user-1',
    name: 'Ana Souza',
    email: 'ana@example.com',
    password_hash: 'old-hash',
    is_verified: true,
    verification_code: null,
    password_reset_code: null,
    password_reset_expires_at: null,
    cpf: '12345678901',
    phone: '11999999999',
    avatar: null,
    role: UserRole.ALUNO,
    must_change_email: false,
    must_change_password: false,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    repository = {
      findAndCount: jest.fn(),
      findOneBy: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };
    service = new UsuariosService(repository as unknown as Repository<User>);
  });

  it('paginates and exposes only the administrative summary', async () => {
    repository.findAndCount.mockResolvedValue([[makeUser()], 12]);

    await expect(service.findAll(2, 5)).resolves.toEqual({
      items: [
        {
          id: 'user-1',
          name: 'Ana Souza',
          email: 'ana@example.com',
          role: UserRole.ALUNO,
          is_verified: true,
        },
      ],
      page: 2,
      limit: 5,
      total: 12,
    });
    expect(repository.findAndCount).toHaveBeenCalledWith({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        is_verified: true,
      },
      order: { name: 'ASC', id: 'ASC' },
      skip: 5,
      take: 5,
    });
  });

  it('persists profile changes and clears the initial email flag only after a new email', async () => {
    const user = makeUser({ must_change_email: true });
    repository.findOneBy.mockResolvedValue(user);
    repository.save.mockImplementation((value) => Promise.resolve(value));

    await service.updateProfile(user.id, {
      name: 'Ana Lima',
      email: 'nova@example.com',
      cpf: '98765432100',
      phone: '11988887777',
    });

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Ana Lima',
        email: 'nova@example.com',
        cpf: '98765432100',
        phone: '11988887777',
        must_change_email: false,
      }),
    );
  });

  it('keeps the initial email flag when the email is unchanged', async () => {
    const user = makeUser({ must_change_email: true });
    repository.findOneBy.mockResolvedValue(user);
    repository.save.mockImplementation((value) => Promise.resolve(value));

    const result = await service.updateProfile(user.id, { email: user.email });

    expect(result.mustChangeEmail).toBe(true);
  });

  it('changes the password and clears its first-access flag', async () => {
    const user = makeUser({ must_change_password: true });
    repository.findOneBy.mockResolvedValue(user);
    repository.save.mockImplementation((value) => Promise.resolve(value));
    jest.mocked(bcrypt.compare).mockResolvedValue(true as never);
    jest.mocked(bcrypt.hash).mockResolvedValue('new-hash' as never);

    const result = await service.changePassword(
      user.id,
      'CurrentPassword1!',
      'NewPassword2!',
    );

    expect(user.password_hash).toBe('new-hash');
    expect(result.mustChangePassword).toBe(false);
    expect(repository.save).toHaveBeenCalledWith(user);
  });

  it('rejects an incorrect current password', async () => {
    repository.findOneBy.mockResolvedValue(makeUser());
    jest.mocked(bcrypt.compare).mockResolvedValue(false as never);

    await expect(
      service.changePassword('user-1', 'wrong', 'NewPassword2!'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it.each([UserRole.PROFESSOR, UserRole.ADMIN])(
    'creates a verified managed %s with a temporary password flag',
    async (role) => {
      const user = makeUser({ role, must_change_password: true });
      repository.create.mockReturnValue(user);
      repository.save.mockResolvedValue(user);
      jest.mocked(bcrypt.hash).mockResolvedValue('managed-hash' as never);

      await expect(
        service.createManagedUser({
          name: user.name,
          email: user.email,
          password: 'Temporary1!',
          cpf: user.cpf,
          role,
        }),
      ).resolves.toEqual({
        id: user.id,
        name: user.name,
        email: user.email,
        role,
        is_verified: true,
      });
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role,
          is_verified: true,
          password_hash: 'managed-hash',
          must_change_email: false,
          must_change_password: true,
        }),
      );
    },
  );
});
