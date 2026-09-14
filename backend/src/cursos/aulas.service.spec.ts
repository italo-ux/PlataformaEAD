/* eslint-disable @typescript-eslint/unbound-method */
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '../auth/authenticated-user.interface';
import { UserRole } from '../auth/user-role.enum';
import { Aula } from './aula.entity';
import { AulasService } from './aulas.service';
import { Curso } from './curso.entity';
import { CursosService } from './cursos.service';
import { Matricula } from '../jornada/matricula.entity';

describe('AulasService', () => {
  const actor: AuthenticatedUser = {
    userId: '11111111-1111-4111-8111-111111111111',
    email: 'professor@example.com',
    role: UserRole.PROFESSOR,
  };
  const course = {
    id: '22222222-2222-4222-8222-222222222222',
    id_instrutor: actor.userId,
  } as Curso;
  const lesson = {
    id: '33333333-3333-4333-8333-333333333333',
    titulo: 'Introdução',
    descricao: null,
    url_video: 'https://youtu.be/example',
    duracao_minutos: 10,
    duracao_segundos: 600,
    youtube_video_id: 'dQw4w9WgXcQ',
    youtube_embeddable: true,
    youtube_validado_em: new Date('2026-09-13T12:00:00.000Z'),
    ordem: 1,
    curso: course,
    id_instrutor: actor.userId,
  } as Aula;
  const repository = {
    count: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    merge: jest.fn(),
    remove: jest.fn(),
  } as unknown as jest.Mocked<Repository<Aula>>;
  const cursosService = {
    findManageable: jest.fn(),
  } as unknown as jest.Mocked<CursosService>;
  const enrollmentsRepository = {
    existsBy: jest.fn(),
  } as unknown as jest.Mocked<Repository<Matricula>>;
  const service = new AulasService(
    repository,
    enrollmentsRepository,
    cursosService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    enrollmentsRepository.existsBy.mockResolvedValue(false);
  });

  it('valida a existência do curso antes de criar uma aula', async () => {
    cursosService.findManageable.mockResolvedValue(course);
    repository.count.mockResolvedValue(0);
    repository.create.mockReturnValue(lesson);
    repository.save.mockResolvedValue(lesson);

    await expect(
      service.create(
        course.id,
        {
          titulo: lesson.titulo,
          url_video: 'https://youtu.be/dQw4w9WgXcQ',
          duracao_segundos: lesson.duracao_segundos!,
        },
        actor,
      ),
    ).resolves.toEqual(lesson);
    expect(cursosService.findManageable).toHaveBeenCalledWith(course.id, actor);
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ id_instrutor: actor.userId, curso: course }),
    );
  });

  it('valida a existência do curso antes de atualizar e remover uma aula', async () => {
    cursosService.findManageable.mockResolvedValue(course);
    repository.findOne.mockResolvedValue(lesson);
    repository.merge.mockReturnValue(lesson);
    repository.save.mockResolvedValue(lesson);
    repository.remove.mockResolvedValue(lesson);

    await service.update(course.id, lesson.id, { titulo: 'Nova aula' }, actor);
    await service.remove(course.id, lesson.id, actor);

    expect(cursosService.findManageable).toHaveBeenCalledTimes(2);
    expect(cursosService.findManageable).toHaveBeenNthCalledWith(
      1,
      course.id,
      actor,
    );
  });
});
