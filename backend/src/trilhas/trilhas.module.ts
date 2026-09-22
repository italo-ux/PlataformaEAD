import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesGuard } from '../auth/roles.guard';
import { Curso } from '../cursos/curso.entity';
import { TrilhaCurso } from './trilha-curso.entity';
import { Trilha } from './trilha.entity';
import { TrilhasController } from './trilhas.controller';
import { TrilhasService } from './trilhas.service';
import { UsuarioTrilha } from './usuario-trilha.entity';
import { CursosModule } from '../cursos/cursos.module';

@Module({
  imports: [
    CursosModule,
    TypeOrmModule.forFeature([Trilha, TrilhaCurso, Curso, UsuarioTrilha]),
  ],
  controllers: [TrilhasController],
  providers: [TrilhasService, RolesGuard],
})
export class TrilhasModule {}
