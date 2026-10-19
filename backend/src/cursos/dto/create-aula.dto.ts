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

  @Type(() => Number)
  @IsInt()
  @Min(1)
  duracao_segundos!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  ordem?: number;
}
