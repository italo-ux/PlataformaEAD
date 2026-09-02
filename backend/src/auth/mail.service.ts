import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'sandbox.smtp.mailtrap.io',
      port: 2525,
      auth: {
        user: '29d493953b0c56',
        pass: '91094334c26a44',
      },
    });
  }

  async sendVerificationCode(email: string, code: string) {
    await this.transporter.sendMail({
      from: '"Plataforma EAD" <no-reply@plataformaead.com>',
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

  async sendPasswordResetCode(email: string, code: string) {
    await this.transporter.sendMail({
      from: '"Plataforma EAD" <no-reply@plataformaead.com>',
      to: email,
      subject: 'Código para redefinição de senha',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2>Redefinição de senha</h2>
          <p>Seu código de recuperação é:</p>
          <h1 style="color: #4B6FFF; letter-spacing: 5px;">${code}</h1>
          <p>O código expira em 15 minutos e pode ser usado apenas uma vez.</p>
        </div>
      `,
    });
  }
}
