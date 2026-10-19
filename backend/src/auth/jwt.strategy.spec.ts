import { UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { JwtStrategy } from './jwt.strategy';
import { User } from './user.entity';
import { UserRole } from './user-role.enum';

describe('JwtStrategy', () => {
  const previousSecret = process.env.JWT_SECRET;
  const findOneBy = jest.fn();
  const repository = { findOneBy } as unknown as Repository<User>;

  beforeAll(() => {
    process.env.JWT_SECRET = 'jwt-strategy-test-secret';
  });

  afterAll(() => {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  });

  beforeEach(() => jest.clearAllMocks());

  it('recarrega email e papel atuais do usuário no banco', async () => {
    const user = {
      id: '11111111-1111-4111-8111-111111111111',
      email: 'atual@example.com',
      role: UserRole.PROFESSOR,
    } as User;
    findOneBy.mockResolvedValue(user);
    const strategy = new JwtStrategy(repository);

    await expect(
      strategy.validate({ sub: user.id, email: 'antigo@example.com' }),
    ).resolves.toEqual({
      userId: user.id,
      email: user.email,
      role: UserRole.PROFESSOR,
    });
    expect(findOneBy).toHaveBeenCalledWith({ id: user.id });
  });

  it('rejeita token cujo usuário não existe mais', async () => {
    findOneBy.mockResolvedValue(null);
    const strategy = new JwtStrategy(repository);

    await expect(
      strategy.validate({
        sub: '22222222-2222-4222-8222-222222222222',
        email: 'removido@example.com',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
