import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesGuard } from '../auth/roles.guard';
import { User } from '../auth/user.entity';
import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsuariosController],
  providers: [UsuariosService, RolesGuard],
})
export class UsuariosModule {}
