/* eslint-disable @typescript-eslint/unbound-method */
import { ServiceUnavailableException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Aula, AulaTipo } from './aula.entity';
import { YoutubeVideoValidationService } from './youtube-video-validation.service';

describe('YoutubeVideoValidationService', () => {
  const repository = {
    find: jest.fn(),
    save: jest.fn(),
  } as unknown as jest.Mocked<Repository<Aula>>;
  const service = new YoutubeVideoValidationService(repository);

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

  it('persiste a indisponibilidade e a expõe no status do curso', async () => {
    const lesson = {
      id: '11111111-1111-4111-8111-111111111111',
      titulo: 'Vídeo removido',
      tipo: AulaTipo.VIDEO,
      youtube_video_id: 'aaaaaaaaaaa',
      youtube_embeddable: true,
      youtube_validado_em: new Date('2020-01-01T00:00:00.000Z'),
      ordem: 1,
    } as Aula;
    repository.find.mockResolvedValue([lesson]);
    repository.save.mockResolvedValue(lesson);
    jest.spyOn(service, 'validateVideo').mockResolvedValue(false);

    await expect(service.checkCourse('course-id')).resolves.toEqual({
      available: false,
      pendingValidation: false,
      unavailableLessons: [{ id: lesson.id, titulo: lesson.titulo }],
    });
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ youtube_embeddable: false }),
    );
  });
});
