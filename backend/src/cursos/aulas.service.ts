import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '../auth/authenticated-user.interface';
import { Aula } from './aula.entity';
import { CursosService } from './cursos.service';
import { CreateAulaDto } from './dto/create-aula.dto';
import { UpdateAulaDto } from './dto/update-aula.dto';

@Injectable()
export class AulasService {
  constructor(
    @InjectRepository(Aula)
    private readonly aulasRepository: Repository<Aula>,
    private readonly cursosService: CursosService,
  ) {}

  async create(
    cursoId: string,
    createAulaDto: CreateAulaDto,
    actor: AuthenticatedUser,
  ) {
    const curso = await this.cursosService.findManageable(cursoId, actor);

    const ordem =
      createAulaDto.ordem ??
      (await this.aulasRepository.count({
        where: { curso: { id: cursoId } },
      })) + 1;
    const aula = this.aulasRepository.create({
      ...createAulaDto,
      ordem,
      curso,
      id_instrutor: actor.userId,
    });
    return this.aulasRepository.save(aula);
  }

  findAll(cursoId: string) {
    return this.aulasRepository.find({
      where: { curso: { id: cursoId } },
      order: { ordem: 'ASC', titulo: 'ASC' },
    });
  }

  async findOne(cursoId: string, aulaId: string) {
    const aula = await this.aulasRepository.findOne({
      where: { id: aulaId, curso: { id: cursoId } },
    });
    if (!aula) throw new NotFoundException('Aula não encontrada');
    return aula;
  }

  async update(
    cursoId: string,
    aulaId: string,
    updateAulaDto: UpdateAulaDto,
    actor: AuthenticatedUser,
  ) {
    await this.cursosService.findManageable(cursoId, actor);
    const aula = await this.findOne(cursoId, aulaId);
    return this.aulasRepository.save(
      this.aulasRepository.merge(aula, updateAulaDto),
    );
  }

  async remove(cursoId: string, aulaId: string, actor: AuthenticatedUser) {
    await this.cursosService.findManageable(cursoId, actor);
    const aula = await this.findOne(cursoId, aulaId);
    await this.aulasRepository.remove(aula);
  }
}
