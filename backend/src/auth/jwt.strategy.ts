/* --- Estratégia JWT --- */

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtFromRequestFunction } from 'passport-jwt';

const extractor: JwtFromRequestFunction =
  ExtractJwt.fromAuthHeaderAsBearerToken();
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error('JWT_SECRET deve ser configurado para validar tokens.');
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: extractor,
      ignoreExpiration: false,
      secretOrKey: jwtSecret!,
    });
  }

  validate(payload: { sub: string; email: string }) {
    return { userId: payload.sub, email: payload.email };
  }
}
