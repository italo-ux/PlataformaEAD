import { Repository } from 'typeorm';
import { UserRole } from '../auth/user-role.enum';
import { User } from '../auth/user.entity';
import { UsuariosService } from './usuarios.service';

describe('UsuariosService', () => {
  it('paginates and exposes only the administrative summary', async () => {
    const repository: jest.Mocked<Pick<Repository<User>, 'findAndCount'>> = {
      findAndCount: jest.fn().mockResolvedValue([
        [
          {
            id: 'user-1',
            name: 'Ana',
            email: 'ana@example.com',
            role: UserRole.ALUNO,
            is_verified: true,
            password_hash: 'secret-hash',
            verification_code: '123456',
            password_reset_code: '654321',
            password_reset_expires_at: new Date(),
            cpf: '12345678901',
          } as User,
        ],
        12,
      ]),
    };
    const service = new UsuariosService(
      repository as unknown as Repository<User>,
    );

    await expect(service.findAll(2, 5)).resolves.toEqual({
      items: [
        {
          id: 'user-1',
          name: 'Ana',
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
});
