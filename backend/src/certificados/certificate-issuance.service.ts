import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { EntityManager } from 'typeorm';
import { CertificateSnapshotImage } from './certificate-snapshot-image.entity';
import { CertificateTemplatesService } from './certificate-templates.service';
import { Certificado, CertificadoStatus } from './certificado.entity';

export interface CertificateIssueInput {
  enrollmentId: string;
  studentName: string;
  courseName: string;
  courseHours: number;
  completedAt: Date;
}

@Injectable()
export class CertificateIssuanceService {
  constructor(
    private readonly certificateTemplates: CertificateTemplatesService,
  ) {}

  async issue(manager: EntityManager, input: CertificateIssueInput) {
    const { snapshot, assets } =
      await this.certificateTemplates.getDefaultSnapshot(manager);
    const certificate = await manager.save(
      manager.create(Certificado, {
        id_matricula: input.enrollmentId,
        codigo: randomBytes(16).toString('hex').toUpperCase(),
        nome_aluno: input.studentName,
        nome_curso: input.courseName,
        carga_horaria: input.courseHours,
        concluido_em: input.completedAt,
        status: CertificadoStatus.VALIDO,
        modelo_snapshot: snapshot,
      }),
    );
    certificate.snapshot_images = assets.length
      ? await manager.save(
          CertificateSnapshotImage,
          assets.map((asset) =>
            manager.create(CertificateSnapshotImage, {
              id_certificado: certificate.id,
              kind: asset.kind,
              name: asset.name,
              png_data: Buffer.from(asset.png_data),
              identification: asset.identification,
              ordem: asset.ordem,
            }),
          ),
        )
      : [];
    return certificate;
  }
}
