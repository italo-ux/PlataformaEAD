import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesGuard } from '../auth/roles.guard';
import { Certificado } from './certificado.entity';
import { CertificadosController } from './certificados.controller';
import { CertificadosService } from './certificados.service';

@Module({
  imports: [TypeOrmModule.forFeature([Certificado])],
  controllers: [CertificadosController],
  providers: [CertificadosService, RolesGuard],
  exports: [CertificadosService],
})
export class CertificadosModule {}
