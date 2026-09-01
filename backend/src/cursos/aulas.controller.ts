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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
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
  @UseGuards(JwtAuthGuard)
  create(
    @Param('cursoId', new ParseUUIDPipe()) cursoId: string,
    @Req() request: Request & { user: { userId: string } },
    @Body() createAulaDto: CreateAulaDto,
  ) {
    return this.aulasService.create(
      cursoId,
      request.user.userId,
      createAulaDto,
    );
  }

  @Patch(':aulaId')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('cursoId', new ParseUUIDPipe()) cursoId: string,
    @Param('aulaId', new ParseUUIDPipe()) aulaId: string,
    @Body() updateAulaDto: UpdateAulaDto,
  ) {
    return this.aulasService.update(cursoId, aulaId, updateAulaDto);
  }

  @Delete(':aulaId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('cursoId', new ParseUUIDPipe()) cursoId: string,
    @Param('aulaId', new ParseUUIDPipe()) aulaId: string,
  ) {
    await this.aulasService.remove(cursoId, aulaId);
  }
}
