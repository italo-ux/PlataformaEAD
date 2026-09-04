import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class VerifyEmailDto {
  @IsNotEmpty({ message: 'O e-mail é obrigatório.' })
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  email!: string;

  @IsNotEmpty({ message: 'O código de verificação é obrigatório.' })
  @IsString()
  code!: string;
}
