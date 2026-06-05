/*junta tudo que é necessário para a autenticação JWT no NestJS */
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule, //habilita o uso de AuthGuard
    //configura o módulo JWT, definindo a chave secreta e o tempo de expiração dos tokens:
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default_secret', // depois colocar em .env
      signOptions: { expiresIn: '1h' }, // token expira em 1 hora
    }),
  ],
  controllers: [AuthController], //lista os controlers que pertencem a esse módulo
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
