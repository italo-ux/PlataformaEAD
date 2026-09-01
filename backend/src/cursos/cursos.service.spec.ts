/* eslint-disable @typescript-eslint/unbound-method */
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Curso } from './curso.entity';
import { CursosService } from './cursos.service';

describe('CursosService', () => {
  const course: Curso = {
    id: '11111111-1111-4111-8111-111111111111',
    nome: 'Curso de TypeScript',
    descricao: 'Fundamentos',
    url_foto: null,
    carga_horaria: 12,
    categoria: 'Tecnologia',
    nivel: 'Iniciante',
  };
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

  it('cria um curso', async () => {
    repository.create.mockReturnValue(course);
    repository.save.mockResolvedValue(course);
    await expect(service.create({ nome: course.nome })).resolves.toEqual(
      course,
    );
    expect(repository.create).toHaveBeenCalledWith({ nome: course.nome });
  });

  it('lista cursos por nome', async () => {
    repository.find.mockResolvedValue([course]);
    await expect(service.findAll()).resolves.toEqual([course]);
    expect(repository.find).toHaveBeenCalledWith({ order: { nome: 'ASC' } });
  });

  it('busca um curso por id', async () => {
    repository.findOneBy.mockResolvedValue(course);
    await expect(service.findOne(course.id)).resolves.toEqual(course);
  });

  it('atualiza um curso existente', async () => {
    repository.findOneBy.mockResolvedValue(course);
    repository.merge.mockReturnValue({ ...course, nome: 'Novo nome' });
    repository.save.mockResolvedValue({ ...course, nome: 'Novo nome' });
    await expect(
      service.update(course.id, { nome: 'Novo nome' }),
    ).resolves.toMatchObject({ nome: 'Novo nome' });
  });

  it('remove um curso existente', async () => {
    repository.findOneBy.mockResolvedValue(course);
    repository.remove.mockResolvedValue(course);
    await expect(service.remove(course.id)).resolves.toBeUndefined();
    expect(repository.remove).toHaveBeenCalledWith(course);
  });

  it('retorna 404 quando o curso não existe', async () => {
    repository.findOneBy.mockResolvedValue(null);
    await expect(service.findOne(course.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
