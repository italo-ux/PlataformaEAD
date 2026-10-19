import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser } from '../auth/authenticated-user.interface';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../auth/user-role.enum';
import { CursosService } from './cursos.service';
import { CreateCursoDto } from './dto/create-curso.dto';
import { UpdateCursoDto } from './dto/update-curso.dto';

@Controller('cursos')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ALUNO, UserRole.PROFESSOR, UserRole.ADMIN)
export class CursosController {
  constructor(private readonly cursosService: CursosService) {}

  @Get()
  findAll(@Req() request: Request & { user: AuthenticatedUser }) {
    return this.cursosService.findAll(request.user);
  }

  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    return this.cursosService.findOne(id, request.user);
  }

  @Post(':id/publicar')
  @Roles(UserRole.PROFESSOR, UserRole.ADMIN)
  publish(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    return this.cursosService.publish(id, request.user);
  }

  @Post()
  @Roles(UserRole.PROFESSOR, UserRole.ADMIN)
  create(
    @Req() request: Request & { user: AuthenticatedUser },
    @Body() createCursoDto: CreateCursoDto,
  ) {
    return this.cursosService.create(createCursoDto, request.user);
  }

  @Patch(':id')
  @Roles(UserRole.PROFESSOR, UserRole.ADMIN)
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() request: Request & { user: AuthenticatedUser },
    @Body() updateCursoDto: UpdateCursoDto,
  ) {
    return this.cursosService.update(id, updateCursoDto, request.user);
  }

  @Delete(':id')
  @Roles(UserRole.PROFESSOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    await this.cursosService.remove(id, request.user);
  }
}
