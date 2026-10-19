import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCursoDto {
  @IsString()
  @IsNotEmpty()
  nome!: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsUrl()
  url_foto?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  carga_horaria?: number;

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @IsString()
  nivel?: string;
}
