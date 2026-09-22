import { Type } from 'class-transformer';
import {
  IsInt,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  ArrayMinSize,
  ValidateNested,
  Equals,
} from 'class-validator';
import { AulaTipo } from '../aula.entity';
import { QUIZ_MAX_ATTEMPTS, QUIZ_PASS_PERCENTAGE } from '../quiz-policy';

const youtubeHosts = [
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'www.youtu.be',
];

export class AlternativaQuestionarioDto {
  @IsString() @IsNotEmpty() texto!: string;
  @IsBoolean() correta!: boolean;
}

export class PerguntaQuestionarioDto {
  @IsString() @IsNotEmpty() enunciado!: string;
  @Type(() => Number) @IsInt() @Min(1) pontos!: number;
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => AlternativaQuestionarioDto)
  alternativas!: AlternativaQuestionarioDto[];
}

export class QuestionarioDto {
  @Type(() => Number)
  @IsNumber()
  @Equals(QUIZ_PASS_PERCENTAGE, {
    message: `nota_minima deve ser ${QUIZ_PASS_PERCENTAGE}`,
  })
  nota_minima!: number;

  @Type(() => Number)
  @IsInt()
  @Equals(QUIZ_MAX_ATTEMPTS, {
    message: `max_tentativas deve ser ${QUIZ_MAX_ATTEMPTS}`,
  })
  max_tentativas!: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) pontos_base?: number;
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PerguntaQuestionarioDto)
  perguntas!: PerguntaQuestionarioDto[];
}

export class CreateAulaDto {
  @IsString()
  @IsNotEmpty()
  titulo!: string;

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
