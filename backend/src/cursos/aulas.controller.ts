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
import { AulasService } from './aulas.service';
import { CreateAulaDto } from './dto/create-aula.dto';
import { UpdateAulaDto } from './dto/update-aula.dto';

@Controller('cursos/:cursoId/aulas')
export class AulasController {
  constructor(private readonly aulasService: AulasService) {}

  @Get()
  findAll(@Param('cursoId', new ParseUUIDPipe()) cursoId: string) {
    return this.aulasService.findAll(cursoId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESSOR, UserRole.ADMIN)
  create(
    @Param('cursoId', new ParseUUIDPipe()) cursoId: string,
    @Req() request: Request & { user: AuthenticatedUser },
    @Body() createAulaDto: CreateAulaDto,
  ) {
    return this.aulasService.create(cursoId, createAulaDto, request.user);
  }

  @Patch(':aulaId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESSOR, UserRole.ADMIN)
  update(
    @Param('cursoId', new ParseUUIDPipe()) cursoId: string,
    @Param('aulaId', new ParseUUIDPipe()) aulaId: string,
    @Req() request: Request & { user: AuthenticatedUser },
    @Body() updateAulaDto: UpdateAulaDto,
  ) {
    return this.aulasService.update(
      cursoId,
      aulaId,
      updateAulaDto,
      request.user,
    );
  }

  @Delete(':aulaId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESSOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('cursoId', new ParseUUIDPipe()) cursoId: string,
    @Param('aulaId', new ParseUUIDPipe()) aulaId: string,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    await this.aulasService.remove(cursoId, aulaId, request.user);
  }
}
