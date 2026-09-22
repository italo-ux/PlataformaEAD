/* eslint-disable @typescript-eslint/unbound-method */
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { AuthenticatedUser } from '../auth/authenticated-user.interface';
import { UserRole } from '../auth/user-role.enum';
import { Curso } from './curso.entity';
import { CursosService } from './cursos.service';
import { Matricula } from '../jornada/matricula.entity';
import { Aula } from './aula.entity';
import { TrilhaCurso } from '../trilhas/trilha-curso.entity';
import { YoutubeVideoValidationService } from './youtube-video-validation.service';
import { CursoStatus } from './curso.entity';

describe('CursosService', () => {
  const previousTestCourseBypass = process.env.ALLOW_TEST_COURSE_BYPASS;
  const owner: AuthenticatedUser = {
    userId: '11111111-1111-4111-8111-111111111111',
    email: 'professor@example.com',
    role: UserRole.PROFESSOR,
  };
  const otherProfessor: AuthenticatedUser = {
    userId: '22222222-2222-4222-8222-222222222222',
    email: 'outro@example.com',
    role: UserRole.PROFESSOR,
  };
  const admin: AuthenticatedUser = {
    userId: '33333333-3333-4333-8333-333333333333',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
  };
  const course = (): Curso => ({
    id: '44444444-4444-4444-8444-444444444444',
    nome: 'Curso de TypeScript',
    descricao: 'Fundamentos',
    url_foto: null,
    carga_horaria: 12,
    categoria: 'Tecnologia',
    nivel: 'Iniciante',
    ambiente_teste: false,
    id_instrutor: owner.userId,
    status: CursoStatus.RASCUNHO,
    publicado_em: null,
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-01T00:00:00.000Z'),
    aulas: [],
  });
  const repository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOneBy: jest.fn(),
    merge: jest.fn(),
    remove: jest.fn(),
  } as unknown as jest.Mocked<Repository<Curso>>;
  const lessonsRepository = {
    count: jest.fn(),
  } as unknown as jest.Mocked<Repository<import('./aula.entity').Aula>>;
  const enrollmentsRepository = {
    existsBy: jest.fn(),
  } as unknown as jest.Mocked<Repository<Matricula>>;
  const youtubeValidation = {
    validateVideo: jest.fn(),
    checkCourse: jest.fn(),
  } as unknown as jest.Mocked<YoutubeVideoValidationService>;
  const deleteQueryBuilder = {
    delete: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({}),
  };
  const transactionManager = {
    delete: jest.fn().mockResolvedValue({}),
    createQueryBuilder: jest.fn().mockReturnValue(deleteQueryBuilder),
    remove: jest.fn().mockResolvedValue(undefined),
  };
  const dataSource = {
    transaction: jest
      .fn()
      .mockImplementation(
        (work: (manager: typeof transactionManager) => unknown) =>
          Promise.resolve(work(transactionManager)),
      ),
  } as unknown as DataSource;
  const service = new CursosService(
    dataSource,
    repository,
    lessonsRepository,
    enrollmentsRepository,
    youtubeValidation,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ALLOW_TEST_COURSE_BYPASS = 'false';
    enrollmentsRepository.existsBy.mockResolvedValue(false);
    youtubeValidation.validateVideo.mockResolvedValue(true);
    youtubeValidation.checkCourse.mockResolvedValue({
      available: true,
      pendingValidation: false,
      unavailableLessons: [],
    });
  });

  afterAll(() => {
    if (previousTestCourseBypass === undefined) {
      delete process.env.ALLOW_TEST_COURSE_BYPASS;
    } else {
      process.env.ALLOW_TEST_COURSE_BYPASS = previousTestCourseBypass;
    }
  });

  it('cria o curso atribuindo o usuário autenticado como proprietário', async () => {
    const createdCourse = course();
    repository.create.mockReturnValue(createdCourse);
    repository.save.mockResolvedValue(createdCourse);

    await expect(
      service.create({ nome: createdCourse.nome }, owner),
    ).resolves.toEqual(createdCourse);
    expect(repository.create).toHaveBeenCalledWith({
      nome: createdCourse.nome,
      id_instrutor: owner.userId,
    });
  });

  it('só permite criar um curso de teste quando o bypass está habilitado', async () => {
    expect(() =>
      service.create({ nome: 'Curso rápido', ambiente_teste: true }, owner),
    ).toThrow(ForbiddenException);

    process.env.ALLOW_TEST_COURSE_BYPASS = 'true';
    const createdCourse = { ...course(), ambiente_teste: true };
    repository.create.mockReturnValue(createdCourse);
    repository.save.mockResolvedValue(createdCourse);

    await expect(
      service.create({ nome: createdCourse.nome, ambiente_teste: true }, owner),
    ).resolves.toEqual(createdCourse);
  });

  it('não altera o modo de teste depois que houver matrícula', async () => {
    const existingCourse = course();
    repository.findOneBy.mockResolvedValue(existingCourse);
    enrollmentsRepository.existsBy.mockResolvedValue(true);
    process.env.ALLOW_TEST_COURSE_BYPASS = 'true';

    await expect(
      service.update(existingCourse.id, { ambiente_teste: true }, owner),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('permite que o proprietário atualize e remova o curso', async () => {
    const existingCourse = course();
    repository.findOneBy.mockResolvedValue(existingCourse);
    repository.merge.mockReturnValue({ ...existingCourse, nome: 'Novo nome' });
    repository.save.mockResolvedValue({ ...existingCourse, nome: 'Novo nome' });
    repository.remove.mockResolvedValue(existingCourse);

    await expect(
      service.update(existingCourse.id, { nome: 'Novo nome' }, owner),
    ).resolves.toMatchObject({ nome: 'Novo nome' });
    await expect(
      service.remove(existingCourse.id, owner),
    ).resolves.toBeUndefined();
    expect(transactionManager.delete).toHaveBeenCalledWith(TrilhaCurso, {
      id_curso: existingCourse.id,
    });
    expect(deleteQueryBuilder.from).toHaveBeenCalledWith(Aula);
    expect(deleteQueryBuilder.where).toHaveBeenCalledWith('"id_curso" = :id', {
      id: existingCourse.id,
    });
    expect(transactionManager.remove).toHaveBeenCalledWith(
      Curso,
      existingCourse,
    );
  });

  it('não remove cursos que possuem matrículas', async () => {
    const existingCourse = course();
    repository.findOneBy.mockResolvedValue(existingCourse);
    enrollmentsRepository.existsBy.mockResolvedValue(true);

    await expect(
      service.remove(existingCourse.id, owner),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('permite que o administrador gerencie qualquer curso', async () => {
    const existingCourse = course();
    repository.findOneBy.mockResolvedValue(existingCourse);
    repository.merge.mockReturnValue(existingCourse);
    repository.save.mockResolvedValue(existingCourse);

    await expect(
      service.update(existingCourse.id, { nome: 'Admin' }, admin),
    ).resolves.toEqual(existingCourse);
  });

  it('bloqueia edição e exclusão comuns depois que o curso foi publicado', async () => {
    const publishedCourse = {
      ...course(),
      status: CursoStatus.PUBLICADO,
    };
    repository.findOneBy.mockResolvedValue(publishedCourse);

    await expect(
      service.update(publishedCourse.id, { nome: 'Alteração indevida' }, owner),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(
      service.remove(publishedCourse.id, owner),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.save).not.toHaveBeenCalled();
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('bloqueia outro professor de gerenciar o curso', async () => {
    const existingCourse = course();
    repository.findOneBy.mockResolvedValue(existingCourse);

    await expect(
      service.update(
        existingCourse.id,
        { nome: 'Outro professor' },
        otherProfessor,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      service.findManageable(existingCourse.id, otherProfessor),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('não permite que um professor consulte o rascunho de outro', async () => {
    repository.findOneBy.mockResolvedValue(course());

    await expect(
      service.findOne(course().id, otherProfessor),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lista para o professor apenas publicados e cursos próprios', async () => {
    const published = { ...course(), status: CursoStatus.PUBLICADO };
    repository.find.mockResolvedValue([published, course()]);

    await service.findAll(owner);

    expect(repository.find).toHaveBeenCalledWith({
      where: [
        { status: CursoStatus.PUBLICADO },
        { id_instrutor: owner.userId },
      ],
      order: { nome: 'ASC' },
    });
  });

  it('oculta do aluno um curso publicado com vídeo indisponível', async () => {
    const published = { ...course(), status: CursoStatus.PUBLICADO };
    repository.find.mockResolvedValue([published]);
    youtubeValidation.checkCourse.mockResolvedValue({
      available: false,
      pendingValidation: false,
      unavailableLessons: [{ id: 'video-1', titulo: 'Vídeo removido' }],
    });

    await expect(
      service.findAll({ ...owner, role: UserRole.ALUNO }),
    ).resolves.toEqual([]);
  });

  it('expõe a mudança do status de conteúdo após a recuperação do vídeo', async () => {
    const published = { ...course(), status: CursoStatus.PUBLICADO };
    repository.findOneBy.mockResolvedValue(published);
    youtubeValidation.checkCourse
      .mockResolvedValueOnce({
        available: false,
        pendingValidation: false,
        unavailableLessons: [{ id: 'video-1', titulo: 'Vídeo removido' }],
      })
      .mockResolvedValueOnce({
        available: true,
        pendingValidation: false,
        unavailableLessons: [],
      });

    await expect(service.findOne(published.id, owner)).resolves.toMatchObject({
      status: CursoStatus.PUBLICADO,
      status_conteudo: 'indisponivel',
      conteudo_indisponivel: true,
    });
    await expect(service.findOne(published.id, owner)).resolves.toMatchObject({
      status: CursoStatus.PUBLICADO,
      status_conteudo: 'disponivel',
      conteudo_indisponivel: false,
      videos_indisponiveis: [],
    });
  });

  it('lista e consulta cursos publicamente', async () => {
    const existingCourse = course();
    repository.find.mockResolvedValue([existingCourse]);
    repository.findOneBy.mockResolvedValue(existingCourse);

    await expect(service.findAll()).resolves.toEqual([existingCourse]);
    await expect(service.findOne(existingCourse.id)).resolves.toEqual(
      existingCourse,
    );
  });

  it('retorna 404 quando o curso não existe', async () => {
    repository.findOneBy.mockResolvedValue(null);
    await expect(service.findOne(course().id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
