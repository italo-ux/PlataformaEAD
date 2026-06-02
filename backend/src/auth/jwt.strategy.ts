import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'sua_chave_secreta',
    });
  }

  async validate(payload: any) {
    // payload é o que você colocou no token (sub, email, etc.)
    return { userId: payload.sub, email: payload.email };
  }
}
