import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsEnum,
  ValidateNested,
  Min,
} from 'class-validator';
import { AulaTipo } from '../aula.entity';
import { QuestionarioDto } from './create-aula.dto';

const youtubeHosts = [
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'www.youtu.be',
];

export class UpdateAulaDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
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
  url_video?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  duracao_segundos?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => QuestionarioDto)
  questionario?: QuestionarioDto;
}
