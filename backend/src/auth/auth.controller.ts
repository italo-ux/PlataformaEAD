import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import {
  EmailDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto/auth.dto';

@Controller('auth')
@UseGuards(ThrottlerGuard)
@Throttle({ default: { limit: 10, ttl: 60_000 } })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(
    @Body()
    body: RegisterDto,
  ) {
    return this.authService.register(
      body.name,
      body.email,
      body.password,
      body.cpf,
      body.cep,
    );
  }

  @Post('login')
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  // MÉTODO DE VERIFICAÇÃO

  @Post('verify')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async verify(@Body() body: VerifyEmailDto) {
    //pega os dados enviados pelo front e envia pro authservice
    return this.authService.verifyEmail(body.email, body.code);
  }

  @Post('resend-verification')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async resendVerification(@Body() body: EmailDto) {
    return this.authService.resendVerification(body.email);
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async forgotPassword(@Body() body: EmailDto) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body.email, body.code, body.password);
  }
}
