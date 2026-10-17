import { apiFetch } from "./api";
import type {
  DashboardFilters,
  DashboardSummaryResponse,
} from "../types/dashboard";

function buildQueryString(filters: DashboardFilters): string {
  const params = new URLSearchParams();
  if (filters.periodoInicio) params.append("periodoInicio", filters.periodoInicio);
  if (filters.periodoFim) params.append("periodoFim", filters.periodoFim);
  if (filters.cursoId && filters.cursoId !== "__none__") params.append("cursoId", filters.cursoId);
  if (filters.cursoId === "__none__") params.append("cursoId", "");
  if (filters.trilhaId && filters.trilhaId !== "__none__") params.append("trilhaId", filters.trilhaId);
  if (filters.trilhaId === "__none__") params.append("trilhaId", "");
  if (filters.uf) params.append("uf", filters.uf);
  return params.toString();
}

export class DashboardApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function readResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as
      | { message?: string | string[] }
      | null;
    const message = data?.message;
    throw new DashboardApiError(
      Array.isArray(message)
        ? message.join(" ")
        : message || "Não foi possível carregar os dados do dashboard.",
      response.status,
    );
  }
  return response.json() as Promise<T>;
}

export const dashboardService = {
  getSummary: (filters: DashboardFilters) =>
    apiFetch(`/admin/dashboard/resumo?${buildQueryString(filters)}`).then(
      readResponse<DashboardSummaryResponse>,
    ),

  getOverview: (filters: DashboardFilters) =>
    apiFetch(`/admin/dashboard/overview?${buildQueryString(filters)}`).then(
      readResponse<{
        alunosCadastrados: number;
        alunosAtivos: number;
        matriculasIniciadas: number;
        taxaConclusao: number;
        certificadosEmitidos: number;
      }>,
    ),

  getUfDistribution: (filters: DashboardFilters) =>
    apiFetch(`/admin/dashboard/uf-distribution?${buildQueryString(filters)}`).then(
      readResponse<
        Array<{
          uf: string;
          nome: string;
          alunos: number;
          participacao: number;
        }>
      >,
    ),

  getGrowthSeries: (
    filters: DashboardFilters,
    granularity: "mensal" | "anual" = "mensal",
  ) =>
    apiFetch(
      `/admin/dashboard/crescimento?${buildQueryString(filters)}&granularidade=${granularity}`,
    ).then(
      readResponse<
        Array<{
          periodo: string;
          novosAlunos: number;
          totalAcumulado: number;
          alunosAtivos?: number;
          horasEstudo?: number;
        }>
      >,
    ),

  getCourseTrackPerformance: (filters: DashboardFilters) =>
    apiFetch(`/admin/dashboard/cursos-trilhas?${buildQueryString(filters)}`).then(
      readResponse<
        Array<{
          id: string;
          nome: string;
          tipo: "curso" | "trilha";
          matriculas: number;
          progressoMedio: number;
          taxaConclusao: number;
          alunosAtivos: number;
        }>
      >,
    ),

  getLearningFunnel: (filters: DashboardFilters) =>
    apiFetch(`/admin/dashboard/funil?${buildQueryString(filters)}`).then(
      readResponse<
        Array<{
          etapa: string;
          quantidade: number;
          percentual: number;
        }>
      >,
    ),

  getCertificatesOverTime: (
    filters: DashboardFilters,
    granularity: "mensal" | "anual" = "mensal",
  ) =>
    apiFetch(
      `/admin/dashboard/certificados?${buildQueryString(filters)}&granularidade=${granularity}`,
    ).then(
      readResponse<
        Array<{
          periodo: string;
          certificados: number;
          totalAcumulado: number;
        }>
      >,
    ),
};

export default dashboardService;