import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  In,
  IsNull,
  LessThanOrEqual,
  Not,
  QueryRunner,
  Repository,
} from 'typeorm';
import { Aula, AulaTipo } from './aula.entity';
import { CursoStatus } from './curso.entity';

const DEFAULT_VALIDATION_TTL_MINUTES = 15;
const REQUEST_TIMEOUT_MS = 5_000;
const VALIDATION_INTERVAL_MS = 60_000;
const VALIDATION_CONCURRENCY = 3;
const VALIDATION_BATCH_SIZE = 100;
const VALIDATION_LOCK_ID = 2026100301;

export interface CourseVideoAvailability {
  available: boolean;
  pendingValidation: boolean;
  unavailableLessons: Array<{ id: string; titulo: string }>;
}

@Injectable()
export class YoutubeVideoValidationService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(YoutubeVideoValidationService.name);
  private validationTimer?: ReturnType<typeof setInterval>;
  private running = false;

  constructor(
    @InjectRepository(Aula)
    private readonly lessonsRepository: Repository<Aula>,
    private readonly dataSource: DataSource,
  ) {}

  onModuleInit() {
    if (process.env.YOUTUBE_VALIDATION_WORKER_ENABLED === 'false') return;
    this.validationTimer = setInterval(() => {
      void this.revalidateStaleVideos();
    }, VALIDATION_INTERVAL_MS);
    this.validationTimer.unref();
  }

  onModuleDestroy() {
    if (this.validationTimer) clearInterval(this.validationTimer);
  }

  nextValidationAt(validatedAt: Date) {
    return new Date(
      validatedAt.getTime() + this.validationTtlMinutes() * 60_000,
    );
  }

  async validateVideo(videoId: string): Promise<boolean> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const validationUrl =
      'https://www.youtube.com/oembed?format=json&url=' +
      encodeURIComponent(videoUrl);

    try {
      const response = await fetch(validationUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      if (response.ok) return true;
      if (
        response.status >= 400 &&
        response.status < 500 &&
        response.status !== 408 &&
        response.status !== 429
      )
        return false;
      throw new ServiceUnavailableException(
        'O YouTube não respondeu à validação do vídeo. Tente novamente.',
      );
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      throw new ServiceUnavailableException(
        'Não foi possível validar o vídeo no YouTube. Tente novamente.',
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  async getCachedAvailability(courseIds: string[]) {
    const availability = new Map<string, CourseVideoAvailability>();
    if (courseIds.length === 0) return availability;
    const lessons = await this.lessonsRepository.find({
      where: { curso: { id: In(courseIds) }, tipo: AulaTipo.VIDEO },
      relations: { curso: true },
      order: { ordem: 'ASC' },
    });
    for (const courseId of courseIds) {
      availability.set(courseId, {
        available: true,
        pendingValidation: false,
        unavailableLessons: [],
      });
    }
    for (const lesson of lessons) {
      const courseAvailability = availability.get(lesson.curso.id);
      if (!courseAvailability) continue;
      if (lesson.youtube_embeddable === false) {
        courseAvailability.available = false;
        courseAvailability.unavailableLessons.push({
          id: lesson.id,
          titulo: lesson.titulo,
        });
      } else if (lesson.youtube_embeddable === null) {
        courseAvailability.available = false;
        courseAvailability.pendingValidation = true;
      }
    }
    return availability;
  }

  async revalidateStaleVideos() {
    if (this.running) return;
    this.running = true;
    let runner: QueryRunner | undefined;
    let lockAcquired = false;
    try {
      runner = this.dataSource.createQueryRunner();
      await runner.connect();
      const lockRows = (await runner.query(
        'SELECT pg_try_advisory_lock($1) AS acquired',
        [VALIDATION_LOCK_ID],
      )) as Array<{ acquired: boolean }>;
      if (!lockRows[0]?.acquired) return;
      lockAcquired = true;

      const cycleStartedAt = new Date();
      const repository = runner.manager.getRepository(Aula);
      const pending = await repository.find({
        where: {
          tipo: AulaTipo.VIDEO,
          curso: { status: CursoStatus.PUBLICADO },
          youtube_video_id: Not(IsNull()),
          youtube_proxima_validacao_em: LessThanOrEqual(cycleStartedAt),
        },
        order: { youtube_proxima_validacao_em: 'ASC', id: 'ASC' },
        take: VALIDATION_BATCH_SIZE,
      });
      let next = 0;
      const workerResults = await Promise.allSettled(
        Array.from(
          { length: Math.min(VALIDATION_CONCURRENCY, pending.length) },
          async () => {
            while (next < pending.length) {
              const lesson = pending[next++];
              const videoId = lesson.youtube_video_id;
              if (!videoId) continue;
              const criteria = {
                id: lesson.id,
                youtube_video_id: videoId,
                youtube_proxima_validacao_em: LessThanOrEqual(cycleStartedAt),
              };
              let available: boolean;
              try {
                available = await this.validateVideo(videoId);
              } catch (error) {
                await repository.update(criteria, {
                  youtube_proxima_validacao_em: this.nextValidationAt(
                    new Date(),
                  ),
                });
                this.logger.warn(
                  `Falha temporária ao validar vídeo da aula ${lesson.id}: ${error instanceof Error ? error.message : String(error)}`,
                );
                continue;
              }
              const validatedAt = new Date();
              await repository.update(criteria, {
                youtube_embeddable: available,
                youtube_validado_em: validatedAt,
                youtube_proxima_validacao_em:
                  this.nextValidationAt(validatedAt),
              });
            }
          },
        ),
      );
      for (const result of workerResults) {
        if (result.status === 'rejected') {
          this.logger.error(
            `Falha ao persistir validação de vídeo: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Falha no ciclo de validação de vídeos: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      if (lockAcquired && runner) {
        try {
          await runner.query('SELECT pg_advisory_unlock($1)', [
            VALIDATION_LOCK_ID,
          ]);
        } catch (error) {
          this.logger.error(
            `Falha ao liberar o lock de validação: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
      if (runner) {
        try {
          await runner.release();
        } catch (error) {
          this.logger.error(
            `Falha ao liberar a conexão de validação: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
      this.running = false;
    }
  }

  async scheduleLessonValidation(courseId: string, lessonId: string) {
    const lesson = await this.lessonsRepository.findOne({
      where: {
        id: lessonId,
        curso: { id: courseId },
        tipo: AulaTipo.VIDEO,
      },
    });
    if (!lesson?.youtube_video_id) {
      throw new NotFoundException('Aula de vídeo não encontrada.');
    }
    const now = new Date();
    const recentlyValidated =
      lesson.youtube_validado_em &&
      now.getTime() - lesson.youtube_validado_em.getTime() < 60_000;
    if (!recentlyValidated) {
      await this.lessonsRepository.update(
        { id: lesson.id, youtube_video_id: lesson.youtube_video_id },
        { youtube_proxima_validacao_em: now },
      );
    }
    return {
      disponivel: lesson.youtube_embeddable === true,
      validado_em: lesson.youtube_validado_em,
      validacao_pendente: !recentlyValidated,
    };
  }

  private validationTtlMinutes() {
    const configured = Number(process.env.YOUTUBE_VALIDATION_TTL_MINUTES);
    return Number.isFinite(configured) && configured > 0
      ? configured
      : DEFAULT_VALIDATION_TTL_MINUTES;
  }
}
