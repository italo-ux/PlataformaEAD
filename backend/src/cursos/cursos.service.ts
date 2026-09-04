import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '../auth/authenticated-user.interface';
import { UserRole } from '../auth/user-role.enum';
import { Curso } from './curso.entity';
import { CreateCursoDto } from './dto/create-curso.dto';
import { UpdateCursoDto } from './dto/update-curso.dto';

@Injectable()
export class CursosService {
  constructor(
    @InjectRepository(Curso)
    private readonly cursosRepository: Repository<Curso>,
  ) {}

  create(createCursoDto: CreateCursoDto, actor: AuthenticatedUser) {
    const curso = this.cursosRepository.create({
      ...createCursoDto,
      id_instrutor: actor.userId,
    });
    return this.cursosRepository.save(curso);
  }

  findAll() {
    return this.cursosRepository.find({ order: { nome: 'ASC' } });
  }

  async findOne(id: string) {
    const curso = await this.cursosRepository.findOneBy({ id });

    if (!curso) {
      throw new NotFoundException('Curso não encontrado');
    }

    return curso;
  }

  async findManageable(id: string, actor: AuthenticatedUser) {
    const curso = await this.findOne(id);
    if (actor.role !== UserRole.ADMIN && curso.id_instrutor !== actor.userId) {
      throw new ForbiddenException('Você não pode gerenciar este curso');
    }
    return curso;
  }

  async update(
    id: string,
    updateCursoDto: UpdateCursoDto,
    actor: AuthenticatedUser,
  ) {
    const curso = await this.findManageable(id, actor);
    const updatedCurso = this.cursosRepository.merge(curso, updateCursoDto);
    return this.cursosRepository.save(updatedCurso);
  }

  async remove(id: string, actor: AuthenticatedUser) {
    const curso = await this.findManageable(id, actor);
    await this.cursosRepository.remove(curso);
  }
}
