import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { User } from './user.entity';
import { MailService } from './mail.service';
import { randomInt } from 'node:crypto';

@Injectable()
export class AuthService {
  private static readonly GENERIC_RECOVERY_MESSAGE =
    'Se o e-mail estiver cadastrado, um código será enviado.';
  private static readonly GENERIC_VERIFICATION_MESSAGE =
    'Se a conta estiver pendente, um novo código será enviado.';
  private static readonly RESET_CODE_TTL_MS = 15 * 60 * 1000;

  constructor(
    private jwtService: JwtService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private mailService: MailService, // Fix: com 'S' maiúsculo
  ) {}

  // 1. REGISTRO (Cria usuário, gera o código OTP e envia o e-mail)
  async register(name: string, email: string, password: string, cpf: string) {
    const hash = await bcrypt.hash(password, 10);
    const normalizedEmail = email.trim().toLowerCase();

    const user = this.userRepository.create({
      name,
      email: normalizedEmail,
      password_hash: hash,
      cpf,
    });

    // Gera o código de 6 dígitos
    const verificationCode = this.generateCode();

    user.verification_code = verificationCode;

    // Salva o usuário com o código no banco
    await this.userRepository.save(user);

    // 📩 DISPARA O E-MAIL COM O CÓDIGO AQUI
    await this.mailService.sendVerificationCode(user.email, verificationCode);

    return {
      id: user.id,
      email: user.email,
      message: 'Usuário cadastrado com sucesso! Verifique seu e-mail.',
    };
  }

  // 2. VERIFICAÇÃO DE E-MAIL (Valida o código digitado)
  async verifyEmail(email: string, code: string) {
    // Busca o usuário no banco
    const user = await this.userRepository.findOne({
      where: { email: email.trim().toLowerCase() },
    });

    // Primeiro: garante que o usuário existe no banco
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    // Segundo: compara o código enviado com o código guardado no banco
    if (
      user.is_verified ||
      !/^\d{6}$/.test(code) ||
      !user.verification_code ||
      user.verification_code !== code
    ) {
      throw new UnauthorizedException('Código de verificação inválido');
    }

    // Se estiver correto, ativa a conta e limpa o código
    user.is_verified = true;
    user.verification_code = null;

    await this.userRepository.save(user);

    return { message: 'E-mail verificado com sucesso! Conta ativa.' };
  }

  // 3. LOGIN (Confere e-mail, verificação e senha)
  async login(email: string, password: string) {
    const user = await this.userRepository.findOne({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    // Bloqueia o login se o e-mail não tiver sido verificado ainda
    if (user.is_verified === false) {
      throw new UnauthorizedException(
        'Por favor, verifique seu e-mail antes de fazer login.',
      );
    }

    // Compara a senha digitada com o hash salvo no banco
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      throw new UnauthorizedException('Senha inválida');
    }

    // Deu tudo certo! Gera o token JWT para o front-end
    const payload = { sub: user.id, email: user.email };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async resendVerification(email: string) {
    const user = await this.userRepository.findOne({
      where: { email: email.trim().toLowerCase() },
    });

    if (user && !user.is_verified) {
      user.verification_code = this.generateCode();
      await this.userRepository.save(user);
      await this.mailService.sendVerificationCode(
        user.email,
        user.verification_code,
      );
    }

    return { message: AuthService.GENERIC_VERIFICATION_MESSAGE };
  }

  async forgotPassword(email: string) {
    const user = await this.userRepository.findOne({
      where: { email: email.trim().toLowerCase() },
    });

    if (user?.is_verified) {
      user.password_reset_code = this.generateCode();
      user.password_reset_expires_at = new Date(
        Date.now() + AuthService.RESET_CODE_TTL_MS,
      );
      await this.userRepository.save(user);
      await this.mailService.sendPasswordResetCode(
        user.email,
        user.password_reset_code,
      );
    }

    return { message: AuthService.GENERIC_RECOVERY_MESSAGE };
  }

  async resetPassword(email: string, code: string, password: string) {
    if (!/^\d{6}$/.test(code)) {
      throw new BadRequestException(
        'Código de recuperação inválido ou expirado',
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await this.userRepository.update(
      {
        email: email.trim().toLowerCase(),
        is_verified: true,
        password_reset_code: code,
        password_reset_expires_at: MoreThan(new Date()),
      },
      {
        password_hash: passwordHash,
        password_reset_code: null,
        password_reset_expires_at: null,
      },
    );

    if (result.affected !== 1) {
      throw new BadRequestException(
        'Código de recuperação inválido ou expirado',
      );
    }

    return { message: 'Senha alterada com sucesso.' };
  }

  private generateCode() {
    return randomInt(100000, 1000000).toString();
  }
}
