import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';

const COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;
const PNG_DATA_URL_PATTERN = /^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/;

export class CertificateLogoDto {
  @IsString()
  @Length(1, 255)
  name!: string;

  @IsString()
  @MaxLength(1_400_000)
  @Matches(PNG_DATA_URL_PATTERN, {
    message: 'A imagem deve ser um PNG válido.',
  })
  src!: string;
}

export class CertificateSignatureDto extends CertificateLogoDto {
  @IsString()
  @Length(1, 150)
  identification!: string;
}

export class CreateCertificateTemplateDto {
  @IsString()
  @Length(1, 120)
  name!: string;

  @IsString()
  @Length(1, 180)
  eyebrow!: string;

  @IsString()
  @Length(1, 180)
  title!: string;

  @IsString()
  @Length(1, 1000)
  body!: string;

  @IsString()
  @Length(1, 180)
  signature!: string;

  @Matches(COLOR_PATTERN, {
    message: 'primaryColor deve ser uma cor hexadecimal.',
  })
  primaryColor!: string;

  @Matches(COLOR_PATTERN, {
    message: 'accentColor deve ser uma cor hexadecimal.',
  })
  accentColor!: string;

  @IsArray()
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => CertificateLogoDto)
  logos: CertificateLogoDto[] = [];

  @IsArray()
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => CertificateSignatureDto)
  signatures: CertificateSignatureDto[] = [];
}

export class SyncCertificateTemplateItemDto extends CreateCertificateTemplateDto {
  @IsString()
  @Length(1, 100)
  @Matches(/^[A-Za-z0-9._:-]+$/, {
    message: 'clientId contém caracteres inválidos.',
  })
  clientId!: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class SyncCertificateTemplatesDto {
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => SyncCertificateTemplateItemDto)
  templates!: SyncCertificateTemplateItemDto[];
}
