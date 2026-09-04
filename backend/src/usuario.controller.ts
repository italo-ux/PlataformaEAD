import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
  UnauthorizedException,
  Delete,
} from '@nestjs/common';
import { AuthService } from './auth/auth.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { ChangePasswordDto } from './auth/dto/change-password.dto';

interface AuthenticatedRequest {
  user: {
    id: string;
    sub?: string;
  };
}

@Controller('usuario')
export class UsuarioController {
  @UseGuards(JwtAuthGuard)
  @Get('perfil')
  getPerfil() {
    return { msg: 'Acesso permitido apenas com token válido!' };
  }
}

@Controller('profile')
export class ProfileController {
  constructor(private readonly authService: AuthService) {}

  // READ: Busca os dados do usuário autenticado
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req: AuthenticatedRequest) {
    return await this.authService.getProfileById(req.user.id);
  }

  /*------------------------------------- Atualiza as informações do perfil -------------------------------------*/
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateProfile(
    @Request() req: AuthenticatedRequest,
    @Body() body: Record<string, any>,
  ) {
    return await this.authService.updateProfileById(req.user.id, body);
  }

  /*------------------------------------- altera a senha -------------------------------------*/
  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  async changePassword(
    @Request() req: AuthenticatedRequest,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const userId = req.user?.id || req.user?.sub;

    if (!userId) {
      throw new UnauthorizedException('Usuário não autenticado.');
    }

    return await this.authService.changePassword(
      userId,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
  }

  /*-------------------- deletar conta -------------------- */
  @UseGuards(JwtAuthGuard)
  @Delete('me')
  async deleteAccount(@Request() req: AuthenticatedRequest) {
    const userId = req.user?.id || req.user?.sub;

    if (!userId) {
      throw new UnauthorizedException('Usuário não autenticado.');
    }

    await this.authService.deleteAccount(userId);

    return { message: 'Conta desativada com sucesso.' };
  }
}
