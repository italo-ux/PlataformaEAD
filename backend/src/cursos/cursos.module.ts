import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Curso } from './curso.entity';
import { CursosController } from './cursos.controller';
import { CursosService } from './cursos.service';
import { Aula } from './aula.entity';
import { AulasController } from './aulas.controller';
import { AulasService } from './aulas.service';
import { RolesGuard } from '../auth/roles.guard';
import { Matricula } from '../jornada/matricula.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Curso, Aula, Matricula])],
  controllers: [CursosController, AulasController],
  providers: [CursosService, AulasService, RolesGuard],
  exports: [CursosService],
})
export class CursosModule {}
