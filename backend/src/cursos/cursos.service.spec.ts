/* eslint-disable @typescript-eslint/unbound-method */
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '../auth/authenticated-user.interface';
import { UserRole } from '../auth/user-role.enum';
import { Curso } from './curso.entity';
import { CursosService } from './cursos.service';

describe('CursosService', () => {
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
    id_instrutor: owner.userId,
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
  const service = new CursosService(repository);

  beforeEach(() => jest.clearAllMocks());

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

  it('bloqueia outro professor', async () => {
    repository.findOneBy.mockResolvedValue(course());

    await expect(
      service.findManageable(course().id, otherProfessor),
    ).rejects.toBeInstanceOf(ForbiddenException);
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
