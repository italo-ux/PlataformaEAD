import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';


@Controller('auth') //todas as rotas dessa classe teram o prefixo auth
export class AuthController {
  constructor(private readonly authService: AuthService) {} //o construtor recebe uma instância de AuthService, e cria authservice que ñ pode ser modificada

  @Post('register') ///será chamado quando houver uma requisição
  async register(@Body() body: { email: string; senha: string }) { //método assincrono que processa o registro de usuario
    return this.authService.register(body.email, body.senha);
  }
}
