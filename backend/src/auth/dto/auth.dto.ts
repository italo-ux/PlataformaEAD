import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, Matches, MinLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class EmailDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  email!: string;
}

export class LoginDto extends EmailDto {
  @IsString()
  @MinLength(1)
  password!: string;
}

export class RegisterDto extends EmailDto {
  @Transform(trim)
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])[\s\S]+$/)
  password!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.replace(/\D/g, '') : value,
  )
  @IsString()
  @Length(11, 11)
  @Matches(/^\d{11}$/)
  cpf!: string;
}

export class VerifyEmailDto extends EmailDto {
  @IsString()
  @Matches(/^\d{6}$/)
  code!: string;
}

export class ResetPasswordDto extends VerifyEmailDto {
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])[\s\S]+$/)
  password!: string;
}
