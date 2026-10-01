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
import {
  AlternativaQuestionario,
  PerguntaQuestionario,
  Questionario,
  RespostaQuestionario,
  TentativaQuestionario,
} from './questionario.entity';
import { YoutubeVideoValidationService } from './youtube-video-validation.service';
import { CertificadosModule } from '../certificados/certificados.module';

@Module({
  imports: [
    CertificadosModule,
    TypeOrmModule.forFeature([
      Curso,
      Aula,
      Matricula,
      Questionario,
      PerguntaQuestionario,
      AlternativaQuestionario,
      TentativaQuestionario,
      RespostaQuestionario,
    ]),
  ],
  controllers: [CursosController, AulasController],
  providers: [
    CursosService,
    AulasService,
    YoutubeVideoValidationService,
    RolesGuard,
  ],
  exports: [CursosService, YoutubeVideoValidationService],
})
export class CursosModule {}
