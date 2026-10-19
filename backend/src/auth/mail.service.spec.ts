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
