import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthenticatedUser } from '../auth/authenticated-user.interface';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../auth/user-role.enum';
import { CreateTrilhaDto } from './dto/create-trilha.dto';
import { TrilhasService } from './trilhas.service';

@Controller('trilhas')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ALUNO, UserRole.PROFESSOR, UserRole.ADMIN)
export class TrilhasController {
  constructor(private readonly trilhasService: TrilhasService) {}

  @Get()
  findAll(@Req() request: Request & { user: AuthenticatedUser }) {
    return this.trilhasService.findAll(request.user);
  }

  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    return this.trilhasService.findOne(id, request.user);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() input: CreateTrilhaDto) {
    return this.trilhasService.create(input);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.trilhasService.remove(id);
  }
}
