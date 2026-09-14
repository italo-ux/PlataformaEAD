/*junta tudo que é necessário para a autenticação JWT no NestJS */
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { User } from './user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailService } from './mail.service';
import { Address } from './address.entity';
import { CepService } from './cep.service';
import { ThrottlerModule } from '@nestjs/throttler';

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error('JWT_SECRET deve ser configurado para iniciar a API.');
}

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Address]),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 10,
      },
    ]),
    PassportModule, //habilita o uso de AuthGuard
    //configura o módulo JWT, definindo a chave secreta e o tempo de expiração dos tokens:
    JwtModule.register({
      secret: jwtSecret,
      signOptions: { expiresIn: '1h' }, // token expira em 1 hora
    }),
  ],
  controllers: [AuthController], //lista os controlers que pertencem a esse módulo
  providers: [AuthService, JwtStrategy, MailService, CepService],
  exports: [AuthService],
})
export class AuthModule {}
