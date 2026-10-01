import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesGuard } from '../auth/roles.guard';
import { Certificado } from './certificado.entity';
import { CertificadosController } from './certificados.controller';
import { CertificadosService } from './certificados.service';
import {
  CertificateTemplate,
  CertificateTemplateAsset,
} from './certificate-template.entity';
import { CertificateSnapshotImage } from './certificate-snapshot-image.entity';
import { CertificateTemplatesController } from './certificate-templates.controller';
import { CertificateTemplatesService } from './certificate-templates.service';
import { CertificateIssuanceService } from './certificate-issuance.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Certificado,
      CertificateTemplate,
      CertificateTemplateAsset,
      CertificateSnapshotImage,
    ]),
  ],
  controllers: [CertificadosController, CertificateTemplatesController],
  providers: [
    CertificadosService,
    CertificateTemplatesService,
    CertificateIssuanceService,
    RolesGuard,
  ],
  exports: [
    CertificadosService,
    CertificateTemplatesService,
    CertificateIssuanceService,
  ],
})
export class CertificadosModule {}
