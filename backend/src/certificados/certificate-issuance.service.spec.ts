/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return, @typescript-eslint/require-await */
import { CertificateIssuanceService } from './certificate-issuance.service';
import { CertificateSnapshotImage } from './certificate-snapshot-image.entity';
import { CertificateTemplatesService } from './certificate-templates.service';
import { Certificado } from './certificado.entity';

describe('CertificateIssuanceService', () => {
  it('persiste configuração e cópias binárias imutáveis na mesma transação', async () => {
    const originalImage = Buffer.from('imagem-original');
    const templates = {
      getDefaultSnapshot: jest.fn().mockResolvedValue({
        snapshot: {
          templateId: '11111111-1111-4111-8111-111111111111',
          name: 'Modelo',
          eyebrow: 'Instituição',
          title: 'Certificado',
          body: '{aluno} concluiu {curso}.',
          signature: 'Coordenação',
          primaryColor: '#112233',
          accentColor: '#445566',
        },
        assets: [
          {
            kind: 'logo',
            name: 'logo.png',
            png_data: originalImage,
            identification: null,
            ordem: 1,
          },
        ],
      }),
    } as unknown as jest.Mocked<CertificateTemplatesService>;
    const saved: unknown[] = [];
    const manager = {
      create: jest.fn((_entity, value) => value),
      save: jest.fn(async (first, second) => {
        const value = second ?? first;
        if (first === CertificateSnapshotImage) {
          saved.push(...value);
          return value;
        }
        const certificate = { id: 'certificate-id', ...value };
        saved.push(certificate);
        return certificate;
      }),
    } as never;
    const service = new CertificateIssuanceService(templates);

    const certificate = await service.issue(manager, {
      enrollmentId: 'enrollment-id',
      studentName: 'Aluno',
      courseName: 'Curso',
      courseHours: 8,
      completedAt: new Date('2026-09-30T12:00:00Z'),
    });

    expect(manager.create).toHaveBeenCalledWith(
      Certificado,
      expect.objectContaining({
        id_matricula: 'enrollment-id',
        modelo_snapshot: expect.objectContaining({ name: 'Modelo' }),
      }),
    );
    expect(certificate.snapshot_images).toHaveLength(1);
    expect(certificate.snapshot_images[0].png_data).not.toBe(originalImage);
    originalImage.fill(0);
    expect(certificate.snapshot_images[0].png_data.toString()).toBe(
      'imagem-original',
    );
  });
});
