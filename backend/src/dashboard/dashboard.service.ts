/*------------------busca a quantidade real de usuários no postgre------------------*/
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/user.entity';
import { Curso } from '../cursos/curso.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Curso)
    private readonly cursoRepository: Repository<Curso>,
  ) {}

  async getStats() {
    const totalAlunos = await this.userRepository.count();
    const totalCursos = await this.cursoRepository.count();

    return {
      cards: {
        totalAlunos,
        totalCursos,
        totalTrilhas: 13,
        totalProgramas: 5,
      },
      crescimentoAnual: [
        { mes: 'JAN', alunos: 500 },
        { mes: 'FEV', alunos: 600 },
        { mes: 'MAR', alunos: 1200 },
        { mes: 'ABR', alunos: 4000 },
        { mes: 'MAI', alunos: 4200 },
        { mes: 'JUN', alunos: 3100 },
        { mes: 'JUL', alunos: 6500 },
        { mes: 'AGO', alunos: 8120 },
        { mes: 'SET', alunos: 6000 },
        { mes: 'OUT', alunos: 6300 },
        { mes: 'NOV', alunos: 8700 },
        { mes: 'DEZ', alunos: 9000 },
      ],
      alunosPorTrilha: [
        { trilha: 'Robótica', quantidade: 10000 },
        { trilha: 'Apps/Sites', quantidade: 7500 },
        { trilha: 'Metaverso', quantidade: 3800 },
        { trilha: 'Design', quantidade: 5500 },
        { trilha: 'IA', quantidade: 9900 },
        { trilha: 'Redes', quantidade: 6200 },
        { trilha: 'Softwares', quantidade: 8900 },
        { trilha: 'Outros', quantidade: 3500 },
      ],
      nivelPrograma: [
        { nome: 'Iniciante', valor: 20 },
        { nome: 'Intermediário', valor: 35 },
        { nome: 'Avançado', valor: 25 },
        { nome: 'Mestre', valor: 20 },
      ],
    };
  }
}
