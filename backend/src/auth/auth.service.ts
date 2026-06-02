import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

interface User {
  id: string;
  email: string;
  password_hash: string;
}

@Injectable()
export class AuthService {
  //  Ideal: isso vir do .env depois
  private readonly JWT_SECRET = 'segredo';

  // = Simulação de banco (por enquanto)
  private async findUserByEmail(email: string): Promise<User | null> {
    if (email === 'teste@email.com') {
      return {
        id: '1',
        email: 'teste@email.com',
        // senha: 123456
        password_hash: await bcrypt.hash('123456', 10),
      };
    }

    return null;
  }

  async login(email: string, password: string) {
    // 1. Buscar usuário
    const user = await this.findUserByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    // 2. Validar senha
    const senhaValida = await bcrypt.compare(password, user.password_hash);

    if (!senhaValida) {
      throw new UnauthorizedException('Senha inválida');
    }

    // 3. Gerar token
    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
      },
      this.JWT_SECRET,
      {
        expiresIn: '1h',
      },
    );

    // 4. Retornar resposta padrão (isso é importante pro frontend)
    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }
}