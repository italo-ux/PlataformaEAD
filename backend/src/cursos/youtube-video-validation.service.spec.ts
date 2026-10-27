/* eslint-disable @typescript-eslint/unbound-method */
import { ServiceUnavailableException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Aula, AulaTipo } from './aula.entity';
import { YoutubeVideoValidationService } from './youtube-video-validation.service';

describe('YoutubeVideoValidationService', () => {
  const repository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  } as unknown as jest.Mocked<Repository<Aula>>;
  const runner = {
    connect: jest.fn(),
    query: jest.fn(),
    release: jest.fn(),
    manager: { getRepository: jest.fn().mockReturnValue(repository) },
  };
  const dataSource = {
    createQueryRunner: jest.fn().mockReturnValue(runner),
  } as unknown as DataSource;
  const service = new YoutubeVideoValidationService(repository, dataSource);

  beforeEach(() => {
    jest.clearAllMocks();
    runner.query.mockImplementation((sql: string) =>
      Promise.resolve(
        sql.includes('pg_try_advisory_lock')
          ? [{ acquired: true }]
          : [{ released: true }],
      ),
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('aceita um vídeo público sem exigir chave de API', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 200 }));

    await expect(service.validateVideo('dQw4w9WgXcQ')).resolves.toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('youtube.com%2Fwatch%3Fv%3DdQw4w9WgXcQ'),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('marca como indisponível um vídeo removido ou privado', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response('', { status: 404 }));

    await expect(service.validateVideo('aaaaaaaaaaa')).resolves.toBe(false);
  });

  it('não confunde falha temporária do YouTube com vídeo removido', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response('', { status: 503 }));

    await expect(service.validateVideo('dQw4w9WgXcQ')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('não trata limitação de taxa como vídeo removido', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response('', { status: 429 }));

    await expect(service.validateVideo('dQw4w9WgXcQ')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('lê a indisponibilidade persistida sem acessar o YouTube', async () => {
    const lesson = {
      id: '11111111-1111-4111-8111-111111111111',
      titulo: 'Vídeo removido',
      tipo: AulaTipo.VIDEO,
      youtube_video_id: 'aaaaaaaaaaa',
      youtube_embeddable: false,
      youtube_validado_em: new Date('2020-01-01T00:00:00.000Z'),
      ordem: 1,
      curso: { id: 'course-id' },
    } as Aula;
    repository.find.mockResolvedValue([lesson]);
    const validate = jest.spyOn(service, 'validateVideo');

    const availability = await service.getCachedAvailability(['course-id']);
    expect(availability.get('course-id')).toEqual({
      available: false,
      pendingValidation: false,
      unavailableLessons: [{ id: lesson.id, titulo: lesson.titulo }],
    });
    expect(validate).not.toHaveBeenCalled();
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('agenda a validação solicitada pela interface sem chamar o YouTube', async () => {
    repository.findOne.mockResolvedValue({
      id: 'lesson-1',
      youtube_video_id: 'dQw4w9WgXcQ',
      youtube_embeddable: true,
      youtube_validado_em: new Date('2020-01-01T00:00:00.000Z'),
    } as Aula);
    const validate = jest.spyOn(service, 'validateVideo');

    await expect(
      service.scheduleLessonValidation('course-1', 'lesson-1'),
    ).resolves.toMatchObject({ disponivel: true, validacao_pendente: true });

    const [criteria, update] = repository.update.mock.calls[0];
    expect(criteria).toEqual({
      id: 'lesson-1',
      youtube_video_id: 'dQw4w9WgXcQ',
    });
    expect(update.youtube_proxima_validacao_em).toBeInstanceOf(Date);
    expect(validate).not.toHaveBeenCalled();
  });

  it('não reagenda uma aula validada há menos de um minuto', async () => {
    repository.findOne.mockResolvedValue({
      id: 'lesson-1',
      youtube_video_id: 'dQw4w9WgXcQ',
      youtube_embeddable: true,
      youtube_validado_em: new Date(),
    } as Aula);

    await expect(
      service.scheduleLessonValidation('course-1', 'lesson-1'),
    ).resolves.toMatchObject({ disponivel: true, validacao_pendente: false });
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('limita a três validações externas simultâneas por ciclo', async () => {
    const lessons = Array.from({ length: 8 }, (_, index) => ({
      id: `lesson-${index}`,
      youtube_video_id: `video-${index}`,
      youtube_validado_em: null,
      youtube_proxima_validacao_em: new Date('2020-01-01T00:00:00.000Z'),
    })) as Aula[];
    repository.find.mockResolvedValue(lessons);
    repository.update.mockResolvedValue({
      affected: 1,
      raw: [],
      generatedMaps: [],
    });
    let active = 0;
    let maximum = 0;
    jest.spyOn(service, 'validateVideo').mockImplementation(async () => {
      active++;
      maximum = Math.max(maximum, active);
      await new Promise((resolve) => setTimeout(resolve, 1));
      active--;
      return true;
    });

    await service.revalidateStaleVideos();

    expect(maximum).toBe(3);
    expect(repository.update).toHaveBeenCalledTimes(8);
    expect(runner.query).toHaveBeenCalledWith(
      'SELECT pg_advisory_unlock($1)',
      [2026100301],
    );
    expect(runner.release).toHaveBeenCalledTimes(1);
  });

  it('preserva o estado persistido após falha temporária e agenda nova tentativa', async () => {
    const lesson = {
      id: 'lesson-temporaria',
      youtube_video_id: 'video-temporario',
      youtube_embeddable: true,
      youtube_validado_em: null,
      youtube_proxima_validacao_em: new Date('2020-01-01T00:00:00.000Z'),
    } as Aula;
    repository.find.mockResolvedValueOnce([lesson]).mockResolvedValueOnce([]);
    repository.update.mockResolvedValue({
      affected: 1,
      raw: [],
      generatedMaps: [],
    });
    jest
      .spyOn(service, 'validateVideo')
      .mockRejectedValue(
        new ServiceUnavailableException('YouTube indisponível'),
      );

    await service.revalidateStaleVideos();
    await service.revalidateStaleVideos();

    expect(service.validateVideo).toHaveBeenCalledTimes(1);
    expect(repository.update).toHaveBeenCalledTimes(1);
    const [criteria, update] = repository.update.mock.calls[0];
    expect(criteria).toMatchObject({
      id: lesson.id,
      youtube_video_id: lesson.youtube_video_id,
    });
    expect(update.youtube_proxima_validacao_em).toBeInstanceOf(Date);
    expect(lesson.youtube_embeddable).toBe(true);
  });

  it('não inicia validação quando outra instância detém o advisory lock', async () => {
    runner.query.mockResolvedValueOnce([{ acquired: false }]);
    const validate = jest.spyOn(service, 'validateVideo');

    await service.revalidateStaleVideos();

    expect(repository.find).not.toHaveBeenCalled();
    expect(validate).not.toHaveBeenCalled();
    expect(runner.query).toHaveBeenCalledTimes(1);
    expect(runner.release).toHaveBeenCalledTimes(1);
  });

  it('permite outro ciclo após falha ao criar a conexão', async () => {
    jest.spyOn(dataSource, 'createQueryRunner').mockImplementationOnce(() => {
      throw new Error('Conexão indisponível');
    });
    repository.find.mockResolvedValue([]);

    await service.revalidateStaleVideos();
    await service.revalidateStaleVideos();

    expect(dataSource.createQueryRunner).toHaveBeenCalledTimes(2);
    expect(repository.find).toHaveBeenCalledTimes(1);
  });

  it('aguarda todas as validações antes de liberar o lock após falha de escrita', async () => {
    repository.find.mockResolvedValue([
      { id: 'a', youtube_video_id: 'video-a' },
      { id: 'b', youtube_video_id: 'video-b' },
    ] as Aula[]);
    repository.update.mockImplementation((criteria) =>
      criteria.id === 'a'
        ? Promise.reject(new Error('Gravação indisponível'))
        : Promise.resolve({ affected: 1, raw: [], generatedMaps: [] }),
    );
    jest.spyOn(service, 'validateVideo').mockImplementation(async (videoId) => {
      if (videoId === 'video-b')
        await new Promise((resolve) => setTimeout(resolve, 10));
      return true;
    });

    await service.revalidateStaleVideos();

    expect(repository.update).toHaveBeenCalledTimes(2);
    expect(runner.query).toHaveBeenLastCalledWith(
      'SELECT pg_advisory_unlock($1)',
      [2026100301],
    );
    expect(runner.release).toHaveBeenCalledTimes(1);
  });
});
