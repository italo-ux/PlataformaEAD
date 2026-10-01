/* eslint-disable @typescript-eslint/unbound-method */
import { Repository } from 'typeorm';
import { Certificado, CertificadoStatus } from './certificado.entity';
import { CertificadosService } from './certificados.service';

describe('CertificadosService', () => {
  const certificate = {
    id: '11111111-1111-4111-8111-111111111111',
    id_matricula: '22222222-2222-4222-8222-222222222222',
    codigo: 'ABC123',
    nome_aluno: 'Aluno Teste',
    nome_curso: 'Curso Seguro',
    carga_horaria: 8,
    concluido_em: new Date('2026-09-12T12:00:00Z'),
    emitido_em: new Date('2026-09-12T12:00:00Z'),
    status: CertificadoStatus.VALIDO,
    matricula: {
      usuario: {
        cpf: '12345678901',
        email: 'privado@example.com',
        phone: '11999999999',
      },
    },
  } as unknown as Certificado;
  const repository = {
    findOneBy: jest.fn(),
  } as unknown as jest.Mocked<Repository<Certificado>>;
  const service = new CertificadosService(repository);

  beforeEach(() => jest.clearAllMocks());

  it('returns only the public validation fields', async () => {
    repository.findOneBy.mockResolvedValue(certificate);
    const result = await service.validate('abc123');

    expect(repository.findOneBy).toHaveBeenCalledWith({ codigo: 'ABC123' });
    expect(result).toMatchObject({
      nome_aluno: certificate.nome_aluno,
      nome_curso: certificate.nome_curso,
      status: CertificadoStatus.VALIDO,
    });
    expect(result).not.toHaveProperty('cpf');
    expect(result).not.toHaveProperty('email');
    expect(result).not.toHaveProperty('phone');
    expect(result).not.toHaveProperty('matricula');
  });

  it('mantém o PDF legado para certificados emitidos sem snapshot', async () => {
    await expect(service.generatePdf(certificate)).resolves.toEqual(
      expect.objectContaining({
        0: 0x25,
        1: 0x50,
        2: 0x44,
        3: 0x46,
      }),
    );
  });

  it('gera o PDF com o snapshot e as imagens congeladas do modelo', async () => {
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64',
    );
    const modeledCertificate = {
      ...certificate,
      modelo_snapshot: {
        templateId: '33333333-3333-4333-8333-333333333333',
        name: 'Modelo congelado',
        eyebrow: 'Instituição',
        title: 'Certificado personalizado',
        body: '{aluno} concluiu {curso}.',
        signature: 'Coordenação',
        primaryColor: '#112233',
        accentColor: '#445566',
      },
      snapshot_images: [
        {
          kind: 'logo',
          ordem: 1,
          name: 'logo.png',
          png_data: png,
          identification: null,
        },
      ],
    } as Certificado;

    await expect(service.generatePdf(modeledCertificate)).resolves.toEqual(
      expect.objectContaining({
        0: 0x25,
        1: 0x50,
        2: 0x44,
        3: 0x46,
      }),
    );
  });
});
