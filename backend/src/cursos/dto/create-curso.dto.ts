import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateCursoDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nome!: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  url_foto?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(2147483647)
  carga_horaria?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  categoria?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nivel?: string;

  @IsOptional()
  @IsBoolean()
  ambiente_teste?: boolean;
}
