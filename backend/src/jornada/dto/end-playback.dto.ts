import { Type } from 'class-transformer';
import { IsInt, IsNumber, Max, Min } from 'class-validator';

export class EndPlaybackDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sequencia!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(86400)
  posicao_segundos!: number;
}
