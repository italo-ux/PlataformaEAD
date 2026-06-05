import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module'; //importa o módulo de autentificação
import { TypeOrmModule } from '@nestjs/typeorm'; //integra o TypeORM ao NestJS, permitindo conexão com banco de dados
import { User } from './auth/user.entity'; //entidade que representa o banco de dados

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'sua_senha',
      database: 'plataformaead',
      entities: [User],
      synchronize: true, // cria/atualiza tabelas automaticamente em dev
    }),
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}