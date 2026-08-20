import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/* --- Guardião de autenticação JWT --- */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
