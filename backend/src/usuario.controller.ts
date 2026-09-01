/*--- Cria rota protegida que pode ser acessada com token JTW válido ---*/
import { Roles } from './auth/decorators/roles.decorator';
import { RolesGuard } from './auth/guards/roles.guard';
import { Role } from './enums/role.enum';
import { Controller, Get, UseGuards } from '@nestjs/common'; //useguards aplica uma definição de segurança antes da execução
import { JwtAuthGuard } from './auth/jwt-auth.guard'; //guard q valida se o usuário enviou um JTW valido na header, se não, ele bloqueia

@Controller('usuario') //todas as rotas começam com /usuario
export class UsuarioController {
  @UseGuards(JwtAuthGuard) // nestjs verifica se o JWT é válido
  @Get('perfil') // cria rota
  getPerfil() {
    return { msg: 'Acesso permitido apenas com token válido!' }; //se o token
  }
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async cadastrar(@Body() criarUsuarioDto: CriarUsuarioDto) {
    return this.usuarioService.cadastrar(criarUsuarioDto);
  }
}
@Get('todos')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  async listarTodos() {
    return this.usuarioService.listarTodos();
  }
}
