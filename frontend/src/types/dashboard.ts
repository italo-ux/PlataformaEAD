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

export interface DashboardFilters {
  periodoInicio: string;
  periodoFim: string;
  cursoId?: string;
  trilhaId?: string;
  uf?: string;
}

export interface KpiCardData {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ size?: number }>;
  trend?: {
    value: number;
    label: string;
    positive: boolean;
  };
}

export interface OverviewMetrics {
  alunosCadastrados: number;
  alunosAtivos: number;
  matriculasIniciadas: number;
  taxaConclusao: number;
  certificadosEmitidos: number;
}

export interface UfDistributionItem {
  uf: string;
  nome: string;
  alunos: number;
  participacao: number;
}

export interface GrowthDataPoint {
  periodo: string;
  novosAlunos: number;
  totalAcumulado: number;
  alunosAtivos?: number;
  horasEstudo?: number;
}

export interface CourseTrackPerformance {
  id: string;
  nome: string;
  tipo: "curso" | "trilha";
  matriculas: number;
  progressoMedio: number;
  taxaConclusao: number;
  alunosAtivos: number;
}

export interface LearningFunnelStage {
  etapa: string;
  quantidade: number;
  percentual: number;
}

export interface DashboardSummaryResponse {
  overview: OverviewMetrics;
  ufDistribution: UfDistributionItem[];
  growthSeries: GrowthDataPoint[];
  courseTrackPerformance: CourseTrackPerformance[];
  learningFunnel: LearningFunnelStage[];
  certificatesOverTime: Array<{ periodo: string; certificados: number; totalAcumulado: number }>;
}

export type Granularity = "mensal" | "anual";
export type GrowthMetric = "novos" | "acumulado";

export interface GrowthChartConfig {
  granularity: Granularity;
  metric: GrowthMetric;
  comparePreviousYear: boolean;
}
