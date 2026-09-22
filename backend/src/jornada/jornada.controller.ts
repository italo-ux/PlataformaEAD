import {
  Body,
  Controller,
  GoneException,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser } from '../auth/authenticated-user.interface';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../auth/user-role.enum';
import { EndPlaybackDto } from './dto/end-playback.dto';
import { PlaybackHeartbeatDto } from './dto/playback-heartbeat.dto';
import { StartPlaybackDto } from './dto/start-playback.dto';
import { JornadaService } from './jornada.service';
import { PlaybackService } from './playback.service';
import { QuestionarioService } from './questionario.service';
import { SubmitQuestionarioDto } from './dto/submit-questionario.dto';
import { CursosService } from '../cursos/cursos.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class JornadaController {
  constructor(
    private readonly jornadaService: JornadaService,
    private readonly playbackService: PlaybackService,
    private readonly questionarioService: QuestionarioService,
    private readonly cursosService: CursosService,
  ) {}

  @Post('cursos/:courseId/aulas/:lessonId/questionario/tentativas')
  @Roles(UserRole.ALUNO)
  submitQuestionario(
    @Param('courseId', new ParseUUIDPipe()) courseId: string,
    @Param('lessonId', new ParseUUIDPipe()) lessonId: string,
    @Body() body: SubmitQuestionarioDto,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    return this.questionarioService.submit(
      courseId,
      lessonId,
      body,
      request.user,
    );
  }

  @Post('cursos/:courseId/aulas/:lessonId/validar-video')
  @Roles(UserRole.ALUNO, UserRole.PROFESSOR, UserRole.ADMIN)
  validateVideo(
    @Param('courseId', new ParseUUIDPipe()) courseId: string,
    @Param('lessonId', new ParseUUIDPipe()) lessonId: string,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    return this.cursosService.validateLessonVideo(
      courseId,
      lessonId,
      request.user,
    );
  }

  @Post('cursos/:courseId/matricula')
  @Roles(UserRole.ALUNO)
  enroll(
    @Param('courseId', new ParseUUIDPipe()) courseId: string,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    return this.jornadaService.enroll(courseId, request.user);
  }

  @Get('usuarios/me/matriculas')
  @Roles(UserRole.ALUNO)
  listEnrollments(@Req() request: Request & { user: AuthenticatedUser }) {
    return this.jornadaService.listEnrollments(request.user);
  }

  @Get('admin/metricas-jornada')
  @Roles(UserRole.ADMIN)
  metrics() {
    return this.jornadaService.metrics();
  }

  @Get('cursos/:courseId/jornada')
  @Roles(UserRole.ALUNO, UserRole.PROFESSOR, UserRole.ADMIN)
  getJourney(
    @Param('courseId', new ParseUUIDPipe()) courseId: string,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    return this.jornadaService.getJourney(courseId, request.user);
  }

  @Post('cursos/:courseId/aulas/:lessonId/progresso')
  @Roles(UserRole.ALUNO)
  legacyProgress() {
    throw new GoneException(
      'Este endpoint foi substituído por sessões de reprodução. Atualize o player.',
    );
  }

  @Post('cursos/:courseId/aulas/:lessonId/reproducao')
  @Roles(UserRole.ALUNO)
  startPlayback(
    @Param('courseId', new ParseUUIDPipe()) courseId: string,
    @Param('lessonId', new ParseUUIDPipe()) lessonId: string,
    @Body() body: StartPlaybackDto,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    return this.playbackService.start(courseId, lessonId, body, request.user);
  }

  @Post('cursos/:courseId/aulas/:lessonId/reproducao/:sessionId/heartbeat')
  @Roles(UserRole.ALUNO)
  @HttpCode(HttpStatus.OK)
  heartbeat(
    @Param('courseId', new ParseUUIDPipe()) courseId: string,
    @Param('lessonId', new ParseUUIDPipe()) lessonId: string,
    @Param('sessionId', new ParseUUIDPipe()) sessionId: string,
    @Body() body: PlaybackHeartbeatDto,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    return this.playbackService.heartbeat(
      courseId,
      lessonId,
      sessionId,
      body,
      request.user,
    );
  }

  @Post('cursos/:courseId/aulas/:lessonId/reproducao/:sessionId/encerrar')
  @Roles(UserRole.ALUNO)
  @HttpCode(HttpStatus.OK)
  endPlayback(
    @Param('courseId', new ParseUUIDPipe()) courseId: string,
    @Param('lessonId', new ParseUUIDPipe()) lessonId: string,
    @Param('sessionId', new ParseUUIDPipe()) sessionId: string,
    @Body() body: EndPlaybackDto,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    return this.playbackService.end(
      courseId,
      lessonId,
      sessionId,
      body,
      request.user,
    );
  }
}
