/* --- Estratégia JWT --- */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtFromRequestFunction } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

const extractor: JwtFromRequestFunction =
  ExtractJwt.fromAuthHeaderAsBearerToken();
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error('JWT_SECRET deve ser configurado para validar tokens.');
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: extractor,
      ignoreExpiration: false,
      secretOrKey: jwtSecret!,
    });
  }

  async validate(payload: { sub: string; email: string }) {
    const user = await this.userRepository.findOneBy({ id: payload.sub });
    if (!user) throw new UnauthorizedException('Usuário não encontrado');

    return { userId: user.id, email: user.email, role: user.role };
  }
}
