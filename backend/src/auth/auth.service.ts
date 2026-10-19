import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, QueryFailedError, Repository } from 'typeorm';
import { User } from './user.entity';
import { MailService } from './mail.service';
import { randomInt } from 'node:crypto';
import { Address } from './address.entity';
import { CepService } from './cep.service';

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
    @InjectRepository(Address)
    private addressRepository: Repository<Address>,
    private mailService: MailService, // Fix: com 'S' maiúsculo
    private cepService: CepService,
  ) {}

  // 1. REGISTRO (Cria usuário, gera o código OTP e envia o e-mail)
  async register(
    name: string,
    email: string,
    password: string,
    cpf: string,
    cep: string,
  ) {
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException('Este e-mail já está cadastrado.');
    }

    const addressData = await this.cepService.findAddress(cep);
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

    // Usuário e endereço são gravados juntos para não deixar cadastros parciais.
    let savedUser: User;
    try {
      savedUser = await this.userRepository.manager.transaction(
        async (manager) => {
          const persistedUser = await manager.save(user);
          await manager.save(
            this.addressRepository.create({
              id_usuario: persistedUser.id,
              ...addressData,
            }),
          );
          return persistedUser;
        },
      );
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23505'
      ) {
        throw new ConflictException('Este e-mail já está cadastrado.');
      }

      throw error;
    }

    // 📩 DISPARA O E-MAIL COM O CÓDIGO AQUI
    await this.mailService.sendVerificationCode(
      savedUser.email,
      verificationCode,
    );

    return {
      id: savedUser.id,
      email: savedUser.email,
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
        cpf: user.cpf,
        phone: user.phone,
        role: user.role,
        mustChangeEmail: user.must_change_email,
        mustChangePassword: user.must_change_password,
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
    const normalizedEmail = email.trim().toLowerCase();
    const now = new Date();
    const user = await this.userRepository.findOne({
      where: {
        email: normalizedEmail,
        is_verified: true,
        password_reset_code: code,
        password_reset_expires_at: MoreThan(now),
      },
    });

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await this.userRepository.update(
      {
        id: user.id,
        is_verified: true,
        password_reset_code: code,
        password_reset_expires_at: MoreThan(now),
      },
      {
        password_hash: passwordHash,
        password_reset_code: null,
        password_reset_expires_at: null,
      },
    );

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
