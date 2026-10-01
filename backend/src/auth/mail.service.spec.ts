import { Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { MailService } from './mail.service';

jest.mock('nodemailer', () => ({ createTransport: jest.fn() }));

describe('MailService', () => {
  const keys = [
    'NODE_ENV',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'SMTP_FROM',
    'INSTITUTION_EMAIL',
  ];
  let previous: Record<string, string | undefined>;
  let log: jest.SpyInstance;

  beforeEach(() => {
    previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
    keys.forEach((key) => delete process.env[key]);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    log = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
    jest.mocked(nodemailer.createTransport).mockClear();
  });

  afterEach(() => {
    keys.forEach((key) => {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    });
    jest.restoreAllMocks();
  });

  it('supports both code flows without SMTP only in development', async () => {
    process.env.NODE_ENV = 'development';
    const service = new MailService();
    await expect(
      service.sendVerificationCode('test@example.com', '123456'),
    ).resolves.toBeUndefined();
    await expect(
      service.sendPasswordResetCode('test@example.com', '654321'),
    ).resolves.toBeUndefined();
    expect(nodemailer.createTransport).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledTimes(2);
  });

  it('does not pretend feedback was sent without SMTP or a destination', async () => {
    const service = new MailService();
    await expect(service.sendInstitutionFeedback('Aluno', 'aluno@example.com', 'Dúvida', 'Mensagem')).rejects.toThrow();
    expect(log).not.toHaveBeenCalled();
  });

  it('sends feedback only to the institution and rejects SMTP failures', async () => {
    Object.assign(process.env, {
      SMTP_HOST: 'smtp.example.test', SMTP_USER: 'test', SMTP_PASS: 'test',
      SMTP_FROM: 'sender@example.com', INSTITUTION_EMAIL: 'institution@example.com',
    });
    const sendMail = jest.fn().mockResolvedValue({ accepted: ['institution@example.com'], rejected: [] });
    jest.mocked(nodemailer.createTransport).mockReturnValue({ sendMail } as unknown as ReturnType<typeof nodemailer.createTransport>);
    const service = new MailService();
    await service.sendInstitutionFeedback('Aluno', 'aluno@example.com', 'Dúvida', '<b>Mensagem</b>');
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'institution@example.com', from: 'sender@example.com', replyTo: 'aluno@example.com',
      text: 'Nome: Aluno\nE-mail: aluno@example.com\n\n<b>Mensagem</b>',
    }));
    sendMail.mockResolvedValueOnce({ accepted: [], rejected: ['institution@example.com'] });
    await expect(service.sendInstitutionFeedback('Aluno', 'aluno@example.com', 'Dúvida', 'Mensagem')).rejects.toThrow();
    sendMail.mockRejectedValueOnce(new Error('SMTP failed'));
    await expect(service.sendInstitutionFeedback('Aluno', 'aluno@example.com', 'Dúvida', 'Mensagem')).rejects.toThrow();
  });

  it('refuses to start in production without SMTP', () => {
    process.env.NODE_ENV = 'production';
    expect(() => new MailService()).toThrow('SMTP configuration is required');
  });

  it('uses the configured sender and transport for both flows', async () => {
    Object.assign(process.env, {
      NODE_ENV: 'production',
      SMTP_HOST: 'smtp.example.test',
      SMTP_PORT: '2525',
      SMTP_USER: 'test-user',
      SMTP_PASS: 'test-password',
      SMTP_FROM: 'sender@example.test',
    });
    const sendMail = jest.fn().mockResolvedValue({});
    jest
      .mocked(nodemailer.createTransport)
      .mockReturnValue({ sendMail } as unknown as ReturnType<
        typeof nodemailer.createTransport
      >);
    const service = new MailService();
    await service.sendVerificationCode('test@example.com', '123456');
    await service.sendPasswordResetCode('test@example.com', '654321');
    expect(sendMail).toHaveBeenCalledTimes(2);
    for (const [message] of sendMail.mock.calls as [
      { from: string; to: string },
    ][]) {
      expect(message.from).toBe('sender@example.test');
      expect(message.to).toBe('test@example.com');
    }
  });
});
