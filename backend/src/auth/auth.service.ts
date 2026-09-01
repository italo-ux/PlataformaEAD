import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { MailService } from './mail.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private mailService: MailService, // Fix: com 'S' maiúsculo
  ) {}

  // 1. REGISTRO (Cria usuário, gera o código OTP e envia o e-mail)
  async register(name: string, email: string, password: string, cpf: string) {
    const hash = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      name,
      email,
      password_hash: hash,
      cpf,
    });

    // Gera o código de 6 dígitos
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

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
      where: { email },
    });

    // Primeiro: garante que o usuário existe no banco
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    // Segundo: compara o código enviado com o código guardado no banco
    if (user.verification_code !== code) {
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
      where: { email },
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
}
