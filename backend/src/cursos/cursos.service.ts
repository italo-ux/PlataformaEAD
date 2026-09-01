import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Curso } from './curso.entity';
import { CreateCursoDto } from './dto/create-curso.dto';
import { UpdateCursoDto } from './dto/update-curso.dto';

@Injectable()
export class CursosService {
  constructor(
    @InjectRepository(Curso)
    private readonly cursosRepository: Repository<Curso>,
  ) {}

  create(createCursoDto: CreateCursoDto) {
    const curso = this.cursosRepository.create(createCursoDto);
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

  async update(id: string, updateCursoDto: UpdateCursoDto) {
    const curso = await this.findOne(id);
    const updatedCurso = this.cursosRepository.merge(curso, updateCursoDto);
    return this.cursosRepository.save(updatedCurso);
  }

  async remove(id: string) {
    const curso = await this.findOne(id);
    await this.cursosRepository.remove(curso);
  }
}
