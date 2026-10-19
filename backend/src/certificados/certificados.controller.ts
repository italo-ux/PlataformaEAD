import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Req,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthenticatedUser } from '../auth/authenticated-user.interface';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../auth/user-role.enum';
import { CertificadosService } from './certificados.service';

@Controller()
export class CertificadosController {
  constructor(private readonly certificadosService: CertificadosService) {}

  @Get('certificados/validar/:codigo')
  validate(@Param('codigo') codigo: string) {
    return this.certificadosService.validate(codigo);
  }

  @Get('usuarios/me/certificados')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ALUNO)
  list(@Req() request: Request & { user: AuthenticatedUser }) {
    return this.certificadosService.listByUser(request.user.userId);
  }

  @Get('certificados/:id/pdf')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ALUNO)
  async download(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() request: Request & { user: AuthenticatedUser },
    @Res({ passthrough: true }) response: Response,
  ) {
    const certificate = await this.certificadosService.getOwned(
      id,
      request.user.userId,
    );
    const pdf = await this.certificadosService.generatePdf(certificate);
    response.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="certificado-${certificate.codigo}.pdf"`,
      'Cache-Control': 'private, no-store',
    });
    return new StreamableFile(pdf);
  }
}
