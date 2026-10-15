import type { LearningFunnelStage } from "../../types/dashboard";

interface LearningFunnelProps {
  data: LearningFunnelStage[];
  loading?: boolean;
}

const STAGE_ICONS: Record<string, string> = {
  matriculados: "👥",
  iniciaram: "▶️",
  avancaram: "📈",
  concluiram: "✅",
};

export function LearningFunnel({ data, loading }: LearningFunnelProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
        <h3 className="font-semibold text-[#25304a] mb-4">Funil de aprendizagem</h3>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-50 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
        <h3 className="font-semibold text-[#25304a] mb-4">Funil de aprendizagem</h3>
        <div className="text-center py-8 text-slate-500">
          Nenhum dado de funil disponível para os filtros selecionados.
        </div>
      </div>
    );
  }

  const maxQuantidade = Math.max(...data.map((d) => d.quantidade));

  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
      <h3 className="font-semibold text-[#25304a] mb-4">Funil de aprendizagem</h3>
      <p className="text-sm text-slate-500 mb-6">
        Acompanhe a jornada dos alunos desde a matrícula até a conclusão.
      </p>

      <div className="space-y-3">
        {data.map((stage, index) => {
          const width = maxQuantidade > 0 ? (stage.quantidade / maxQuantidade) * 100 : 0;
          const isFirst = index === 0;
          const previousQuantidade = isFirst ? stage.quantidade : data[index - 1].quantidade;
          const conversionRate = previousQuantidade > 0
            ? ((stage.quantidade / previousQuantidade) * 100).toFixed(1)
            : "0";

          return (
            <div key={stage.etapa} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-3 min-w-[180px]">
                  <span className="text-2xl" aria-hidden="true">
                    {STAGE_ICONS[stage.etapa.toLowerCase()] || "📊"}
                  </span>
                  <div>
                    <p className="font-medium text-[#25304a]">{stage.etapa}</p>
                    <p className="text-xs text-slate-500">
                      {stage.quantidade.toLocaleString("pt-BR")} alunos ({stage.percentual.toFixed(1)}% do total)
                    </p>
                  </div>
                </div>
                {!isFirst && (
                  <div className="text-right">
                    <p className="font-semibold text-emerald-600">{conversionRate}%</p>
                    <p className="text-xs text-slate-500">conversão</p>
                  </div>
                )}
              </div>
              <div className="h-8 rounded-full bg-slate-100 overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                  style={{ width: `${width}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-end pr-3 text-white font-medium text-sm">
                  {stage.quantidade.toLocaleString("pt-BR")}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {data.slice(1).map((stage, index) => {
          const previousQuantidade = data[index].quantidade;
          const conversionRate = previousQuantidade > 0
            ? ((stage.quantidade / previousQuantidade) * 100).toFixed(1)
            : "0";

          return (
            <div
              key={stage.etapa}
              className="rounded-lg bg-slate-50 p-4 text-center"
            >
              <p className="text-2xl font-black text-[#25304a]">{conversionRate}%</p>
              <p className="text-xs text-slate-500 mt-1">
                {data[index].etapa} → {stage.etapa}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default LearningFunnel;