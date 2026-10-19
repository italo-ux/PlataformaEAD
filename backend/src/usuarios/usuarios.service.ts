import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { QueryFailedError, Repository } from 'typeorm';
import { UserRole } from '../auth/user-role.enum';
import { User } from '../auth/user.entity';
import { CreateManagedUserDto } from './dto/create-managed-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

export interface AdminUserSummary {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  is_verified: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  cpf: string;
  phone: string | null;
  role: UserRole;
  mustChangeEmail: boolean;
  mustChangePassword: boolean;
}

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private toProfile(user: User): UserProfile {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      cpf: user.cpf,
      phone: user.phone,
      role: user.role,
      mustChangeEmail: user.must_change_email,
      mustChangePassword: user.must_change_password,
    };
  }

  private async requireUser(userId: string) {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  private rethrowConflict(error: unknown): never {
    if (
      error instanceof QueryFailedError &&
      (error.driverError as { code?: string }).code === '23505'
    ) {
      throw new ConflictException('Este e-mail já está cadastrado.');
    }
    throw error;
  }

  async findMe(userId: string) {
    return this.toProfile(await this.requireUser(userId));
  }

  async updateProfile(userId: string, profile: UpdateProfileDto) {
    const user = await this.requireUser(userId);
    if (profile.name !== undefined) user.name = profile.name;
    if (profile.cpf !== undefined) user.cpf = profile.cpf;
    if (profile.phone !== undefined) user.phone = profile.phone;
    if (profile.email !== undefined) {
      const nextEmail = profile.email.toLowerCase();
      if (nextEmail !== user.email) {
        user.email = nextEmail;
        user.must_change_email = false;
      }
    }

    try {
      return this.toProfile(await this.userRepository.save(user));
    } catch (error) {
      this.rethrowConflict(error);
    }
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.requireUser(userId);
    if (!(await bcrypt.compare(currentPassword, user.password_hash))) {
      throw new UnauthorizedException('Senha atual inválida');
    }

    user.password_hash = await bcrypt.hash(newPassword, 10);
    user.must_change_password = false;
    return this.toProfile(await this.userRepository.save(user));
  }

  async createManagedUser(input: CreateManagedUserDto) {
    const user = this.userRepository.create({
      name: input.name,
      email: input.email.toLowerCase(),
      password_hash: await bcrypt.hash(input.password, 10),
      cpf: input.cpf,
      role: input.role,
      is_verified: true,
      verification_code: null,
      must_change_email: false,
      must_change_password: true,
    });

    try {
      const saved = await this.userRepository.save(user);
      return {
        id: saved.id,
        name: saved.name,
        email: saved.email,
        role: saved.role,
        is_verified: saved.is_verified,
      };
    } catch (error) {
      this.rethrowConflict(error);
    }
  }

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
