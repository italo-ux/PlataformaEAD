import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { randomBytes } from 'node:crypto';
import { AuthenticatedUser } from '../auth/authenticated-user.interface';
import { UserRole } from '../auth/user-role.enum';
import { Matricula } from '../jornada/matricula.entity';
import { ProgressoAula } from '../jornada/progresso-aula.entity';
import {
  trimWatchedRanges,
  updateLessonCoverage,
  watchedSeconds,
} from '../jornada/progress-policy';
import { Aula, AulaTipo } from './aula.entity';
import { Curso, CursoStatus } from './curso.entity';
import { CreateCursoDto } from './dto/create-curso.dto';
import { UpdateCursoDto } from './dto/update-curso.dto';
import { extractYoutubeVideoId } from './youtube-video.util';
import { TrilhaCurso } from '../trilhas/trilha-curso.entity';
import {
  Certificado,
  CertificadoStatus,
} from '../certificados/certificado.entity';
import {
  CourseVideoAvailability,
  YoutubeVideoValidationService,
} from './youtube-video-validation.service';

export type CursoComDisponibilidade = Curso & {
  conteudo_indisponivel: boolean;
  validacao_pendente: boolean;
  status_conteudo: 'disponivel' | 'indisponivel' | 'validacao_pendente';
  videos_indisponiveis: Array<{ id: string; titulo: string }>;
};

