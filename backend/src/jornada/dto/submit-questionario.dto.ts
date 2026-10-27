import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsUUID, ValidateNested } from 'class-validator';

export class RespostaQuestionarioDto {
  @IsUUID() pergunta_id!: string;
  @IsUUID() alternativa_id!: string;
}

export class SubmitQuestionarioDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RespostaQuestionarioDto)
  respostas!: RespostaQuestionarioDto[];
}
