import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Controller('usuario')
export class UsuarioController {
  @UseGuards(JwtAuthGuard)
  @Get('perfil')
  getPerfil() {
    return { msg: 'Acesso permitido apenas com token válido!' };
  }
}
