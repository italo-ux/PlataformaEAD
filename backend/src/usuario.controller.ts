/*--- Cria rota protegida que pode ser acessada com token JTW válido ---*/

import { Controller, Get, UseGuards } from '@nestjs/common'; //useguards aplica uma definição de segurança antes da execução
import { JwtAuthGuard } from './auth/jwt-auth.guard'; //guard q valida se o usuário enviou um JTW valido na header, se não, ele bloqueia

@Controller('usuario') //todas as rotas começam com /usuario
export class UsuarioController {
  @UseGuards(JwtAuthGuard) // nestjs verifica se o JWT é válido
  @Get('perfil') // cria rota
  getPerfil() {
    return { msg: 'Acesso permitido apenas com token válido!' }; //se o token
  }
}
