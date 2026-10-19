import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../auth/user-role.enum';
import { User } from '../auth/user.entity';

export interface AdminUserSummary {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  is_verified: boolean;
}

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(page: number, limit: number) {
    const [users, total] = await this.userRepository.findAndCount({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        is_verified: true,
      },
      order: { name: 'ASC', id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const items: AdminUserSummary[] = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      is_verified: user.is_verified,
    }));

    return { items, page, limit, total };
  }
}
