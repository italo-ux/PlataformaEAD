import { useMemo } from "react";
import { Calendar, X, Filter } from "lucide-react";
import type { DashboardFilters } from "../../types/dashboard";

interface GlobalFiltersProps {
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
  courses: Array<{ id: string; nome: string }>;
  trilhas: Array<{ id: string; nome: string }>;
  loading?: boolean;
}

const UFS = [
  { value: "AC", label: "Acre (AC)" },
  { value: "AL", label: "Alagoas (AL)" },
  { value: "AP", label: "Amapá (AP)" },
  { value: "AM", label: "Amazonas (AM)" },
  { value: "BA", label: "Bahia (BA)" },
  { value: "CE", label: "Ceará (CE)" },
  { value: "DF", label: "Distrito Federal (DF)" },
  { value: "ES", label: "Espírito Santo (ES)" },
  { value: "GO", label: "Goiás (GO)" },
  { value: "MA", label: "Maranhão (MA)" },
  { value: "MT", label: "Mato Grosso (MT)" },
  { value: "MS", label: "Mato Grosso do Sul (MS)" },
  { value: "MG", label: "Minas Gerais (MG)" },
  { value: "PA", label: "Pará (PA)" },
  { value: "PB", label: "Paraíba (PB)" },
  { value: "PR", label: "Paraná (PR)" },
  { value: "PE", label: "Pernambuco (PE)" },
  { value: "PI", label: "Piauí (PI)" },
  { value: "RJ", label: "Rio de Janeiro (RJ)" },
  { value: "RN", label: "Rio Grande do Norte (RN)" },
  { value: "RS", label: "Rio Grande do Sul (RS)" },
  { value: "RO", label: "Rondônia (RO)" },
  { value: "RR", label: "Roraima (RR)" },
  { value: "SC", label: "Santa Catarina (SC)" },
  { value: "SP", label: "São Paulo (SP)" },
  { value: "SE", label: "Sergipe (SE)" },
  { value: "TO", label: "Tocantins (TO)" },
];

export function GlobalFilters({
  filters,
  onFiltersChange,
  courses,
  trilhas,
  loading,
}: GlobalFiltersProps) {
  const activeFiltersCount = useMemo(
    () =>
      [
        filters.cursoId,
        filters.trilhaId,
        filters.uf,
        filters.periodoInicio,
        filters.periodoFim,
      ].filter(Boolean).length,
    [filters],
  );

  const hasActiveFilters = activeFiltersCount > 0;

  const handleChange = (
    key: keyof DashboardFilters,
    value: string | undefined,
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      periodoInicio: "",
      periodoFim: "",
      cursoId: undefined,
      trilhaId: undefined,
      uf: undefined,
    });
  };

  const renderFiltersContent = () => (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <div className="sm:col-span-2 lg:col-span-2">
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Período
        </label>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="date"
              value={filters.periodoInicio}
              onChange={(e) => handleChange("periodoInicio", e.target.value || undefined)}
              disabled={loading}
              className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-11"
              placeholder="Início"
            />
          </div>
          <span className="text-slate-400">até</span>
          <div className="relative flex-1">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="date"
              value={filters.periodoFim}
              onChange={(e) => handleChange("periodoFim", e.target.value || undefined)}
              disabled={loading}
              className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-11"
              placeholder="Fim"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Curso
        </label>
        <select
          value={filters.cursoId || ""}
          onChange={(e) => handleChange("cursoId", e.target.value || undefined)}
          disabled={loading}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-11"
        >
          <option value="">Todos os cursos</option>
          <option value="__none__">Nenhum curso (só trilhas)</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Trilha
        </label>
        <select
          value={filters.trilhaId || ""}
          onChange={(e) => handleChange("trilhaId", e.target.value || undefined)}
          disabled={loading}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-11"
        >
          <option value="">Todas as trilhas</option>
          <option value="__none__">Nenhuma trilha (só cursos)</option>
          {trilhas.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nome}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Estado (UF)
        </label>
        <select
          value={filters.uf || ""}
          onChange={(e) => handleChange("uf", e.target.value || undefined)}
          disabled={loading}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-11"
        >
          <option value="">Todos os estados</option>
          {UFS.map((uf) => (
            <option key={uf.value} value={uf.value}>
              {uf.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <div className="rounded-2xl border border-blue-100 bg-white shadow-sm">
      {/* Desktop: inline filters */}
      <div className="hidden lg:block p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#25304a]">Filtros globais</h3>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
              disabled={loading}
            >
              <X size={14} /> Limpar
            </button>
          )}
        </div>
        {renderFiltersContent()}
      </div>

      {/* Mobile: collapsible with <details>/<summary> */}
      <details className="lg:hidden group">
        <summary
          className="flex items-center justify-between p-4 cursor-pointer list-none min-h-11"
          aria-label={hasActiveFilters ? `Filtros globais, ${activeFiltersCount} ativos` : "Filtros globais"}
        >
          <div className="flex items-center gap-3">
            <Filter className="h-5 w-5 text-slate-500" />
            <div>
              <span className="font-semibold text-[#25304a]">Filtros globais</span>
              {hasActiveFilters && (
                <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  {activeFiltersCount} ativo{activeFiltersCount > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
          <span className="text-slate-400 group-open:rotate-180 transition-transform duration-200">
            ▼
          </span>
        </summary>
        <div className="px-4 pb-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-500">
              {hasActiveFilters ? `${activeFiltersCount} filtro${activeFiltersCount > 1 ? "s" : ""} ativo${activeFiltersCount > 1 ? "s" : ""}` : "Nenhum filtro ativo"}
            </span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 min-h-11 px-3"
                disabled={loading}
              >
                <X size={14} /> Limpar
              </button>
            )}
          </div>
          {renderFiltersContent()}
        </div>
      </details>
    </div>
  );
}

export default GlobalFilters;