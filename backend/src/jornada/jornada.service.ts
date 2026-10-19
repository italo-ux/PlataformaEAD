import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { AuthenticatedUser } from '../auth/authenticated-user.interface';
import { UserRole } from '../auth/user-role.enum';
import { User } from '../auth/user.entity';
import { Certificado } from '../certificados/certificado.entity';
import { Aula } from '../cursos/aula.entity';
import { Curso, CursoStatus } from '../cursos/curso.entity';
import { Matricula } from './matricula.entity';
import { ProgressoAula } from './progresso-aula.entity';

@Injectable()
export class JornadaService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Curso)
    private readonly coursesRepository: Repository<Curso>,
    @InjectRepository(Aula)
    private readonly lessonsRepository: Repository<Aula>,
    @InjectRepository(Matricula)
    private readonly enrollmentsRepository: Repository<Matricula>,
    @InjectRepository(ProgressoAula)
    private readonly lessonProgressRepository: Repository<ProgressoAula>,
    @InjectRepository(Certificado)
    private readonly certificatesRepository: Repository<Certificado>,
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

    const course = await this.requirePublishedCourse(courseId);
    if (!course.carga_horaria || course.carga_horaria <= 0) {
      throw new ConflictException(
        'O curso ainda não está pronto para matrícula.',
      );
    }
    const lessons = await this.listCourseLessons(courseId);
    if (lessons.length === 0) {
      throw new ConflictException('O curso ainda não possui aulas.');
    }

    try {
      await this.dataSource.transaction(async (manager) => {
        const enrollment = await manager.save(
          manager.create(Matricula, {
            id_usuario: actor.userId,
            id_curso: courseId,
            progresso: 0,
            conclusao: false,
            concluido_em: null,
            ultima_aula_id: lessons[0].id,
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
              percentual: 0,
              tempo_reproducao_validado_segundos: 0,
              concluida: false,
              concluida_em: null,
            }),
          ),
        );
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

  async listEnrollments(userId: string) {
    const enrollments = await this.enrollmentsRepository.find({
      where: { id_usuario: userId },
      relations: { curso: true, aulas: true },
      order: { updated_at: 'DESC' },
    });
    return enrollments.map((enrollment) => ({
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
      curso: enrollment.curso,
    }));
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
    const course =
      actor.role === UserRole.ALUNO
        ? await this.requirePublishedCourse(courseId)
        : await this.requireCourse(courseId);
    const lessons = await this.listCourseLessons(courseId);

    if (actor.role !== UserRole.ALUNO) {
      return {
        curso: course,
        matricula: null,
        modo: 'preview',
        aulas: lessons.map((lesson) => ({
          ...lesson,
          status: 'disponivel',
          percentual: 0,
          posicao_segundos: 0,
        })),
      };
    }

    const enrollment = await this.enrollmentsRepository.findOne({
      where: { id_usuario: actor.userId, id_curso: courseId },
      relations: { aulas: { aula: true } },
    });
    if (!enrollment) {
      return {
        curso: course,
        matricula: null,
        modo: 'aluno',
        aulas: lessons.map((lesson) => ({
          id: lesson.id,
          titulo: lesson.titulo,
          descricao: lesson.descricao,
          duracao_minutos: lesson.duracao_minutos,
          duracao_segundos: lesson.duracao_segundos,
          ordem: lesson.ordem,
          url_video: null,
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
          id: item.aula.id,
          titulo: item.aula.titulo,
          descricao: item.aula.descricao,
          duracao_minutos: item.aula.duracao_minutos,
          duracao_segundos: item.aula.duracao_segundos,
          ordem: item.ordem_snapshot,
          url_video: unlocked || item.concluida ? item.aula.url_video : null,
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
      order: { ordem: 'ASC', titulo: 'ASC' },
    });
  }

  private async requireCourse(courseId: string) {
    const course = await this.coursesRepository.findOneBy({ id: courseId });
    if (!course) throw new NotFoundException('Curso não encontrado.');
    return course;
  }

  private async requirePublishedCourse(courseId: string) {
    const course = await this.coursesRepository.findOneBy({
      id: courseId,
      status: CursoStatus.PUBLICADO,
    });
    if (!course) throw new NotFoundException('Curso publicado não encontrado.');
    return course;
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
