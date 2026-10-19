import { Repository } from 'typeorm';
import { Curso } from '../cursos/curso.entity';
import { TrilhaCurso } from './trilha-curso.entity';
import { Trilha } from './trilha.entity';
import { TrilhasService } from './trilhas.service';

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
    const service = new TrilhasService(
      trilhasRepository as unknown as Repository<Trilha>,
      vinculosRepository as unknown as Repository<TrilhaCurso>,
      cursosRepository as unknown as Repository<Curso>,
    );
    return {
      service,
      trilhasRepository,
      vinculosRepository,
      cursosRepository,
    };
  }

  it('creates a real trail and persists its ordered course links', async () => {
    const context = setup();
    context.cursosRepository.countBy.mockResolvedValue(1);
    context.trilhasRepository.findOne.mockResolvedValue({
      ...trail,
      cursos: [{ ordem: 1, curso: course } as TrilhaCurso],
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

  it('lists serialized trails with courses in their configured order', async () => {
    const context = setup();
    const secondCourse = { ...course, id: 'course-2', nome: 'Segundo' };
    context.trilhasRepository.find.mockResolvedValue([
      {
        ...trail,
        cursos: [
          { ordem: 2, curso: secondCourse } as TrilhaCurso,
          { ordem: 1, curso: course } as TrilhaCurso,
        ],
      },
    ]);

    const result = await context.service.findAll();

    expect(result[0].cursos.map(({ id }) => id)).toEqual([
      course.id,
      secondCourse.id,
    ]);
  });

  it('removes course links before deleting a trail', async () => {
    const context = setup();
    context.trilhasRepository.findOneBy.mockResolvedValue(trail);
    context.vinculosRepository.delete.mockResolvedValue({
      raw: [],
      affected: 1,
    });
    context.trilhasRepository.remove.mockResolvedValue(trail);

    await context.service.remove(trail.id);

    expect(context.vinculosRepository.delete).toHaveBeenCalledWith({
      id_trilha: trail.id,
    });
    expect(context.trilhasRepository.remove).toHaveBeenCalledWith(trail);
  });
});
