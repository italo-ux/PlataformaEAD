import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, QueryFailedError, Repository } from 'typeorm';
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

  private async serializeMany(trilhas: Trilha[], actor?: AuthenticatedUser) {
    const ids = [
      ...new Set(
        trilhas.flatMap((trilha) =>
          (trilha.cursos ?? []).map((vinculo) => vinculo.id_curso),
        ),
      ),
    ];
    const courses = await this.cursosService.findVisibleByIds(ids, actor);
    const byId = new Map(courses.map((course) => [course.id, course]));
    return trilhas.map((trilha) => ({
      id: trilha.id,
      nome: trilha.nome,
      descricao: trilha.descricao,
      capa: trilha.capa,
      nivel: trilha.nivel,
      cor_fundo: trilha.cor_fundo,
      cursos: [...(trilha.cursos ?? [])]
        .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
        .map((vinculo) => byId.get(vinculo.id_curso))
        .filter((course): course is Curso => course !== undefined),
    }));
  }

  async findAll(actor?: AuthenticatedUser) {
    const trilhas = await this.trilhasRepository.find({
      relations: { cursos: true },
      order: { nome: 'ASC' },
    });
    return this.serializeMany(trilhas, actor);
  }

  async findOne(id: string, actor?: AuthenticatedUser) {
    const trilha = await this.trilhasRepository.findOne({
      where: { id },
      relations: { cursos: true },
    });
    if (!trilha) throw new NotFoundException('Trilha não encontrada');
    return (await this.serializeMany([trilha], actor))[0];
  }

  async listFollowing(actor: AuthenticatedUser) {
    const seguimentos = await this.seguimentosRepository.find({
      where: { id_usuario: actor.userId },
      relations: { trilha: { cursos: true } },
      order: { data_inicio: 'DESC' },
    });
    return this.serializeMany(
      seguimentos.map((seguimento) => seguimento.trilha),
      actor,
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
      try {
        await this.seguimentosRepository.save(
          this.seguimentosRepository.create({
            id_usuario: actor.userId,
            id_trilha: id,
            progresso: 0,
            concluida: false,
          }),
        );
      } catch (error) {
        const driverError =
          error instanceof QueryFailedError
            ? (error.driverError as { code?: string; constraint?: string })
            : null;
        if (
          driverError?.code !== '23505' ||
          driverError.constraint !== 'uq_usuario_trilha_usuario_trilha'
        ) {
          throw error;
        }
      }
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
