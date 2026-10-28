import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { AuthenticatedUser } from '../auth/authenticated-user.interface';
import { isTestCourseBypassEnabled } from '../common/runtime-policy';
import { UserRole } from '../auth/user-role.enum';
import { User } from '../auth/user.entity';
import { Certificado } from '../certificados/certificado.entity';
import { CertificateIssuanceService } from '../certificados/certificate-issuance.service';
import { Aula, AulaTipo } from '../cursos/aula.entity';
import { AulaPdf } from '../cursos/aula-pdf.entity';
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
    private readonly certificateIssuance: CertificateIssuanceService,
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
      course.ambiente_teste && isTestCourseBypassEnabled();

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
          await this.certificateIssuance.issue(manager, {
            enrollmentId: enrollment.id,
            studentName: user.name,
            courseName: course.nome,
            courseHours,
            completedAt: completedAt!,
          });
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
          aula: {
            questionario: { perguntas: { alternativas: true } },
            pdf_anexo: true,
          },
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

  async completePdfLesson(
    courseId: string,
    lessonId: string,
    actor: AuthenticatedUser,
  ) {
    await this.cursosService.findOne(courseId, actor);
    await this.dataSource.transaction(async (manager) => {
      const enrollmentRepository = manager.getRepository(Matricula);
      const locked = await enrollmentRepository.findOne({
        where: { id_usuario: actor.userId, id_curso: courseId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!locked)
        throw new ForbiddenException(
          'Inicie o curso antes de concluir a aula.',
        );
      const enrollment = await enrollmentRepository.findOne({
        where: { id: locked.id },
        relations: { curso: true, usuario: true, aulas: { aula: true } },
      });
      if (!enrollment) throw new NotFoundException('Matrícula não encontrada.');
      const progress = [...enrollment.aulas].sort(
        (left, right) => left.ordem_snapshot - right.ordem_snapshot,
      );
      const index = progress.findIndex((item) => item.id_aula === lessonId);
      if (index < 0)
        throw new NotFoundException('Aula não encontrada na matrícula.');
      if (index > 0 && !progress[index - 1].concluida) {
        throw new ForbiddenException('Conclua a aula anterior primeiro.');
      }
      const current = progress[index];
      if (current.aula.tipo !== AulaTipo.PDF) {
        throw new ConflictException('Esta aula não contém um PDF.');
      }
      if (
        !(await manager.getRepository(AulaPdf).existsBy({ id_aula: lessonId }))
      ) {
        throw new NotFoundException('PDF não encontrado.');
      }
      if (current.concluida) return;

      current.percentual = 100;
      current.concluida = true;
      current.concluida_em = new Date();
      await manager.save(current);
      enrollment.progresso = Math.round(
        progress.reduce((total, item) => total + Number(item.percentual), 0) /
          progress.length,
      );
      enrollment.ultima_aula_id =
        progress.find((item) => !item.concluida)?.id_aula ?? lessonId;
      const allCompleted = progress.every((item) => item.concluida);
      if (allCompleted && !enrollment.conclusao) {
        enrollment.conclusao = true;
        enrollment.concluido_em = new Date();
      }
      await manager.save(enrollment);
      if (allCompleted && enrollment.concluido_em) {
        if (
          !(await manager
            .getRepository(Certificado)
            .existsBy({ id_matricula: enrollment.id }))
        ) {
          await this.certificateIssuance.issue(manager, {
            enrollmentId: enrollment.id,
            studentName: enrollment.usuario.name,
            courseName: enrollment.curso.nome,
            courseHours: enrollment.curso.carga_horaria ?? 0,
            completedAt: enrollment.concluido_em,
          });
        }
      }
    });
    return this.getJourney(courseId, actor);
  }

  private listCourseLessons(courseId: string) {
    return this.lessonsRepository.find({
      where: { curso: { id: courseId } },
      relations: {
        questionario: { perguntas: { alternativas: true } },
        pdf_anexo: true,
      },
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
      pdf_nome_arquivo:
        unlocked && lesson.tipo === AulaTipo.PDF
          ? (lesson.pdf_anexo?.nome_arquivo ?? null)
          : null,
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
