import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { User } from './user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailService } from './mail.service';
import { UsuarioController, ProfileController } from '../usuario.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    ConfigModule, // ConfigModule está sendo carregado aqui
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'default_secret', // mesma lógica do JwtStrategy
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  controllers: [AuthController, UsuarioController, ProfileController],
  providers: [AuthService, JwtStrategy, MailService],
  exports: [AuthService, PassportModule, JwtModule, JwtStrategy],
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
