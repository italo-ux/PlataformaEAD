/* --- Estratégia JWT --- */

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Extrai o token do header Authorization: Bearer <token>
      ignoreExpiration: false, // Não ignora expiração, ou seja, tokens vencidos não são aceitos
      secretOrKey: process.env.JWT_SECRET, // Usa a chave secreta definida em variável de ambiente
    });
  }

  async validate(payload: any) {
    // payload é o conteúdo do token (ex.: sub, email)
    // retorna os dados que vão ficar disponíveis no request.user
    return { userId: payload.sub, email: payload.email };
  }
}
