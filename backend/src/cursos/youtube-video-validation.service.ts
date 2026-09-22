import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Aula, AulaTipo } from './aula.entity';

const DEFAULT_VALIDATION_TTL_MINUTES = 15;
const REQUEST_TIMEOUT_MS = 5_000;

export interface CourseVideoAvailability {
  available: boolean;
  pendingValidation: boolean;
  unavailableLessons: Array<{ id: string; titulo: string }>;
}

@Injectable()
export class YoutubeVideoValidationService {
  constructor(
    @InjectRepository(Aula)
    private readonly lessonsRepository: Repository<Aula>,
  ) {}

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
      if (response.status >= 400 && response.status < 500) return false;
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

  async checkCourse(
    courseId: string,
    force = false,
  ): Promise<CourseVideoAvailability> {
    const lessons = await this.lessonsRepository.find({
      where: { curso: { id: courseId }, tipo: AulaTipo.VIDEO },
      order: { ordem: 'ASC' },
    });
    const validationCutoff = new Date(
      Date.now() - this.validationTtlMinutes() * 60_000,
    );

    await Promise.all(
      lessons.map(async (lesson) => {
        const shouldValidate =
          force ||
          !lesson.youtube_validado_em ||
          lesson.youtube_validado_em < validationCutoff;
        if (!shouldValidate || !lesson.youtube_video_id) return;

        try {
          lesson.youtube_embeddable = await this.validateVideo(
            lesson.youtube_video_id,
          );
          lesson.youtube_validado_em = new Date();
          await this.lessonsRepository.save(lesson);
        } catch (error) {
          if (force) throw error;
          // Uma falha de rede não deve transformar um vídeo válido em excluído.
          // Mantemos o último estado conhecido e tentamos novamente após o TTL.
        }
      }),
    );

    const unavailableLessons = lessons
      .filter((lesson) => lesson.youtube_embeddable === false)
      .map((lesson) => ({ id: lesson.id, titulo: lesson.titulo }));
    const pendingValidation = lessons.some(
      (lesson) => lesson.youtube_embeddable === null,
    );

    return {
      available: unavailableLessons.length === 0 && !pendingValidation,
      pendingValidation,
      unavailableLessons,
    };
  }

  async validateLesson(courseId: string, lessonId: string) {
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

    lesson.youtube_embeddable = await this.validateVideo(
      lesson.youtube_video_id,
    );
    lesson.youtube_validado_em = new Date();
    await this.lessonsRepository.save(lesson);
    return {
      disponivel: lesson.youtube_embeddable,
      validado_em: lesson.youtube_validado_em,
    };
  }

  private validationTtlMinutes() {
    const configured = Number(process.env.YOUTUBE_VALIDATION_TTL_MINUTES);
    return Number.isFinite(configured) && configured > 0
      ? configured
      : DEFAULT_VALIDATION_TTL_MINUTES;
  }
}
