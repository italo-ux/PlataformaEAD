import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module'; //importa o módulo de autentificação
import { TypeOrmModule } from '@nestjs/typeorm'; //integra o TypeORM ao NestJS, permitindo conexão com banco de dados
import { User } from './auth/user.entity'; //entidade que representa o banco de dados
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '',
      database: 'plataforma_ead',
      entities: [User],
      synchronize: true, // cria/atualiza tabelas automaticamente em dev
    }),
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