@Injectable()
export class CursosService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Curso)
    private readonly cursosRepository: Repository<Curso>,
    @InjectRepository(Aula)
    private readonly aulasRepository: Repository<Aula>,
    @InjectRepository(Matricula)
    private readonly matriculasRepository: Repository<Matricula>,
    private readonly youtubeValidation: YoutubeVideoValidationService,
  ) {}

  create(createCursoDto: CreateCursoDto, actor: AuthenticatedUser) {
    this.assertTestCourseModeAllowed(createCursoDto.ambiente_teste);
    const curso = this.cursosRepository.create({
      ...createCursoDto,
      id_instrutor: actor.userId,
    });
    return this.cursosRepository.save(curso);
  }

  async findAll(actor?: AuthenticatedUser) {
    const where =
      actor?.role === UserRole.ALUNO
        ? { status: CursoStatus.PUBLICADO }
        : actor?.role === UserRole.PROFESSOR
          ? [{ status: CursoStatus.PUBLICADO }, { id_instrutor: actor.userId }]
          : undefined;
    const courses = await this.cursosRepository.find({
      where,
      order: { nome: 'ASC' },
    });
    if (!actor) return courses;

    const checked = await Promise.all(
      courses.map((course) => this.withAvailability(course)),
    );
    return actor.role === UserRole.ALUNO
      ? checked.filter((course) => !course.conteudo_indisponivel)
      : checked;
  }

  async findOne(id: string, actor?: AuthenticatedUser) {
    const curso = await this.cursosRepository.findOneBy({ id });

    const hiddenFromActor =
      actor?.role === UserRole.ALUNO
        ? curso?.status !== CursoStatus.PUBLICADO
        : actor?.role === UserRole.PROFESSOR
          ? curso?.status === CursoStatus.RASCUNHO &&
            curso.id_instrutor !== actor.userId
          : false;
    if (!curso || hiddenFromActor) {
      throw new NotFoundException('Curso não encontrado');
    }

    if (!actor) return curso;
    const checked = await this.withAvailability(curso);
    if (actor.role === UserRole.ALUNO && checked.conteudo_indisponivel) {
      throw new NotFoundException('Curso não encontrado');
    }
    return checked;
  }

  async findManageable(id: string, actor: AuthenticatedUser) {
    const curso = await this.findOne(id);
    if (actor.role !== UserRole.ADMIN && curso.id_instrutor !== actor.userId) {
      throw new ForbiddenException('Você não pode gerenciar este curso');
    }
    return curso;
  }

  async validateLessonVideo(
    courseId: string,
    lessonId: string,
    actor: AuthenticatedUser,
  ) {
    await this.findOne(courseId, actor);
    return this.youtubeValidation.validateLesson(courseId, lessonId);
  }

  async publish(id: string, actor: AuthenticatedUser) {
    const curso = await this.findManageable(id, actor);
    const lessons = await this.aulasRepository.find({
      where: { curso: { id } },
      relations: { questionario: { perguntas: { alternativas: true } } },
      order: { ordem: 'ASC' },
    });
    if (
      !curso.carga_horaria ||
      curso.carga_horaria <= 0 ||
      lessons.length === 0
    ) {
      throw new ConflictException(
        'Informe uma carga horária positiva e cadastre ao menos uma aula antes de publicar.',
      );
    }
    const preparedLessons = lessons.map((lesson) => {
      if (lesson.tipo === AulaTipo.QUESTIONARIO) {
        if (
          !lesson.questionario ||
          lesson.questionario.perguntas.length === 0
        ) {
          throw new ConflictException(
            `Cadastre ao menos uma pergunta no questionário "${lesson.titulo}" antes de publicar.`,
          );
        }
        return { lesson, videoId: null };
      }
      const videoId = extractYoutubeVideoId(lesson.url_video ?? '');
      if (
        !videoId ||
        !lesson.duracao_segundos ||
        lesson.duracao_segundos <= 0
      ) {
        throw new ConflictException(
          `Informe uma URL válida e a duração em segundos da aula "${lesson.titulo}" antes de publicar.`,
        );
      }
      return { lesson, videoId };
    });

    for (const { lesson, videoId } of preparedLessons) {
      if (!videoId) continue;
      const available = await this.youtubeValidation.validateVideo(videoId);
      lesson.youtube_video_id = videoId;
      lesson.youtube_embeddable = available;
      lesson.youtube_validado_em = new Date();
      if (!available) {
        throw new ConflictException(
          `O vídeo da aula "${lesson.titulo}" foi removido, é privado ou não permite incorporação.`,
        );
      }
    }

    return this.dataSource.transaction(async (manager) => {
      const lockedCourse = await manager
        .getRepository(Curso)
        .createQueryBuilder('curso')
        .setLock('pessimistic_write')
        .where('curso.id = :id', { id })
        .getOne();
      if (!lockedCourse) throw new NotFoundException('Curso não encontrado');

      const lessonRepository = manager.getRepository(Aula);
      for (const { lesson, videoId } of preparedLessons) {
        lesson.youtube_video_id = videoId;
        if (videoId)
          lesson.duracao_minutos = Math.ceil(lesson.duracao_segundos! / 60);
        await lessonRepository.save(lesson);
      }
      await this.revalidateIncompleteEnrollments(manager, id, lessons);

      lockedCourse.status = CursoStatus.PUBLICADO;
      lockedCourse.publicado_em = new Date();
      return manager.save(lockedCourse);
    });
  }

  private async revalidateIncompleteEnrollments(
    manager: import('typeorm').EntityManager,
    courseId: string,
    lessons: Aula[],
  ) {
    const enrollments = await manager.getRepository(Matricula).find({
      where: { id_curso: courseId, conclusao: false },
      relations: { aulas: true, usuario: true, curso: true },
    });
    const durationByLesson = new Map(
      lessons.map((lesson) => [lesson.id, lesson.duracao_segundos!]),
    );
    for (const enrollment of enrollments) {
      const progress = [...enrollment.aulas].sort(
        (left, right) => left.ordem_snapshot - right.ordem_snapshot,
      );
      for (const item of progress) {
        const duration = durationByLesson.get(item.id_aula);
        if (!duration) continue;
        item.intervalos_assistidos = trimWatchedRanges(
          item.intervalos_assistidos ?? [],
          duration,
        );
        const uniqueSeconds = updateLessonCoverage(item, duration, new Date());
        item.tempo_reproducao_validado_segundos = uniqueSeconds / 2;
        item.posicao_segundos = Math.min(item.posicao_segundos, duration);
      }
      if (progress.length > 0) {
        await manager.save(ProgressoAula, progress);
      }
      const allCompleted =
        progress.length > 0 && progress.every((item) => item.concluida);
      enrollment.progresso = allCompleted
        ? 100
        : progress.length > 0
          ? Math.round(
              progress.reduce(
                (total, item) => total + Number(item.percentual),
                0,
              ) / progress.length,
            )
          : 0;
      enrollment.ultima_aula_id =
        progress.find((item) => !item.concluida)?.id_aula ??
        progress.at(-1)?.id_aula ??
        null;
      enrollment.segundos_estudados = Math.round(
        progress.reduce(
          (total, item) =>
            total + watchedSeconds(item.intervalos_assistidos ?? []),
          0,
        ),
      );
      if (allCompleted) {
        enrollment.conclusao = true;
        enrollment.concluido_em = new Date();
      }
      await manager.save(enrollment);
      if (
        enrollment.conclusao &&
        !(await manager.getRepository(Certificado).existsBy({
          id_matricula: enrollment.id,
        }))
      ) {
        await manager.save(
          manager.create(Certificado, {
            id_matricula: enrollment.id,
            codigo: randomBytes(16).toString('hex').toUpperCase(),
            nome_aluno: enrollment.usuario.name,
            nome_curso: enrollment.curso.nome,
            carga_horaria: enrollment.curso.carga_horaria ?? 0,
            concluido_em: enrollment.concluido_em!,
            status: CertificadoStatus.VALIDO,
          }),
        );
      }
    }
  }

  async update(
    id: string,
    updateCursoDto: UpdateCursoDto,
    actor: AuthenticatedUser,
  ) {
    const curso = await this.findManageable(id, actor);
    if (curso.status === CursoStatus.PUBLICADO) {
      throw new ConflictException(
        'Cursos publicados não podem ser editados. Corrija somente URLs de vídeos indisponíveis.',
      );
    }
    if (
      updateCursoDto.ambiente_teste !== undefined &&
      updateCursoDto.ambiente_teste !== curso.ambiente_teste
    ) {
      this.assertTestCourseModeAllowed(updateCursoDto.ambiente_teste);
      if (await this.hasEnrollments(id)) {
        throw new ConflictException(
          'O ambiente de teste não pode ser alterado após a primeira matrícula.',
        );
      }
    }
    const updatedCurso = this.cursosRepository.merge(curso, updateCursoDto);
    return this.cursosRepository.save(updatedCurso);
  }

  async remove(id: string, actor: AuthenticatedUser) {
    const curso = await this.findManageable(id, actor);
    if (curso.status === CursoStatus.PUBLICADO) {
      throw new ConflictException(
        'Cursos publicados não podem ser excluídos. Corrija somente URLs de vídeos indisponíveis.',
      );
    }
    if (await this.hasEnrollments(id)) {
      throw new ConflictException(
        'Cursos com matrículas não podem ser excluídos.',
      );
    }
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(TrilhaCurso, { id_curso: id });
      await manager
        .createQueryBuilder()
        .delete()
        .from(Aula)
        .where('"id_curso" = :id', { id })
        .execute();
      await manager.remove(Curso, curso);
    });
  }

  hasEnrollments(courseId: string) {
    return this.matriculasRepository.existsBy({ id_curso: courseId });
  }

  private assertTestCourseModeAllowed(enabled?: boolean) {
    if (enabled && process.env.ALLOW_TEST_COURSE_BYPASS !== 'true') {
      throw new ForbiddenException(
        'O ambiente de teste está desabilitado nesta instalação.',
      );
    }
  }

  private async withAvailability(
    course: Curso,
  ): Promise<CursoComDisponibilidade> {
    const availability: CourseVideoAvailability =
      course.status === CursoStatus.PUBLICADO
        ? await this.youtubeValidation.checkCourse(course.id)
        : {
            available: true,
            pendingValidation: false,
            unavailableLessons: [],
          };
    const contentStatus: CursoComDisponibilidade['status_conteudo'] =
      availability.pendingValidation
        ? 'validacao_pendente'
        : availability.available
          ? 'disponivel'
          : 'indisponivel';
    return Object.assign(course, {
      conteudo_indisponivel: !availability.available,
      validacao_pendente: availability.pendingValidation,
      status_conteudo: contentStatus,
      videos_indisponiveis: availability.unavailableLessons,
    });
  }
}
