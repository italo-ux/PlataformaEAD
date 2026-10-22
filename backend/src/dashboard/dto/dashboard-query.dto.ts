import {
  IsDateString,
  IsIn,
  IsOptional,
  IsUUID,
  Matches,
} from 'class-validator';

export class DashboardQueryDto {
  @IsOptional()
  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  periodoInicio?: string;

  @IsOptional()
  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  periodoFim?: string;

  @IsOptional()
  @IsUUID()
  cursoId?: string;

  @IsOptional()
  @IsUUID()
  trilhaId?: string;

  @IsOptional()
  @Matches(/^[A-Z]{2}$/)
  uf?: string;

  @IsOptional()
  @IsIn(['mensal', 'anual'])
  granularidadeCrescimento?: 'mensal' | 'anual';

  @IsOptional()
  @IsIn(['mensal', 'anual'])
  granularidadeCertificados?: 'mensal' | 'anual';
}
