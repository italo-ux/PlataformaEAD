import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Curso } from '../cursos/curso.entity';
import { CursoStatus } from '../cursos/curso.entity';
import { AuthenticatedUser } from '../auth/authenticated-user.interface';
import { UserRole } from '../auth/user-role.enum';
import { CreateTrilhaDto } from './dto/create-trilha.dto';
import { TrilhaCurso } from './trilha-curso.entity';
import { Trilha } from './trilha.entity';

@Injectable()
export class TrilhasService {
  constructor(
    @InjectRepository(Trilha)
    private readonly trilhasRepository: Repository<Trilha>,
    @InjectRepository(TrilhaCurso)
    private readonly vinculosRepository: Repository<TrilhaCurso>,
    @InjectRepository(Curso)
    private readonly cursosRepository: Repository<Curso>,
  ) {}

  private serialize(trilha: Trilha, actor?: AuthenticatedUser) {
    return {
      id: trilha.id,
      nome: trilha.nome,
      descricao: trilha.descricao,
      capa: trilha.capa,
      nivel: trilha.nivel,
      cursos: [...(trilha.cursos ?? [])]
        .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
        .map((vinculo) => vinculo.curso)
        .filter(
          (curso) =>
            actor?.role !== UserRole.ALUNO ||
            curso.status === CursoStatus.PUBLICADO,
        ),
    };
  }

  async findAll(actor?: AuthenticatedUser) {
    const trilhas = await this.trilhasRepository.find({
      relations: { cursos: { curso: true } },
      order: { nome: 'ASC' },
    });
    return trilhas.map((trilha) => this.serialize(trilha, actor));
  }

  async findOne(id: string, actor?: AuthenticatedUser) {
    const trilha = await this.trilhasRepository.findOne({
      where: { id },
      relations: { cursos: { curso: true } },
    });
    if (!trilha) throw new NotFoundException('Trilha não encontrada');
    return this.serialize(trilha, actor);
  }

  async create(input: CreateTrilhaDto) {
    const courseIds = input.courseIds ?? [];
    if (courseIds.length > 0) {
      const existingCourses = await this.cursosRepository.countBy({
        id: In(courseIds),
      });
      if (existingCourses !== courseIds.length) {
        throw new BadRequestException('Um ou mais cursos não existem.');
      }
    }

    const trilha = await this.trilhasRepository.save(
      this.trilhasRepository.create({
        nome: input.nome,
        descricao: input.descricao || null,
        capa: input.capa || null,
        nivel: input.nivel || null,
      }),
    );

    if (courseIds.length > 0) {
      await this.vinculosRepository.save(
        courseIds.map((courseId, index) =>
          this.vinculosRepository.create({
            id_trilha: trilha.id,
            id_curso: courseId,
            ordem: index + 1,
          }),
        ),
      );
    }

    return this.findOne(trilha.id);
  }

  async remove(id: string) {
    const trilha = await this.trilhasRepository.findOneBy({ id });
    if (!trilha) throw new NotFoundException('Trilha não encontrada');
    await this.vinculosRepository.delete({ id_trilha: id });
    await this.trilhasRepository.remove(trilha);
  }
}
