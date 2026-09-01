import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter?: Transporter;

  constructor() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(process.env.SMTP_PORT ?? 587),
        auth: { user, pass },
      });
      return;
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('SMTP configuration is required in production.');
    }

    this.logger.warn(
      'SMTP is not configured; verification codes will be logged in development.',
    );
  }

  async sendVerificationCode(email: string, code: string) {
    if (!this.transporter) {
      this.logger.log(`Verification code for ${email}: ${code}`);
      return;
    }

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM ?? '"Plataforma EAD" <no-reply@localhost>',
      to: email,
      subject: 'Código de Verificação de E-mail',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2>Bem-vindo à Plataforma EAD!</h2>
          <p>Seu código de verificação é:</p>
          <h1 style="color: #4CAF50; letter-spacing: 5px;">${code}</h1>
          <p>Insira este código na tela de verificação para ativar sua conta.</p>
        </div>
      `,
    });
  }
}
