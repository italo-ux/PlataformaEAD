import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';

const youtubeHosts = [
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'www.youtu.be',
];

export class CreateAulaDto {
  @IsString()
  @IsNotEmpty()
  titulo!: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsUrl(
    {
      protocols: ['http', 'https'],
      require_protocol: true,
      host_whitelist: youtubeHosts,
    },
    { message: 'url_video deve ser uma URL válida do YouTube' },
  )
  url_video!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  duracao_minutos?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  ordem?: number;
}
