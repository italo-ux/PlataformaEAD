/*------------------Tipos para o dashboard------------------*/

export interface DashboardData {
  cards: {
    totalAlunos: number;
    totalCursos: number;
    totalTrilhas: number;
    totalProgramas: number;
  };
  crescimentoAnual: {
    mes: string;
    alunos: number;
  }[];
  alunosPorTrilha: {
    trilha: string;
    quantidade: number;
  }[];
  nivelPrograma: {
    nome: string;
    valor: number;
  }[];
}