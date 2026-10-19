import { Type } from 'class-transformer';
import { IsNumber, Max, Min } from 'class-validator';

export class StartPlaybackDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(86400)
  posicao_segundos!: number;
}
