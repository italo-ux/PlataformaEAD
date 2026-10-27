import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateTrilhaDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nome!: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  descricao?: string;

  @IsOptional()
  @Transform(trim)
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(255)
  capa?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  nivel?: string;

  @IsOptional()
  @Transform(trim)
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'cor_fundo deve ser uma cor hexadecimal válida.',
  })
  cor_fundo?: string;

  @IsOptional()
  @Type(() => String)
  @IsArray()
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  courseIds?: string[];
}
