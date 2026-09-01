import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module'; //importa o módulo de autentificação
import { TypeOrmModule } from '@nestjs/typeorm'; //integra o TypeORM ao NestJS, permitindo conexão com banco de dados
import { User } from './auth/user.entity'; //entidade que representa o banco de dados
import { CursosModule } from './cursos/cursos.module';
import { Curso } from './cursos/curso.entity';
import { Aula } from './cursos/aula.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USER ?? 'postgres',
      password: process.env.DB_PASSWORD ?? '',
      database: process.env.DB_NAME ?? 'plataforma_ead',
      entities: [User, Curso, Aula],
      synchronize: process.env.DB_SYNCHRONIZE === 'true',
    }),
    AuthModule,
    CursosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
