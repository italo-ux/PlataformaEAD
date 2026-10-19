import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, Max, Min } from 'class-validator';
import { PlaybackState } from '../playback-session.entity';

export class PlaybackHeartbeatDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sequencia!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(86400)
  posicao_segundos!: number;

  @IsEnum(PlaybackState)
  estado!: PlaybackState;
}
