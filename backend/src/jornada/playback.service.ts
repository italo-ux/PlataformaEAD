import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { DataSource, EntityManager } from 'typeorm';
import { AuthenticatedUser } from '../auth/authenticated-user.interface';
import {
  Certificado,
  CertificadoStatus,
} from '../certificados/certificado.entity';
import { EndPlaybackDto } from './dto/end-playback.dto';
import { CursoStatus } from '../cursos/curso.entity';
import { PlaybackHeartbeatDto } from './dto/playback-heartbeat.dto';
import { StartPlaybackDto } from './dto/start-playback.dto';
import { Matricula } from './matricula.entity';
import {
  PlaybackSession,
  PlaybackSessionStatus,
  PlaybackState,
} from './playback-session.entity';
import { ProgressoAula } from './progresso-aula.entity';
import {
  evaluatePlaybackAdvance,
  updateLessonCoverage,
  watchedSeconds,
} from './progress-policy';
import { ClockService } from './clock.service';

const HEARTBEAT_SECONDS = 5;
const SESSION_TIMEOUT_SECONDS = 20;

type HeartbeatFailure = { error: 'expired' };

@Injectable()
export class PlaybackService {
  private readonly logger = new Logger(PlaybackService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly clock: ClockService,
  ) {}

  async start(
    courseId: string,
    lessonId: string,
    input: StartPlaybackDto,
    actor: AuthenticatedUser,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const enrollment = await this.loadEnrollment(
        manager,
        actor.userId,
        courseId,
      );
      if (enrollment.curso.status !== CursoStatus.PUBLICADO) {
        throw new ConflictException('O curso não está publicado.');
      }
      if (enrollment.conclusao) {
        throw new ConflictException('O curso já foi concluído.');
      }
      const progress = this.requireUnlockedProgress(enrollment, lessonId);
      if (progress.concluida) {
        throw new ConflictException('A aula já foi concluída.');
      }
      const duration = progress.aula.duracao_segundos;
      if (!duration || duration <= 0 || !progress.aula.youtube_video_id) {
        throw new ConflictException(
          'A aula ainda não possui vídeo e duração cadastrados.',
        );
      }
      if (input.posicao_segundos > duration + 1) {
        throw new BadRequestException(
          'Posição fora da duração cadastrada do vídeo.',
        );
      }

      await manager
        .createQueryBuilder()
        .update(PlaybackSession)
        .set({ status: PlaybackSessionStatus.REVOKED })
        .where('id_progresso_aula = :progressId', { progressId: progress.id })
        .andWhere('status = :status', { status: PlaybackSessionStatus.ACTIVE })
        .execute();

      const now = this.clock.now();
      const session = manager.create(PlaybackSession, {
        id_progresso_aula: progress.id,
        status: PlaybackSessionStatus.ACTIVE,
        sequencia: 0,
        ultima_posicao: Math.min(input.posicao_segundos, duration),
        ultimo_estado: PlaybackState.PLAYING,
        ultimo_heartbeat_em: now,
        expira_em: new Date(now.getTime() + SESSION_TIMEOUT_SECONDS * 1000),
      });
      await manager.save(session);
      return {
        id: session.id,
        sequencia: 0,
        duracao_segundos: duration,
        heartbeat_segundos: HEARTBEAT_SECONDS,
        expira_em: session.expira_em,
      };
    });
  }

  heartbeat(
    courseId: string,
    lessonId: string,
    sessionId: string,
    input: PlaybackHeartbeatDto,
    actor: AuthenticatedUser,
  ) {
    return this.processHeartbeat(
      courseId,
      lessonId,
      sessionId,
      input,
      actor,
      false,
    );
  }

  end(
    courseId: string,
    lessonId: string,
    sessionId: string,
    input: EndPlaybackDto,
    actor: AuthenticatedUser,
  ) {
    return this.processHeartbeat(
      courseId,
      lessonId,
      sessionId,
      { ...input, estado: PlaybackState.ENDED },
      actor,
      true,
    );
  }

  private async processHeartbeat(
    courseId: string,
    lessonId: string,
    sessionId: string,
    input: PlaybackHeartbeatDto,
    actor: AuthenticatedUser,
    close: boolean,
  ) {
    const result = await this.dataSource.transaction(async (manager) => {
      const session = await manager
        .getRepository(PlaybackSession)
        .createQueryBuilder('sessao')
        .setLock('pessimistic_write')
        .innerJoinAndSelect('sessao.progresso', 'progresso')
        .where('sessao.id = :sessionId', { sessionId })
        .getOne();
      if (!session)
        throw new NotFoundException('Sessão de reprodução não encontrada.');

      const enrollment = await this.loadEnrollment(
        manager,
        actor.userId,
        courseId,
      );
      const progress = this.requireUnlockedProgress(enrollment, lessonId);
      if (session.id_progresso_aula !== progress.id) {
        this.logger.warn(
          JSON.stringify({
            event: 'playback_session_mismatch',
            sessionId,
            lessonId,
          }),
        );
        throw new ForbiddenException('Sessão não pertence a esta aula.');
      }

      const duration = progress.aula.duracao_segundos;
      if (!duration || input.posicao_segundos > duration + 1) {
        throw new BadRequestException(
          'Posição fora da duração cadastrada do vídeo.',
        );
      }

      const samePayload =
        input.sequencia === session.sequencia &&
        Math.abs(Number(session.ultima_posicao) - input.posicao_segundos) <
          0.01 &&
        session.ultimo_estado === input.estado;
      if (samePayload) {
        return this.response(
          enrollment,
          progress,
          input.sequencia,
          false,
          'duplicado',
        );
      }
      if (session.status !== PlaybackSessionStatus.ACTIVE) {
        throw new ConflictException('Sessão de reprodução não está ativa.');
      }

      const now = this.clock.now();
      if (now.getTime() > new Date(session.expira_em).getTime()) {
        session.status = PlaybackSessionStatus.EXPIRED;
        await manager.save(session);
        this.logger.warn(
          JSON.stringify({
            event: 'playback_session_expired',
            sessionId,
            lessonId,
          }),
        );
        return { error: 'expired' } satisfies HeartbeatFailure;
      }
      if (input.sequencia !== session.sequencia + 1) {
        this.logger.warn(
          JSON.stringify({
            event: 'playback_invalid_sequence',
            sessionId,
            expected: session.sequencia + 1,
            received: input.sequencia,
          }),
        );
        throw new ConflictException('Sequência de heartbeat inválida.');
      }

      const previousPosition = Number(session.ultima_posicao);
      const currentPosition = Math.min(input.posicao_segundos, duration);
      const elapsed = Math.max(
        0,
        (now.getTime() - new Date(session.ultimo_heartbeat_em).getTime()) /
          1000,
      );
      if (session.ultimo_estado === PlaybackState.PLAYING) {
        progress.tempo_reproducao_validado_segundos =
          Number(progress.tempo_reproducao_validado_segundos) + elapsed;
      }
      const evaluation = evaluatePlaybackAdvance({
        ranges: progress.intervalos_assistidos ?? [],
        previousPosition,
        currentPosition,
        elapsedSeconds: elapsed,
        trustedPlaybackSeconds: Number(
          progress.tempo_reproducao_validado_segundos,
        ),
        wasPlaying: session.ultimo_estado === PlaybackState.PLAYING,
      });
      progress.intervalos_assistidos = evaluation.ranges;
      if (evaluation.reason === 'salto') {
        this.logger.warn(
          JSON.stringify({
            event: 'playback_excessive_speed_or_seek',
            sessionId,
            lessonId,
            delta: currentPosition - previousPosition,
            elapsed,
          }),
        );
      }

      progress.posicao_segundos = Math.round(currentPosition);
      updateLessonCoverage(progress, duration, now);
      session.sequencia = input.sequencia;
      session.ultima_posicao = currentPosition;
      session.ultimo_estado = input.estado;
      session.ultimo_heartbeat_em = now;
      session.expira_em = new Date(
        now.getTime() + SESSION_TIMEOUT_SECONDS * 1000,
      );
      if (close || input.estado === PlaybackState.ENDED || progress.concluida) {
        session.status = PlaybackSessionStatus.ENDED;
      }
      await manager.save(progress);
      await manager.save(session);
      await this.updateEnrollment(manager, enrollment, lessonId, now);
      return this.response(
        enrollment,
        progress,
        input.sequencia,
        evaluation.credited,
        evaluation.reason,
      );
    });

    if ('error' in result) {
      throw new ConflictException(
        'Sessão expirada. Inicie uma nova reprodução.',
      );
    }
    return result;
  }

  private async loadEnrollment(
    manager: EntityManager,
    userId: string,
    courseId: string,
  ) {
    const enrollment = await manager
      .getRepository(Matricula)
      .createQueryBuilder('matricula')
      .setLock('pessimistic_write', undefined, ['matricula'])
      .innerJoinAndSelect('matricula.curso', 'curso')
      .innerJoinAndSelect('matricula.usuario', 'usuario')
      .innerJoinAndSelect('matricula.aulas', 'progresso')
      .innerJoinAndSelect('progresso.aula', 'aula')
      .where('matricula.id_usuario = :userId', { userId })
      .andWhere('matricula.id_curso = :courseId', { courseId })
      .getOne();
    if (!enrollment) throw new NotFoundException('Matrícula não encontrada.');
    return enrollment;
  }

  private requireUnlockedProgress(enrollment: Matricula, lessonId: string) {
    const progress = [...enrollment.aulas].sort(
      (left, right) => left.ordem_snapshot - right.ordem_snapshot,
    );
    const index = progress.findIndex((item) => item.id_aula === lessonId);
    if (index < 0)
      throw new NotFoundException('Aula não pertence à matrícula.');
    if (index > 0 && !progress[index - 1].concluida) {
      this.logger.warn(
        JSON.stringify({
          event: 'playback_locked_lesson',
          enrollmentId: enrollment.id,
          lessonId,
        }),
      );
      throw new ForbiddenException('Conclua a aula anterior primeiro.');
    }
    return progress[index];
  }

  private async updateEnrollment(
    manager: EntityManager,
    enrollment: Matricula,
    lessonId: string,
    now: Date,
  ) {
    const progress = [...enrollment.aulas].sort(
      (left, right) => left.ordem_snapshot - right.ordem_snapshot,
    );
    const completed = progress.filter((item) => item.concluida).length;
    enrollment.progresso =
      completed === progress.length
        ? 100
        : Math.round(
            progress.reduce(
              (total, item) => total + Number(item.percentual),
              0,
            ) / progress.length,
          );
    enrollment.ultima_aula_id =
      progress.find((item) => !item.concluida)?.id_aula ?? lessonId;
    enrollment.segundos_estudados = Math.round(
      progress.reduce(
        (total, item) =>
          total + watchedSeconds(item.intervalos_assistidos ?? []),
        0,
      ),
    );

    if (completed === progress.length && !enrollment.conclusao) {
      enrollment.conclusao = true;
      enrollment.concluido_em = now;
      await manager.save(enrollment);
      await manager.save(
        manager.create(Certificado, {
          id_matricula: enrollment.id,
          codigo: randomBytes(16).toString('hex').toUpperCase(),
          nome_aluno: enrollment.usuario.name,
          nome_curso: enrollment.curso.nome,
          carga_horaria: enrollment.curso.carga_horaria ?? 0,
          concluido_em: now,
          status: CertificadoStatus.VALIDO,
        }),
      );
    } else {
      await manager.save(enrollment);
    }
  }

  private response(
    enrollment: Matricula,
    current: ProgressoAula,
    sequence: number,
    credited: boolean,
    reason: string,
  ) {
    const progress = [...enrollment.aulas].sort(
      (left, right) => left.ordem_snapshot - right.ordem_snapshot,
    );
    return {
      sequencia: sequence,
      creditado: credited,
      motivo: reason,
      aula: {
        percentual: Number(current.percentual),
        posicao_segundos: current.posicao_segundos,
        concluida: current.concluida,
      },
      matricula: {
        progresso: Number(enrollment.progresso),
        conclusao: enrollment.conclusao,
      },
      proxima_aula_id:
        progress.find((item) => !item.concluida)?.id_aula ?? null,
    };
  }
}
