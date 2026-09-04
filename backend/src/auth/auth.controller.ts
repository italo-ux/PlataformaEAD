import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  EmailDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body()
    body: RegisterDto,
  ) {
    return this.authService.register(
      body.name,
      body.email,
      body.password,
      body.cpf,
    );
  }

  @Post('login')
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  // MÉTODO DE VERIFICAÇÃO

  @Post('verify')
  async verify(@Body() body: VerifyEmailDto) {
    //pega os dados enviados pelo front e envia pro authservice
    return this.authService.verifyEmail(body.email, body.code);
  }

  @Post('resend-verification')
  async resendVerification(@Body() body: EmailDto) {
    return this.authService.resendVerification(body.email);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: EmailDto) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body.email, body.code, body.password);
  }
}
