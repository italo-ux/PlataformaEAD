import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
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
    private mailService: MailService,
  ) {}

  /*------------ Criação de soft delete da conta  ------------*/
  async deleteAccount(userId: string): Promise<void> {
    //busca o usuário no banco pelo ID extraído do Token JWT
    const user = await this.userRepository.findOne({ where: { id: userId } });

    //garante que o usuário realmente existe antes de tentar deletar
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    //executa o softRemove: preenche o deletedAt e salva no banco sem apagar a linha
    await this.userRepository.softRemove(user);
  }

  /*------------ REGISTRO (Cria usuário, gera o código OTP e envia o e-mail  ------------*/
  async register(name: string, email: string, password: string, cpf: string) {
    const hash = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      name,
      email,
      password_hash: hash,
      cpf,
    });

    // gera o código de 6 dígitos
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

    user.verification_code = verificationCode;

    // salva o usuário com o código no banco
    await this.userRepository.save(user);

    await this.mailService.sendVerificationCode(user.email, verificationCode);

    return {
      id: user.id,
      email: user.email,
      message: 'Usuário cadastrado com sucesso! Verifique seu e-mail.',
    };
  }

  // verificação de e-mail
  async verifyEmail(email: string, code: string) {
    // Busca o usuário no banco
    const user = await this.userRepository.findOne({
      where: { email },
    });

    // garante que o suuáro eista no banco
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    // compara o código enviado com o código guardado no banco
    if (user.verification_code !== code) {
      throw new UnauthorizedException('Código de verificação inválido');
    }

    //se estiver correto, ativa a conta e limpa o código
    user.is_verified = true;
    user.verification_code = null;

    await this.userRepository.save(user);

    return { message: 'E-mail verificado com sucesso! Conta ativa.' };
  }

  // LOGIN
  async login(email: string, password: string) {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    // bloqueia o login se o e-mail não tiver sido verificado ainda
    if (user.is_verified === false) {
      throw new UnauthorizedException(
        'Por favor, verifique seu e-mail antes de fazer login.',
      );
    }

    // compara a senha digitada com o hash salvo no banco
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      throw new UnauthorizedException('Senha inválida');
    }

    // deu certo, gera o token JWT para o front-end
    const payload = { sub: user.id, email: user.email };

    console.log(
      '--- TOKEN GERADO NO LOGIN: ---',
      this.jwtService.sign(payload),
    ); //teste

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  // bsca perfil por ID
  async getProfileById(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Usuário não encontrado');
    // Retorna os dados ocultando a senha por segurança
    delete (user as Partial<User>).password_hash;
    delete (user as Partial<User>).verification_code;

    return user;
  }

  // aualiza os campos do perfil no banco
  async updateProfileById(userId: string, updateData: Partial<User>) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Usuário não encontrado');

    delete updateData.id;

    Object.assign(user, updateData);

    await this.userRepository.save(user);

    delete (user as Partial<User>).password_hash;
    delete (user as Partial<User>).verification_code;

    return user;
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    nextPassword: string,
  ) {
    //busca o usuário pelo ID como string
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    //usa password_hash em vez de password
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      throw new BadRequestException('A senha atual está incorreta.');
    }

    //atualiza o password_hash e salva
    const saltRounds = 10;
    user.password_hash = await bcrypt.hash(nextPassword, saltRounds);
    await this.userRepository.save(user);

    return { message: 'Senha alterada com sucesso!' };
  }
}
