import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AuthenticatedUser } from '../auth/authenticated-user.interface';
import { Curso } from '../cursos/curso.entity';
import { CursosService } from '../cursos/cursos.service';
import { CreateTrilhaDto } from './dto/create-trilha.dto';
import { TrilhaCurso } from './trilha-curso.entity';
import { Trilha } from './trilha.entity';
import { UsuarioTrilha } from './usuario-trilha.entity';

@Injectable()
export class TrilhasService {
  constructor(
    @InjectRepository(Trilha)
    private readonly trilhasRepository: Repository<Trilha>,
    @InjectRepository(TrilhaCurso)
    private readonly vinculosRepository: Repository<TrilhaCurso>,
    @InjectRepository(Curso)
    private readonly cursosRepository: Repository<Curso>,
    @InjectRepository(UsuarioTrilha)
    private readonly seguimentosRepository: Repository<UsuarioTrilha>,
    private readonly cursosService: CursosService,
  ) {}

  private async serialize(trilha: Trilha, actor?: AuthenticatedUser) {
    const orderedCourses = [...(trilha.cursos ?? [])]
      .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
      .map((vinculo) => vinculo.curso);
    const courses = actor
      ? (
          await Promise.all(
            orderedCourses.map(async (course) => {
              try {
                return await this.cursosService.findOne(course.id, actor);
              } catch (error) {
                if (error instanceof NotFoundException) return null;
                throw error;
              }
            }),
          )
        ).filter((course) => course !== null)
      : orderedCourses;
    return {
      id: trilha.id,
      nome: trilha.nome,
      descricao: trilha.descricao,
      capa: trilha.capa,
      nivel: trilha.nivel,
      cor_fundo: trilha.cor_fundo,
      cursos: courses,
    };
  }

  async findAll(actor?: AuthenticatedUser) {
    const trilhas = await this.trilhasRepository.find({
      relations: { cursos: { curso: true } },
      order: { nome: 'ASC' },
    });
    return Promise.all(trilhas.map((trilha) => this.serialize(trilha, actor)));
  }

  async findOne(id: string, actor?: AuthenticatedUser) {
    const trilha = await this.trilhasRepository.findOne({
      where: { id },
      relations: { cursos: { curso: true } },
    });
    if (!trilha) throw new NotFoundException('Trilha não encontrada');
    return this.serialize(trilha, actor);
  }

  async listFollowing(actor: AuthenticatedUser) {
    const seguimentos = await this.seguimentosRepository.find({
      where: { id_usuario: actor.userId },
      relations: { trilha: { cursos: { curso: true } } },
      order: { data_inicio: 'DESC' },
    });
    return Promise.all(
      seguimentos.map((seguimento) => this.serialize(seguimento.trilha, actor)),
    );
  }

  async getFollowStatus(id: string, actor: AuthenticatedUser) {
    const seguindo = await this.seguimentosRepository.findOneBy({
      id_usuario: actor.userId,
      id_trilha: id,
    });
    return { seguindo: Boolean(seguindo) };
  }

  async follow(id: string, actor: AuthenticatedUser) {
    const trilha = await this.trilhasRepository.findOneBy({ id });
    if (!trilha) throw new NotFoundException('Trilha não encontrada');

    const existente = await this.seguimentosRepository.findOneBy({
      id_usuario: actor.userId,
      id_trilha: id,
    });
    if (!existente) {
      await this.seguimentosRepository.save(
        this.seguimentosRepository.create({
          id_usuario: actor.userId,
          id_trilha: id,
          progresso: 0,
          concluida: false,
        }),
      );
    }
    return { seguindo: true };
  }

  async unfollow(id: string, actor: AuthenticatedUser) {
    await this.seguimentosRepository.delete({
      id_usuario: actor.userId,
      id_trilha: id,
    });
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
        cor_fundo: input.cor_fundo || '#3f5fd8',
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
    await this.seguimentosRepository.delete({ id_trilha: id });
    await this.vinculosRepository.delete({ id_trilha: id });
    await this.trilhasRepository.remove(trilha);
  }
}
