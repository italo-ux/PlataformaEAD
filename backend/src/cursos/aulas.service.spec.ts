/* eslint-disable @typescript-eslint/unbound-method */
import { ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '../auth/authenticated-user.interface';
import { UserRole } from '../auth/user-role.enum';
import { Aula, AulaTipo } from './aula.entity';
import { AulasService } from './aulas.service';
import { Curso, CursoStatus } from './curso.entity';
import { CursosService } from './cursos.service';
import { Matricula } from '../jornada/matricula.entity';
import { YoutubeVideoValidationService } from './youtube-video-validation.service';

describe('AulasService', () => {
  const actor: AuthenticatedUser = {
    userId: '11111111-1111-4111-8111-111111111111',
    email: 'professor@example.com',
    role: UserRole.PROFESSOR,
  };
  const course = {
    id: '22222222-2222-4222-8222-222222222222',
    id_instrutor: actor.userId,
    status: CursoStatus.RASCUNHO,
  } as Curso;
  const lesson = {
    id: '33333333-3333-4333-8333-333333333333',
    titulo: 'Introdução',
    descricao: null,
    tipo: AulaTipo.VIDEO,
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
  const youtubeValidation = {
    validateVideo: jest.fn(),
  } as unknown as jest.Mocked<YoutubeVideoValidationService>;
  const service = new AulasService(
    repository,
    enrollmentsRepository,
    cursosService,
    undefined,
    youtubeValidation,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    enrollmentsRepository.existsBy.mockResolvedValue(false);
    youtubeValidation.validateVideo.mockResolvedValue(true);
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

  it('salva a sequência completa ao reordenar as aulas', async () => {
    const secondLesson = {
      ...lesson,
      id: '44444444-4444-4444-8444-444444444444',
      titulo: 'Conclusão',
      ordem: 2,
    } as Aula;
    const reordered = [
      { ...secondLesson, ordem: 1 },
      { ...lesson, ordem: 2 },
    ] as Aula[];
    cursosService.findManageable.mockResolvedValue(course);
    repository.find
      .mockResolvedValueOnce([lesson, secondLesson])
      .mockResolvedValueOnce(reordered);
    repository.save.mockResolvedValue(reordered);

    await expect(
      service.reorder(course.id, [secondLesson.id, lesson.id], actor),
    ).resolves.toEqual(reordered);

    expect(repository.save).toHaveBeenCalledWith([
      expect.objectContaining({ id: secondLesson.id, ordem: 1 }),
      expect.objectContaining({ id: lesson.id, ordem: 2 }),
    ]);
  });

  it('bloqueia a edição comum de aulas depois que o curso foi publicado', async () => {
    cursosService.findManageable.mockResolvedValue({
      ...course,
      status: CursoStatus.PUBLICADO,
    });

    await expect(
      service.update(course.id, lesson.id, { titulo: 'Alteração indevida' }, actor),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.findOne).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('repara somente a URL de um vídeo indisponível e marca a validação', async () => {
    const unavailableLesson = {
      ...lesson,
      youtube_embeddable: false,
    } as Aula;
    const publishedCourse = {
      ...course,
      status: CursoStatus.PUBLICADO,
    } as Curso;
    const newUrl = 'https://www.youtube.com/watch?v=abcdefghijk';
    cursosService.findManageable.mockResolvedValue(publishedCourse);
    repository.findOne.mockResolvedValue(unavailableLesson);
    repository.save.mockImplementation(async (value) => value as Aula);

    await expect(
      service.repairUnavailableVideo(course.id, lesson.id, newUrl, actor),
    ).resolves.toMatchObject({
      id: lesson.id,
      titulo: lesson.titulo,
      url_video: newUrl,
      youtube_video_id: 'abcdefghijk',
      youtube_embeddable: true,
    });
    expect(youtubeValidation.validateVideo).toHaveBeenCalledWith('abcdefghijk');
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: lesson.id,
        titulo: lesson.titulo,
        duracao_segundos: lesson.duracao_segundos,
        url_video: newUrl,
        youtube_embeddable: true,
        youtube_validado_em: expect.any(Date),
      }),
    );
  });

  it('não salva uma nova URL quando o vídeo continua indisponível', async () => {
    cursosService.findManageable.mockResolvedValue({
      ...course,
      status: CursoStatus.PUBLICADO,
    });
    repository.findOne.mockResolvedValue({
      ...lesson,
      youtube_embeddable: false,
    } as Aula);
    youtubeValidation.validateVideo.mockResolvedValue(false);

    await expect(
      service.repairUnavailableVideo(
        course.id,
        lesson.id,
        'https://youtu.be/abcdefghijk',
        actor,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('não permite usar o reparo para alterar um vídeo que está disponível', async () => {
    cursosService.findManageable.mockResolvedValue({
      ...course,
      status: CursoStatus.PUBLICADO,
    });
    repository.findOne.mockResolvedValue(lesson);

    await expect(
      service.repairUnavailableVideo(
        course.id,
        lesson.id,
        'https://youtu.be/abcdefghijk',
        actor,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(youtubeValidation.validateVideo).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
  });
});
