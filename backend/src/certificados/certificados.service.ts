import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { Repository } from 'typeorm';
import { Certificado } from './certificado.entity';

@Injectable()
export class CertificadosService {
  constructor(
    @InjectRepository(Certificado)
    private readonly certificatesRepository: Repository<Certificado>,
  ) {}

  async listByUser(userId: string) {
    const certificates = await this.certificatesRepository
      .createQueryBuilder('certificado')
      .innerJoin('certificado.matricula', 'matricula')
      .where('matricula.id_usuario = :userId', { userId })
      .orderBy('certificado.emitido_em', 'DESC')
      .getMany();
    return certificates.map((certificate) => this.serialize(certificate));
  }

  async validate(code: string) {
    const certificate = await this.certificatesRepository.findOneBy({
      codigo: code.trim().toUpperCase(),
    });
    if (!certificate)
      throw new NotFoundException('Certificado não encontrado.');
    return this.serialize(certificate);
  }

  async getOwned(id: string, userId: string) {
    const certificate = await this.certificatesRepository
      .createQueryBuilder('certificado')
      .innerJoinAndSelect('certificado.matricula', 'matricula')
      .where('certificado.id = :id', { id })
      .andWhere('matricula.id_usuario = :userId', { userId })
      .getOne();
    if (!certificate)
      throw new NotFoundException('Certificado não encontrado.');
    return certificate;
  }

  async generatePdf(certificate: Certificado) {
    const issuer =
      process.env.CERTIFICATE_ISSUER_NAME ?? 'Plataforma EAD Inovação Barueri';
    const verifyBase =
      process.env.CERTIFICATE_VERIFY_BASE_URL ??
      'http://localhost:5173/certificados/validar';
    const verificationUrl = `${verifyBase.replace(/\/$/, '')}/${certificate.codigo}`;
    const qrCode = await QRCode.toBuffer(verificationUrl, {
      type: 'png',
      width: 280,
      margin: 1,
      color: { dark: '#173B75', light: '#FFFFFF' },
    });

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margin: 0,
        info: {
          Title: `Certificado - ${certificate.nome_curso}`,
          Author: issuer,
          Subject: 'Certificado verificável de conclusão de curso',
        },
      });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const width = doc.page.width;
      const height = doc.page.height;
      doc.rect(0, 0, width, height).fill('#F6F9FF');
      doc
        .rect(24, 24, width - 48, height - 48)
        .lineWidth(3)
        .stroke('#2563EB');
      doc
        .rect(36, 36, width - 72, height - 72)
        .lineWidth(1)
        .stroke('#93C5FD');
      doc.rect(0, 0, width, 18).fill('#173B75');
      doc.rect(0, height - 18, width, 18).fill('#173B75');

      doc
        .fillColor('#2563EB')
        .font('Helvetica-Bold')
        .fontSize(13)
        .text(issuer.toUpperCase(), 70, 72, {
          align: 'center',
          width: width - 140,
        });
      doc
        .fillColor('#172554')
        .font('Helvetica-Bold')
        .fontSize(34)
        .text('CERTIFICADO DE CONCLUSÃO', 70, 112, {
          align: 'center',
          width: width - 140,
          characterSpacing: 1.2,
        });
      doc
        .fillColor('#475569')
        .font('Helvetica')
        .fontSize(15)
        .text('Certificamos que', 90, 177, {
          align: 'center',
          width: width - 180,
        });
      doc
        .fillColor('#0F172A')
        .font('Helvetica-Bold')
        .fontSize(27)
        .text(certificate.nome_aluno, 90, 208, {
          align: 'center',
          width: width - 180,
        });
      doc
        .fillColor('#475569')
        .font('Helvetica')
        .fontSize(15)
        .text('concluiu com aproveitamento o curso', 90, 254, {
          align: 'center',
          width: width - 180,
        });
      doc
        .fillColor('#1D4ED8')
        .font('Helvetica-Bold')
        .fontSize(24)
        .text(certificate.nome_curso, 90, 286, {
          align: 'center',
          width: width - 180,
        });

      const conclusionDate = new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'long',
        timeZone: 'America/Sao_Paulo',
      }).format(new Date(certificate.concluido_em));
      doc
        .fillColor('#334155')
        .font('Helvetica')
        .fontSize(13)
        .text(
          `Carga horária: ${certificate.carga_horaria} horas  |  Conclusão: ${conclusionDate}`,
          80,
          340,
          { align: 'center', width: width - 160 },
        );

      doc.roundedRect(70, 390, width - 140, 105, 10).fill('#EAF2FF');
      doc.image(qrCode, width - 177, 400, { width: 84, height: 84 });
      doc
        .fillColor('#173B75')
        .font('Helvetica-Bold')
        .fontSize(12)
        .text('VALIDAÇÃO PÚBLICA', 92, 410);
      doc
        .fillColor('#334155')
        .font('Helvetica')
        .fontSize(10)
        .text('Código:', 92, 438)
        .font('Helvetica-Bold')
        .text(certificate.codigo, 132, 438)
        .font('Helvetica')
        .fontSize(9)
        .text(verificationUrl, 92, 460, { width: width - 300 });
      doc
        .fillColor('#64748B')
        .font('Helvetica')
        .fontSize(8)
        .text(
          'A autenticidade deste documento deve ser confirmada pelo código ou QR code acima.',
          70,
          height - 48,
          { align: 'center', width: width - 140 },
        );
      doc.end();
    });
  }

  private serialize(certificate: Certificado) {
    return {
      id: certificate.id,
      codigo: certificate.codigo,
      nome_aluno: certificate.nome_aluno,
      nome_curso: certificate.nome_curso,
      carga_horaria: certificate.carga_horaria,
      concluido_em: certificate.concluido_em,
      emitido_em: certificate.emitido_em,
      status: certificate.status,
    };
  }
}
