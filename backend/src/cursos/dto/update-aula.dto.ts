import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsEnum,
  ValidateNested,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { AulaTipo } from '../aula.entity';
import { PdfAttachmentDto, QuestionarioDto } from './create-aula.dto';

const youtubeHosts = [
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'www.youtu.be',
];

export class UpdateAulaDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  titulo?: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsEnum(AulaTipo)
  tipo?: AulaTipo;

  @IsOptional()
  @IsUrl(
    {
      protocols: ['http', 'https'],
      require_protocol: true,
      host_whitelist: youtubeHosts,
    },
    { message: 'url_video deve ser uma URL válida do YouTube' },
  )
  @MaxLength(500)
  url_video?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(86400)
  duracao_segundos?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => QuestionarioDto)
  questionario?: QuestionarioDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PdfAttachmentDto)
  pdf_arquivo?: PdfAttachmentDto;
}
