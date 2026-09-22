import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { AuthenticatedUser } from '../auth/authenticated-user.interface';
import { UserRole } from '../auth/user-role.enum';
import { User } from '../auth/user.entity';
import {
  Certificado,
  CertificadoStatus,
} from '../certificados/certificado.entity';
import { Aula } from '../cursos/aula.entity';
import { CursosService } from '../cursos/cursos.service';
import { Matricula } from './matricula.entity';
import { ProgressoAula } from './progresso-aula.entity';

@Injectable()
export class JornadaService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Aula)
    private readonly lessonsRepository: Repository<Aula>,
    @InjectRepository(Matricula)
    private readonly enrollmentsRepository: Repository<Matricula>,
    @InjectRepository(ProgressoAula)
    private readonly lessonProgressRepository: Repository<ProgressoAula>,
    @InjectRepository(Certificado)
    private readonly certificatesRepository: Repository<Certificado>,
    private readonly cursosService: CursosService,
  ) {}

  async enroll(courseId: string, actor: AuthenticatedUser) {
    const user = await this.usersRepository.findOneBy({ id: actor.userId });
    if (!user || !user.is_verified || user.role !== UserRole.ALUNO) {
      throw new ForbiddenException(
        'Somente alunos verificados podem iniciar cursos.',
      );
    }

    const existing = await this.enrollmentsRepository.findOneBy({
      id_usuario: actor.userId,
      id_curso: courseId,
    });
    if (existing) return this.getJourney(courseId, actor);

    const course = await this.cursosService.findOne(courseId, actor);
    if (!course.carga_horaria || course.carga_horaria <= 0) {
      throw new ConflictException(
        'O curso ainda não está pronto para matrícula.',
      );
    }
    const courseHours = course.carga_horaria;
    const lessons = await this.listCourseLessons(courseId);
    if (lessons.length === 0) {
      throw new ConflictException('O curso ainda não possui aulas.');
    }

    const completeImmediately =
      course.ambiente_teste && process.env.ALLOW_TEST_COURSE_BYPASS === 'true';

    try {
      await this.dataSource.transaction(async (manager) => {
        const completedAt = completeImmediately ? new Date() : null;
        const enrollment = await manager.save(
          manager.create(Matricula, {
            id_usuario: actor.userId,
            id_curso: courseId,
            progresso: completeImmediately ? 100 : 0,
            conclusao: completeImmediately,
            concluido_em: completedAt,
            ultima_aula_id: completeImmediately
              ? lessons.at(-1)!.id
              : lessons[0].id,
            segundos_estudados: 0,
          }),
        );
        await manager.save(
          ProgressoAula,
          lessons.map((lesson, index) =>
            manager.create(ProgressoAula, {
              id_matricula: enrollment.id,
              id_aula: lesson.id,
              ordem_snapshot: index + 1,
              intervalos_assistidos: [],
              duracao_segundos: lesson.duracao_segundos,
              posicao_segundos: 0,
              percentual: completeImmediately ? 100 : 0,
              tempo_reproducao_validado_segundos: 0,
              concluida: completeImmediately,
              concluida_em: completedAt,
            }),
          ),
        );
        if (completeImmediately) {
          await manager.save(
            manager.create(Certificado, {
              id_matricula: enrollment.id,
              codigo: randomBytes(16).toString('hex').toUpperCase(),
              nome_aluno: user.name,
              nome_curso: course.nome,
              carga_horaria: courseHours,
              concluido_em: completedAt!,
              status: CertificadoStatus.VALIDO,
            }),
          );
        }
      });
    } catch (error) {
      if (
        !(
          error instanceof QueryFailedError &&
          (error.driverError as { code?: string }).code === '23505'
        )
      ) {
        throw error;
      }
    }
    return this.getJourney(courseId, actor);
  }

  async listEnrollments(actor: AuthenticatedUser) {
    const enrollments = await this.enrollmentsRepository.find({
      where: { id_usuario: actor.userId },
      relations: { curso: true, aulas: true },
      order: { updated_at: 'DESC' },
    });
    const summaries = await Promise.all(
      enrollments.map(async (enrollment) => {
        try {
          const course = await this.cursosService.findOne(
            enrollment.id_curso,
            actor,
          );
          return {
            id: enrollment.id,
            progresso: Number(enrollment.progresso),
            conclusao: enrollment.conclusao,
            concluido_em: enrollment.concluido_em,
            ultima_aula_id: enrollment.ultima_aula_id,
            segundos_estudados: enrollment.segundos_estudados,
            data_matricula: enrollment.data_matricula,
            aulas_concluidas: enrollment.aulas.filter((item) => item.concluida)
              .length,
            total_aulas: enrollment.aulas.length,
            curso: course,
          };
        } catch (error) {
          if (error instanceof NotFoundException) return null;
          throw error;
        }
      }),
    );
    return summaries.filter((summary) => summary !== null);
  }

  async metrics() {
    const [
      matriculas_iniciadas,
      aulas_concluidas,
      cursos_concluidos,
      certificados_emitidos,
    ] = await Promise.all([
      this.enrollmentsRepository.count(),
      this.lessonProgressRepository.countBy({ concluida: true }),
      this.enrollmentsRepository.countBy({ conclusao: true }),
      this.certificatesRepository.count(),
    ]);
    return {
      matriculas_iniciadas,
      aulas_concluidas,
      cursos_concluidos,
      certificados_emitidos,
    };
  }

  async getJourney(courseId: string, actor: AuthenticatedUser) {
    const course = await this.cursosService.findOne(courseId, actor);
    const lessons = await this.listCourseLessons(courseId);

    if (actor.role !== UserRole.ALUNO) {
      return {
        curso: course,
        matricula: null,
        modo: 'preview',
        aulas: lessons.map((lesson) => ({
          ...this.lessonPayload(lesson, true),
          status: 'disponivel',
          percentual: 0,
          posicao_segundos: 0,
        })),
      };
    }

    const enrollment = await this.enrollmentsRepository.findOne({
      where: { id_usuario: actor.userId, id_curso: courseId },
      relations: {
        aulas: {
          aula: { questionario: { perguntas: { alternativas: true } } },
        },
      },
    });
    if (!enrollment) {
      return {
        curso: course,
        matricula: null,
        modo: 'aluno',
        aulas: lessons.map((lesson) => ({
          ...this.lessonPayload(lesson, false),
          status: 'bloqueada',
          percentual: 0,
          posicao_segundos: 0,
        })),
      };
    }

    const progress = [...enrollment.aulas].sort(
      (a, b) => a.ordem_snapshot - b.ordem_snapshot,
    );
    const certificate = enrollment.conclusao
      ? await this.certificatesRepository.findOneBy({
          id_matricula: enrollment.id,
        })
      : null;
    return {
      curso: course,
      modo: 'aluno',
      matricula: {
        id: enrollment.id,
        progresso: Number(enrollment.progresso),
        conclusao: enrollment.conclusao,
        concluido_em: enrollment.concluido_em,
        ultima_aula_id: enrollment.ultima_aula_id,
        segundos_estudados: enrollment.segundos_estudados,
      },
      certificado: certificate ? this.certificateSummary(certificate) : null,
      aulas: progress.map((item, index) => {
        const unlocked = index === 0 || progress[index - 1].concluida;
        const status = item.concluida
          ? 'concluida'
          : unlocked
            ? 'disponivel'
            : 'bloqueada';
        return {
          ...this.lessonPayload(item.aula, unlocked || item.concluida),
          ordem: item.ordem_snapshot,
          status,
          percentual: Number(item.percentual),
          posicao_segundos: item.posicao_segundos,
        };
      }),
    };
  }

  private listCourseLessons(courseId: string) {
    return this.lessonsRepository.find({
      where: { curso: { id: courseId } },
      relations: { questionario: { perguntas: { alternativas: true } } },
      order: { ordem: 'ASC', titulo: 'ASC' },
    });
  }

  private lessonPayload(lesson: Aula, unlocked: boolean) {
    return {
      id: lesson.id,
      titulo: lesson.titulo,
      descricao: lesson.descricao,
      tipo: lesson.tipo,
      duracao_minutos: lesson.duracao_minutos,
      duracao_segundos: lesson.duracao_segundos,
      ordem: lesson.ordem,
      url_video: unlocked ? lesson.url_video : null,
      questionario:
        unlocked && lesson.questionario
          ? {
              id: lesson.questionario.id,
              nota_minima: Number(lesson.questionario.nota_minima),
              max_tentativas: lesson.questionario.max_tentativas,
              pontos_base: lesson.questionario.pontos_base,
              perguntas: [...lesson.questionario.perguntas]
                .sort((a, b) => a.ordem - b.ordem)
                .map((pergunta) => ({
                  id: pergunta.id,
                  enunciado: pergunta.enunciado,
                  ordem: pergunta.ordem,
                  pontos: pergunta.pontos,
                  alternativas: [...pergunta.alternativas]
                    .sort((a, b) => a.ordem - b.ordem)
                    .map((alternativa) => ({
                      id: alternativa.id,
                      texto: alternativa.texto,
                      ordem: alternativa.ordem,
                    })),
                })),
            }
          : null,
    };
  }

  private certificateSummary(certificate: Certificado) {
    return {
      id: certificate.id,
      codigo: certificate.codigo,
      nome_aluno: certificate.nome_aluno,
      nome_curso: certificate.nome_curso,
      carga_horaria: certificate.carga_horaria,
      concluido_em: certificate.concluido_em,
      emitido_em: certificate.emitido_em,
      status: certificate.status,
    };
  }
}
