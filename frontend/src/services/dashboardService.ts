import { apiFetch } from "./api";
import type { DashboardFilters, DashboardSummaryResponse, Granularity } from "../types/dashboard";

function buildQueryString(filters: DashboardFilters, growth: Granularity, certificates: Granularity) {
  const params = new URLSearchParams({
    granularidadeCrescimento: growth,
    granularidadeCertificados: certificates,
  });
  if (filters.periodoInicio) params.set("periodoInicio", filters.periodoInicio);
  if (filters.periodoFim) params.set("periodoFim", filters.periodoFim);
  if (filters.cursoId) params.set("cursoId", filters.cursoId);
  if (filters.trilhaId) params.set("trilhaId", filters.trilhaId);
  if (filters.uf) params.set("uf", filters.uf);
  return params.toString();
}

export class DashboardApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const dashboardService = {
  async getSummary(
    filters: DashboardFilters,
    growth: Granularity = "mensal",
    certificates: Granularity = "mensal",
  ): Promise<DashboardSummaryResponse> {
    const response = await apiFetch(
      `/admin/dashboard/resumo?${buildQueryString(filters, growth, certificates)}`,
    );
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { message?: string | string[] } | null;
      const message = data?.message;
      throw new DashboardApiError(
        Array.isArray(message) ? message.join(" ") : message || "Não foi possível carregar os dados do dashboard.",
        response.status,
      );
    }
    return response.json() as Promise<DashboardSummaryResponse>;
  },
};

export default dashboardService;
