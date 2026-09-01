import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Curso } from './curso.entity';
import { CursosController } from './cursos.controller';
import { CursosService } from './cursos.service';
import { Aula } from './aula.entity';
import { AulasController } from './aulas.controller';
import { AulasService } from './aulas.service';

@Module({
  imports: [TypeOrmModule.forFeature([Curso, Aula])],
  controllers: [CursosController, AulasController],
  providers: [CursosService, AulasService],
})
export class CursosModule {}
