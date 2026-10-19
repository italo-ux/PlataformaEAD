import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser } from '../auth/authenticated-user.interface';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../auth/user-role.enum';
import { CreateManagedUserDto } from './dto/create-managed-user.dto';
import { ListUsuariosQueryDto } from './dto/list-usuarios-query.dto';
import { ChangePasswordDto, UpdateProfileDto } from './dto/update-profile.dto';
import { UsuariosService } from './usuarios.service';

@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get('me')
  @Roles(UserRole.ALUNO, UserRole.PROFESSOR, UserRole.ADMIN)
  findMe(@Req() request: Request & { user: AuthenticatedUser }) {
    return this.usuariosService.findMe(request.user.userId);
  }

  @Patch('me')
  @Roles(UserRole.ALUNO, UserRole.PROFESSOR, UserRole.ADMIN)
  updateMe(
    @Req() request: Request & { user: AuthenticatedUser },
    @Body() body: UpdateProfileDto,
  ) {
    return this.usuariosService.updateProfile(request.user.userId, body);
  }

  @Patch('me/password')
  @Roles(UserRole.ALUNO, UserRole.PROFESSOR, UserRole.ADMIN)
  changeMyPassword(
    @Req() request: Request & { user: AuthenticatedUser },
    @Body() body: ChangePasswordDto,
  ) {
    return this.usuariosService.changePassword(
      request.user.userId,
      body.currentPassword,
      body.newPassword,
    );
  }

  @Post()
  createManagedUser(@Body() body: CreateManagedUserDto) {
    return this.usuariosService.createManagedUser(body);
  }

  @Get()
  findAll(@Query() query: ListUsuariosQueryDto) {
    return this.usuariosService.findAll(query.page, query.limit);
  }
}
