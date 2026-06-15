import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // 🔹 REGISTRO REAL (salva no banco)
  async register(name: string, email: string, password: string, cpf: string) {
    const hash = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      name,
      email,
      password_hash: hash,
      cpf,
    });

    await this.userRepository.save(user);

    return {
      id: user.id,
      email: user.email,
    };
  }

  // 🔹 LOGIN REAL
  async login(email: string, password: string) {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password_hash, //  password.hash é a senha
    );

    if (!isMatch) {
      throw new UnauthorizedException('Senha inválida');
    }

    const payload = { sub: user.id, email: user.email };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }
}
