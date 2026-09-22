/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/require-await */
import { DataSource } from 'typeorm';
import { UserRole } from '../auth/user-role.enum';
import { AulaTipo } from '../cursos/aula.entity';
import {
  Questionario,
  TentativaQuestionario,
} from '../cursos/questionario.entity';
import { Matricula } from './matricula.entity';
import { QuestionarioService } from './questionario.service';

describe('QuestionarioService', () => {
  const actor = {
    userId: '11111111-1111-4111-8111-111111111111',
    email: 'aluno@example.com',
    role: UserRole.ALUNO,
  };
  const questionOne = {
    id: '22222222-2222-4222-8222-222222222222',
    pontos: 7,
    alternativas: [
      { id: '33333333-3333-4333-8333-333333333333', correta: true },
      { id: '44444444-4444-4444-8444-444444444444', correta: false },
    ],
  };
  const questionTwo = {
    id: '55555555-5555-4555-8555-555555555555',
    pontos: 3,
    alternativas: [
      { id: '66666666-6666-4666-8666-666666666666', correta: true },
      { id: '77777777-7777-4777-8777-777777777777', correta: false },
    ],
  };

  function setup(previousAttempts: number) {
    const lessonProgress = {
      id_aula: '88888888-8888-4888-8888-888888888888',
      concluida: false,
      aula: { tipo: AulaTipo.QUESTIONARIO },
    };
    const enrollment = {
      id: '99999999-9999-4999-8999-999999999999',
      id_curso: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      aulas: [lessonProgress],
      curso: { nome: 'Curso', carga_horaria: 1 },
      usuario: { name: 'Aluno' },
      progresso: 0,
    };
    const enrollmentRepository = {
      findOne: jest.fn().mockResolvedValue(enrollment),
    };
    const quizRepository = {
      findOne: jest.fn().mockResolvedValue({
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        nota_minima: 70,
        max_tentativas: 3,
        pontos_base: 0,
        perguntas: [questionOne, questionTwo],
      }),
    };
    const attemptRepository = {
      countBy: jest.fn().mockResolvedValue(previousAttempts),
    };
    const manager = {
      getRepository: jest.fn((entity) => {
        if (entity === Matricula) return enrollmentRepository;
        if (entity === Questionario) return quizRepository;
        if (entity === TentativaQuestionario) return attemptRepository;
        return { existsBy: jest.fn().mockResolvedValue(false) };
      }),
      create: jest.fn((_entity, value) => value),
      save: jest.fn(async (first, second) => {
        const value = second ?? first;
        if (!Array.isArray(value) && typeof value?.numero === 'number') {
          return { id: 'attempt-id', ...value };
        }
        return value;
      }),
    };
    const dataSource = {
      transaction: jest.fn((work) => work(manager)),
    } as unknown as DataSource;
    return {
      service: new QuestionarioService(dataSource),
      enrollmentRepository,
      lessonProgress,
    };
  }

  const answers = (firstCorrect: boolean, secondCorrect: boolean) => ({
    respostas: [
      {
        pergunta_id: questionOne.id,
        alternativa_id: questionOne.alternativas[firstCorrect ? 0 : 1].id,
      },
      {
        pergunta_id: questionTwo.id,
        alternativa_id: questionTwo.alternativas[secondCorrect ? 0 : 1].id,
      },
    ],
  });

  it('aprova com 70% e não revela o gabarito', async () => {
    const context = setup(0);
    const result = await context.service.submit(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      context.lessonProgress.id_aula,
      answers(true, false),
      actor,
    );

    expect(result).toMatchObject({
      percentual: 70,
      aprovado: true,
      tentativas_restantes: 2,
      gabarito_disponivel: false,
    });
    expect(
      result.respostas.every(
        (answer) => answer.alternativa_correta_id === null,
      ),
    ).toBe(true);
    expect(context.lessonProgress.concluida).toBe(true);
  });

  it('mantém o gabarito oculto enquanto ainda existem tentativas', async () => {
    const context = setup(0);
    const result = await context.service.submit(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      context.lessonProgress.id_aula,
      answers(false, false),
      actor,
    );

    expect(result).toMatchObject({
      aprovado: false,
      tentativas_restantes: 2,
      gabarito_disponivel: false,
    });
    expect(
      result.respostas.every(
        (answer) => answer.alternativa_correta_id === null,
      ),
    ).toBe(true);
  });

  it('libera o gabarito somente após a terceira reprovação', async () => {
    const context = setup(2);
    const result = await context.service.submit(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      context.lessonProgress.id_aula,
      answers(false, false),
      actor,
    );

    expect(result).toMatchObject({
      numero: 3,
      aprovado: false,
      tentativas_restantes: 0,
      gabarito_disponivel: true,
    });
    expect(
      result.respostas.every((answer) => answer.alternativa_correta_id),
    ).toBe(true);
  });
});
