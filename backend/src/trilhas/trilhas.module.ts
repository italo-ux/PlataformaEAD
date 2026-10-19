import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesGuard } from '../auth/roles.guard';
import { Curso } from '../cursos/curso.entity';
import { TrilhaCurso } from './trilha-curso.entity';
import { Trilha } from './trilha.entity';
import { TrilhasController } from './trilhas.controller';
import { TrilhasService } from './trilhas.service';

@Module({
  imports: [TypeOrmModule.forFeature([Trilha, TrilhaCurso, Curso])],
  controllers: [TrilhasController],
  providers: [TrilhasService, RolesGuard],
})
export class TrilhasModule {}
