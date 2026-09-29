import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module'; //importa o módulo de autentificação
import { TypeOrmModule } from '@nestjs/typeorm'; //integra o TypeORM ao NestJS, permitindo conexão com banco de dados
import { User } from './auth/user.entity'; //entidade que representa o banco de dados
import { CursosModule } from './cursos/cursos.module';
import { Curso } from './cursos/curso.entity';
import { Aula } from './cursos/aula.entity';
import { UsuariosModule } from './usuarios/usuarios.module';
import { Trilha } from './trilhas/trilha.entity';
import { TrilhaCurso } from './trilhas/trilha-curso.entity';
import { UsuarioTrilha } from './trilhas/usuario-trilha.entity';
import { TrilhasModule } from './trilhas/trilhas.module';
import { Address } from './auth/address.entity';
import { Matricula } from './jornada/matricula.entity';
import { ProgressoAula } from './jornada/progresso-aula.entity';
import { JornadaModule } from './jornada/jornada.module';
import { Certificado } from './certificados/certificado.entity';
import { CertificadosModule } from './certificados/certificados.module';
import { PlaybackSession } from './jornada/playback-session.entity';
import { APP_FILTER } from '@nestjs/core';
import { ApiExceptionFilter } from './common/api-exception.filter';
import {
  AlternativaQuestionario,
  PerguntaQuestionario,
  Questionario,
  RespostaQuestionario,
  TentativaQuestionario,
} from './cursos/questionario.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USER ?? 'postgres',
      password: process.env.DB_PASSWORD ?? '',
      database: process.env.DB_NAME ?? 'plataforma_ead',
      ssl:
        process.env.DB_SSL === 'true'
          ? { rejectUnauthorized: false }
          : false,
      extra: {
        max: Number(process.env.DB_POOL_MAX ?? 5),
      },
      entities: [
        User,
        Address,
        Curso,
        Aula,
        Trilha,
        TrilhaCurso,
        UsuarioTrilha,
        Matricula,
        ProgressoAula,
        Certificado,
        PlaybackSession,
        Questionario,
        PerguntaQuestionario,
        AlternativaQuestionario,
        TentativaQuestionario,
        RespostaQuestionario,
      ],
      synchronize: process.env.DB_SYNCHRONIZE === 'true',
    }),
    AuthModule,
    CursosModule,
    UsuariosModule,
    TrilhasModule,
    JornadaModule,
    CertificadosModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
  ],
})
export class AppModule {}
