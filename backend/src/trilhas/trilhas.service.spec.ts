import { QueryFailedError, Repository } from 'typeorm';
import { Curso, CursoStatus } from '../cursos/curso.entity';
import { UserRole } from '../auth/user-role.enum';
import { TrilhaCurso } from './trilha-curso.entity';
import { Trilha } from './trilha.entity';
import { TrilhasService } from './trilhas.service';
import { UsuarioTrilha } from './usuario-trilha.entity';
import { CursosService } from '../cursos/cursos.service';
import { AuthenticatedUser } from '../auth/authenticated-user.interface';

describe('TrilhasService', () => {
  const course = {
    id: '11111111-1111-4111-8111-111111111111',
    nome: 'Curso real',
  } as Curso;
  const trail = {
    id: '22222222-2222-4222-8222-222222222222',
    nome: 'Trilha real',
    descricao: 'Descrição',
    capa: null,
    nivel: 'Iniciante',
    cursos: [],
  } as Trilha;

  function setup() {
    const trilhasRepository = {
      create: jest.fn((data: Partial<Trilha>) => ({ ...trail, ...data })),
      save: jest.fn((data: Trilha) => Promise.resolve(data)),
      find: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      remove: jest.fn(),
    };
    const vinculosRepository = {
      create: jest.fn((data: Partial<TrilhaCurso>) => data),
      save: jest.fn((data: TrilhaCurso[]) => Promise.resolve(data)),
      delete: jest.fn(),
    };
    const cursosRepository = { countBy: jest.fn() };
    const seguimentosRepository = {
      create: jest.fn((data: Partial<UsuarioTrilha>) => data),
      save: jest.fn((data: UsuarioTrilha) => Promise.resolve(data)),
      find: jest.fn(),
      findOneBy: jest.fn(),
      delete: jest.fn(),
    };
    const cursosService = {
      findVisibleByIds: jest.fn().mockResolvedValue([course]),
    };
    const service = new TrilhasService(
      trilhasRepository as unknown as Repository<Trilha>,
      vinculosRepository as unknown as Repository<TrilhaCurso>,
      cursosRepository as unknown as Repository<Curso>,
      seguimentosRepository as unknown as Repository<UsuarioTrilha>,
      cursosService as unknown as CursosService,
    );
    return {
      service,
      trilhasRepository,
      vinculosRepository,
      cursosRepository,
      cursosService,
      seguimentosRepository,
    };
  }

  it('creates a real trail and persists its ordered course links', async () => {
    const context = setup();
    context.cursosRepository.countBy.mockResolvedValue(1);
    context.trilhasRepository.findOne.mockResolvedValue({
      ...trail,
      cursos: [{ ordem: 1, id_curso: course.id } as TrilhaCurso],
    });

    await expect(
      context.service.create({
        nome: trail.nome,
        descricao: trail.descricao ?? undefined,
        nivel: trail.nivel ?? undefined,
        courseIds: [course.id],
      }),
    ).resolves.toMatchObject({
      id: trail.id,
      nome: trail.nome,
      cursos: [course],
    });
    expect(context.vinculosRepository.create).toHaveBeenCalledWith({
      id_trilha: trail.id,
      id_curso: course.id,
      ordem: 1,
    });
  });

  it('trata seguimentos simultâneos como uma única operação', async () => {
    const context = setup();
    context.trilhasRepository.findOneBy.mockResolvedValue(trail);
    context.seguimentosRepository.findOneBy.mockResolvedValue(null);
    context.seguimentosRepository.save.mockRejectedValue(
      new QueryFailedError(
        'INSERT',
        [],
        Object.assign(new Error('duplicate'), {
          code: '23505',
          constraint: 'uq_usuario_trilha_usuario_trilha',
        }),
      ),
    );
    await expect(
      context.service.follow(trail.id, {
        userId: 'aluno',
        email: 'aluno@example.com',
        role: UserRole.ALUNO,
      }),
    ).resolves.toEqual({ seguindo: true });
  });

  it('lists serialized trails with courses in their configured order', async () => {
    const context = setup();
    const secondCourse = { ...course, id: 'course-2', nome: 'Segundo' };
    context.cursosService.findVisibleByIds.mockResolvedValue([
      course,
      secondCourse,
    ]);
    context.trilhasRepository.find.mockResolvedValue([
      {
        ...trail,
        cursos: [
          { ordem: 2, id_curso: secondCourse.id } as TrilhaCurso,
          { ordem: 1, id_curso: course.id } as TrilhaCurso,
        ],
      },
    ]);

    const result = await context.service.findAll();

    expect(result[0].cursos.map(({ id }) => id)).toEqual([
      course.id,
      secondCourse.id,
    ]);
    expect(context.cursosService.findVisibleByIds).toHaveBeenCalledTimes(1);
    expect(context.cursosService.findVisibleByIds).toHaveBeenCalledWith(
      [secondCourse.id, course.id],
      undefined,
    );
    expect(context.trilhasRepository.find).toHaveBeenCalledWith({
      relations: { cursos: true },
      order: { nome: 'ASC' },
    });
  });

  it('consulta cursos compartilhados por várias trilhas em um único lote', async () => {
    const context = setup();
    context.trilhasRepository.find.mockResolvedValue([
      { ...trail, cursos: [{ id_curso: course.id, ordem: 1 }] },
      {
        ...trail,
        id: 'outra-trilha',
        cursos: [{ id_curso: course.id, ordem: 1 }],
      },
    ]);

    await expect(context.service.findAll()).resolves.toHaveLength(2);
    expect(context.cursosService.findVisibleByIds).toHaveBeenCalledTimes(1);
    expect(context.cursosService.findVisibleByIds).toHaveBeenCalledWith(
      [course.id],
      undefined,
    );
  });

  it('oculta rascunhos alheios dentro das trilhas para professor e aluno', async () => {
    const context = setup();
    const ownDraft = {
      ...course,
      id: 'own',
      status: CursoStatus.RASCUNHO,
      id_instrutor: 'professor-id',
    };
    const otherDraft = {
      ...course,
      id: 'other',
      status: CursoStatus.RASCUNHO,
      id_instrutor: 'other-id',
    };
    const published = {
      ...course,
      id: 'published',
      status: CursoStatus.PUBLICADO,
      id_instrutor: 'other-id',
    };
    context.trilhasRepository.find.mockResolvedValue([
      {
        ...trail,
        cursos: [ownDraft, otherDraft, published].map((item, index) => ({
          ordem: index + 1,
          id_curso: item.id,
        })),
      },
    ]);
    context.cursosService.findVisibleByIds.mockImplementation(
      (_ids: string[], actor?: AuthenticatedUser) =>
        Promise.resolve(
          actor?.role === UserRole.PROFESSOR
            ? [ownDraft, published]
            : [published],
        ),
    );

    const professorResult = await context.service.findAll({
      userId: 'professor-id',
      email: 'professor@example.com',
      role: UserRole.PROFESSOR,
    });
    expect(professorResult[0].cursos.map(({ id }) => id)).toEqual([
      'own',
      'published',
    ]);

    const studentResult = await context.service.findAll({
      userId: 'student-id',
      email: 'student@example.com',
      role: UserRole.ALUNO,
    });
    expect(studentResult[0].cursos.map(({ id }) => id)).toEqual(['published']);
  });

  it('removes course links before deleting a trail', async () => {
    const context = setup();
    context.trilhasRepository.findOneBy.mockResolvedValue(trail);
    context.seguimentosRepository.delete.mockResolvedValue({
      raw: [],
      affected: 1,
    });
    context.vinculosRepository.delete.mockResolvedValue({
      raw: [],
      affected: 1,
    });
    context.trilhasRepository.remove.mockResolvedValue(trail);

    await context.service.remove(trail.id);

    expect(context.seguimentosRepository.delete).toHaveBeenCalledWith({
      id_trilha: trail.id,
    });
    expect(context.vinculosRepository.delete).toHaveBeenCalledWith({
      id_trilha: trail.id,
    });
    expect(context.trilhasRepository.remove).toHaveBeenCalledWith(trail);
  });
});
