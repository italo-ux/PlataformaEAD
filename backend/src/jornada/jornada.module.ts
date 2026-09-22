import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/user.entity';
import { RolesGuard } from '../auth/roles.guard';
import { Certificado } from '../certificados/certificado.entity';
import { Aula } from '../cursos/aula.entity';
import { Curso } from '../cursos/curso.entity';
import { JornadaController } from './jornada.controller';
import { JornadaService } from './jornada.service';
import { Matricula } from './matricula.entity';
import { ProgressoAula } from './progresso-aula.entity';
import { PlaybackSession } from './playback-session.entity';
import { PlaybackService } from './playback.service';
import { ClockService } from './clock.service';
import { QuestionarioService } from './questionario.service';
import {
  AlternativaQuestionario,
  PerguntaQuestionario,
  Questionario,
  RespostaQuestionario,
  TentativaQuestionario,
} from '../cursos/questionario.entity';
import { CursosModule } from '../cursos/cursos.module';

@Module({
  imports: [
    CursosModule,
    TypeOrmModule.forFeature([
      User,
      Curso,
      Aula,
      Matricula,
      ProgressoAula,
      Certificado,
      PlaybackSession,
      Questionario,
      PerguntaQuestionario,
      AlternativaQuestionario,
      TentativaQuestionario,
      RespostaQuestionario,
    ]),
  ],
  controllers: [JornadaController],
  providers: [
    JornadaService,
    PlaybackService,
    QuestionarioService,
    ClockService,
    RolesGuard,
  ],
  exports: [JornadaService],
})
export class JornadaModule {}
