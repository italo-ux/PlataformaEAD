import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { AuthenticatedUser } from '../auth/authenticated-user.interface';
import { Certificado } from '../certificados/certificado.entity';
import { CertificateIssuanceService } from '../certificados/certificate-issuance.service';
import { AulaTipo } from '../cursos/aula.entity';
import { QUIZ_MAX_ATTEMPTS, QUIZ_PASS_PERCENTAGE } from '../cursos/quiz-policy';
import {
  Questionario,
  RespostaQuestionario,
  TentativaQuestionario,
} from '../cursos/questionario.entity';
import { SubmitQuestionarioDto } from './dto/submit-questionario.dto';
import { Matricula } from './matricula.entity';
import { ProgressoAula } from './progresso-aula.entity';

@Injectable()
export class QuestionarioService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly certificateIssuance: CertificateIssuanceService,
  ) {}

  submit(
    courseId: string,
    lessonId: string,
    input: SubmitQuestionarioDto,
    actor: AuthenticatedUser,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const enrollmentRepository = manager.getRepository(Matricula);
      const lockedEnrollment = await enrollmentRepository.findOne({
        where: { id_usuario: actor.userId, id_curso: courseId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!lockedEnrollment)
        throw new ForbiddenException('Inicie o curso antes de responder.');

      // PostgreSQL não permite FOR UPDATE no lado anulável de LEFT JOINs.
      // A matrícula já está bloqueada; carregamos as relações em uma segunda
      // consulta, ainda dentro da mesma transação e sob o mesmo lock.
      const enrollment = await enrollmentRepository.findOne({
        where: { id: lockedEnrollment.id },
        relations: { curso: true, usuario: true, aulas: { aula: true } },
      });
      if (!enrollment)
        throw new ForbiddenException('Inicie o curso antes de responder.');

      const progress = [...enrollment.aulas].sort(
        (a, b) => a.ordem_snapshot - b.ordem_snapshot,
      );
      const index = progress.findIndex((item) => item.id_aula === lessonId);
      if (index < 0)
        throw new NotFoundException('Aula não encontrada na matrícula.');
      if (index > 0 && !progress[index - 1].concluida) {
        throw new ForbiddenException('Conclua a aula anterior primeiro.');
      }
      const lessonProgress = progress[index];
      if (lessonProgress.concluida) {
        throw new ConflictException('Este questionário já foi concluído.');
      }
      if (lessonProgress.aula.tipo !== AulaTipo.QUESTIONARIO) {
        throw new BadRequestException('Esta aula não é um questionário.');
      }

      const quiz = await manager.getRepository(Questionario).findOne({
        where: { id_aula: lessonId },
        relations: { perguntas: { alternativas: true } },
      });
      if (!quiz) throw new NotFoundException('Questionário não encontrado.');

      const previousAttempts = await manager
        .getRepository(TentativaQuestionario)
        .countBy({
          id_questionario: quiz.id,
          id_matricula: enrollment.id,
        });
      if (previousAttempts >= QUIZ_MAX_ATTEMPTS) {
        throw new ConflictException('O limite de tentativas foi atingido.');
      }
      if (input.respostas.length !== quiz.perguntas.length) {
        throw new BadRequestException(
          'Responda todas as perguntas antes de finalizar.',
        );
      }
      const answerMap = new Map(
        input.respostas.map((answer) => [
          answer.pergunta_id,
          answer.alternativa_id,
        ]),
      );
      if (answerMap.size !== quiz.perguntas.length) {
        throw new BadRequestException(
          'Cada pergunta deve possuir uma única resposta.',
        );
      }

      let hits = 0;
      let earnedPoints = 0;
      const possiblePoints = quiz.perguntas.reduce(
        (total, question) => total + question.pontos,
        0,
      );
      const graded = quiz.perguntas.map((question) => {
        const selectedId = answerMap.get(question.id);
        const selected = question.alternativas.find(
          (alternative) => alternative.id === selectedId,
        );
        if (!selected)
          throw new BadRequestException(
            'Uma alternativa informada não pertence à pergunta.',
          );
        const correct = question.alternativas.find(
          (alternative) => alternative.correta,
        );
        if (!correct)
          throw new ConflictException(
            'O questionário possui uma pergunta sem resposta correta.',
          );
        if (selected.correta) {
          hits += 1;
          earnedPoints += question.pontos;
        }
        return { question, selected, correct };
      });
      const percentage =
        possiblePoints > 0
          ? Number(((earnedPoints / possiblePoints) * 100).toFixed(2))
          : 0;
      const approved = percentage >= QUIZ_PASS_PERCENTAGE;
      const attempt = await manager.save(
        manager.create(TentativaQuestionario, {
          id_questionario: quiz.id,
          id_matricula: enrollment.id,
          numero: previousAttempts + 1,
          acertos: hits,
          total_perguntas: quiz.perguntas.length,
          pontos_obtidos: earnedPoints + (approved ? quiz.pontos_base : 0),
          pontos_possiveis: possiblePoints + quiz.pontos_base,
          percentual: percentage,
          aprovado: approved,
        }),
      );
      await manager.save(
        RespostaQuestionario,
        graded.map(({ question, selected }) =>
          manager.create(RespostaQuestionario, {
            id_tentativa: attempt.id,
            id_pergunta: question.id,
            id_alternativa: selected.id,
            correta: selected.correta,
            pontos_obtidos: selected.correta ? question.pontos : 0,
          }),
        ),
      );

      if (approved && !lessonProgress.concluida) {
        lessonProgress.percentual = 100;
        lessonProgress.concluida = true;
        lessonProgress.concluida_em = new Date();
        await manager.save(lessonProgress);
        await this.refreshEnrollment(manager, enrollment, progress);
      }

      const attemptsRemaining = Math.max(0, QUIZ_MAX_ATTEMPTS - attempt.numero);
      const revealAnswerKey = !approved && attemptsRemaining === 0;

      return {
        tentativa_id: attempt.id,
        numero: attempt.numero,
        acertos: hits,
        total_perguntas: quiz.perguntas.length,
        percentual: percentage,
        aprovado: approved,
        pontos_obtidos: attempt.pontos_obtidos,
        tentativas_restantes: attemptsRemaining,
        gabarito_disponivel: revealAnswerKey,
        respostas: graded.map(({ question, selected, correct }) => ({
          pergunta_id: question.id,
          alternativa_selecionada_id: selected.id,
          alternativa_correta_id: revealAnswerKey ? correct.id : null,
          correta: selected.correta,
        })),
      };
    });
  }

  private async refreshEnrollment(
    manager: EntityManager,
    enrollment: Matricula,
    progress: ProgressoAula[],
  ) {
    const completed = progress.filter((item) => item.concluida).length;
    enrollment.progresso = Math.round((completed / progress.length) * 100);
    enrollment.ultima_aula_id =
      progress.find((item) => !item.concluida)?.id_aula ??
      progress.at(-1)?.id_aula ??
      null;
    const allCompleted = completed === progress.length;
    if (allCompleted) {
      enrollment.conclusao = true;
      enrollment.concluido_em = new Date();
    }
    await manager.save(enrollment);
    if (
      allCompleted &&
      !(await manager
        .getRepository(Certificado)
        .existsBy({ id_matricula: enrollment.id }))
    ) {
      await this.certificateIssuance.issue(manager, {
        enrollmentId: enrollment.id,
        studentName: enrollment.usuario.name,
        courseName: enrollment.curso.nome,
        courseHours: enrollment.curso.carga_horaria ?? 0,
        completedAt: enrollment.concluido_em!,
      });
    }
  }
}
