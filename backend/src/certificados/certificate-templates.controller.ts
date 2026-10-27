import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../auth/user-role.enum';
import { CertificateTemplatesService } from './certificate-templates.service';
import {
  CreateCertificateTemplateDto,
  SyncCertificateTemplatesDto,
} from './dto/certificate-template.dto';

@Controller('admin/modelos-certificado')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class CertificateTemplatesController {
  constructor(private readonly templates: CertificateTemplatesService) {}

  @Get()
  list() {
    return this.templates.list();
  }

  @Post()
  create(@Body() input: CreateCertificateTemplateDto) {
    return this.templates.create(input);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() input: CreateCertificateTemplateDto,
  ) {
    return this.templates.update(id, input);
  }

  @Post(':id/padrao')
  setDefault(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.templates.setDefault(id);
  }

  @Post('sincronizar')
  sync(@Body() input: SyncCertificateTemplatesDto) {
    return this.templates.sync(input);
  }
}
