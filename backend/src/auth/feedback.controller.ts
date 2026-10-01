import { Body, Controller, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Transform } from 'class-transformer';
import { IsString, Length } from 'class-validator';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthenticatedUser } from './authenticated-user.interface';
import { MailService } from './mail.service';
import { User } from './user.entity';

class FeedbackDto {
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @Length(1, 150)
  subject!: string;

  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @Length(1, 5000)
  message!: string;
}

@Controller('feedback')
@UseGuards(JwtAuthGuard, ThrottlerGuard)
@Throttle({ default: { limit: 3, ttl: 60_000 } })
export class FeedbackController {
  constructor(
    private readonly mail: MailService,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  @Post()
  async send(@Body() input: FeedbackDto, @Req() request: { user: AuthenticatedUser }) {
    const user = await this.users.findOneBy({ id: request.user.userId });
    if (!user) throw new UnauthorizedException();
    await this.mail.sendInstitutionFeedback(user.name, user.email, input.subject, input.message);
    return { message: 'Mensagem enviada à instituição.' };
  }
}
