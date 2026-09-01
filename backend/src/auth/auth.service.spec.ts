import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { MailService } from './mail.service';
import { User } from './user.entity';
import { UserRole } from './user-role.enum';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  const user: User = {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Professora',
    email: 'professora@example.com',
    password_hash: 'hash',
    is_verified: true,
    verification_code: null,
    cpf: '12345678901',
    role: UserRole.PROFESSOR,
  };
  const repository = {
    findOne: jest.fn(),
  } as unknown as jest.Mocked<Repository<User>>;
  const jwtService = {
    sign: jest.fn(() => 'signed-token'),
  } as unknown as jest.Mocked<JwtService>;
  const mailService = {} as MailService;
  const service = new AuthService(jwtService, repository, mailService);

  beforeEach(() => jest.clearAllMocks());

  it('retorna nome e papel persistido no login', async () => {
    repository.findOne.mockResolvedValue(user);
    jest.mocked(bcrypt.compare).mockResolvedValue(true as never);

    await expect(service.login(user.email, 'senha')).resolves.toEqual({
      access_token: 'signed-token',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: UserRole.PROFESSOR,
      },
    });
  });
});
