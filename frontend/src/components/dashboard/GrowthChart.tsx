import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { GrowthDataPoint, Granularity, GrowthMetric } from "../../types/dashboard";

interface GrowthChartProps {
  data: GrowthDataPoint[];
  granularity: Granularity;
  onGranularityChange: (g: Granularity) => void;
  metric: GrowthMetric;
  onMetricChange: (m: GrowthMetric) => void;
  comparePreviousYear?: boolean;
  previousYearData?: GrowthDataPoint[];
  loading?: boolean;
  title?: string;
  yAxisLabel?: string;
}

function formatPeriod(period: string, granularity: Granularity): string {
  if (granularity === "anual") {
    return period.split("-")[0];
  }
  const [year, month] = period.split("-");
  const months = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];
  return `${months[parseInt(month, 10) - 1]}/${year.slice(2)}`;
}

function abbreviatePeriod(period: string, granularity: Granularity): string {
  if (granularity === "anual") return period;
  const [year, month] = period.split("-");
  const months = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
  return `${months[parseInt(month, 10) - 1]}/${year.slice(2)}`;
}

export function GrowthChart({
  data,
  granularity,
  onGranularityChange,
  metric,
  onMetricChange,
  comparePreviousYear = false,
  previousYearData,
  loading,
  title = "Crescimento de alunos",
  yAxisLabel = "Alunos",
}: GrowthChartProps) {
  const displayData = useMemo(() => {
    if (!data.length) return [];
    return data.map((d) => ({
      periodo: formatPeriod(d.periodo, granularity),
      periodoAbbr: abbreviatePeriod(d.periodo, granularity),
      novos: d.novosAlunos,
      acumulado: d.totalAcumulado,
      ativos: d.alunosAtivos,
      horas: d.horasEstudo,
    }));
  }, [data, granularity]);

  const displayPreviousData = useMemo(() => {
    if (!previousYearData?.length) return [];
    return previousYearData.map((d) => ({
      periodo: formatPeriod(d.periodo, granularity),
      novos: d.novosAlunos,
      acumulado: d.totalAcumulado,
    }));
  }, [previousYearData, granularity]);

  const metricKey = metric === "novos" ? "novos" : "acumulado";
  const metricLabel = metric === "novos" ? "Novos alunos" : "Total acumulado";

  if (loading) {
    return (
      <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#25304a]">{title}</h3>
        </div>
        <div className="h-64 bg-slate-50 animate-pulse rounded-xl" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h3 className="font-semibold text-[#25304a]">{title}</h3>
        <div className="flex items-center gap-2">
          <select
            value={granularity}
            onChange={(e) => onGranularityChange(e.target.value as Granularity)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[120px] min-h-11"
          >
            <option value="mensal">Mensal</option>
            <option value="anual">Anual</option>
          </select>
          <select
            value={metric}
            onChange={(e) => onMetricChange(e.target.value as GrowthMetric)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px] min-h-11"
          >
            <option value="novos">Novos alunos</option>
            <option value="acumulado">Total acumulado</option>
          </select>
        </div>
      </div>

      <div className="h-64" style={{ width: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={displayData}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="periodo"
              tick={{ fontSize: 12, fill: "#64748b" }}
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={false}
              interval={0}
              tickFormatter={(value) => value}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
              label={{
                value: yAxisLabel,
                angle: -90,
                position: "insideLeft",
                offset: 10,
                fill: "#94a3b8",
                fontSize: 11,
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                padding: "12px 16px",
              }}
              labelFormatter={(label) => [`Período: ${label}`, metricLabel]}
              formatter={(value: unknown) =>
                typeof value === "number"
                  ? [value.toLocaleString("pt-BR"), metricLabel]
                  : ["—", metricLabel]
              }
            />
            <Line
              type="monotone"
              dataKey={metricKey}
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 4, fill: "#2563eb", strokeWidth: 2 }}
              activeDot={{ r: 6, fill: "#2563eb" }}
              name={metricLabel}
            />
            {comparePreviousYear && displayPreviousData.length > 0 && (
              <Line
                type="monotone"
                dataKey={metricKey}
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 4, fill: "#f59e0b", strokeWidth: 2 }}
                activeDot={{ r: 6, fill: "#f59e0b" }}
                name={`${metricLabel} (ano anterior)`}
              >
                {displayPreviousData.map((_, i) => (
                  <Line key={i} dataKey={metricKey} data={displayPreviousData} />
                ))}
              </Line>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#2563eb" }} />
          {metricLabel} (período atual)
        </span>
        {comparePreviousYear && previousYearData?.length && (
          <span className="inline-flex items-center gap-1.5">
            <span className="w-6 h-1" style={{ background: "repeating-linear-gradient(90deg, #f59e0b, #f59e0b 4px, transparent 4px, transparent 8px)" }} />
            {metricLabel} (ano anterior)
          </span>
        )}
      </div>
    </div>
  );
}

export default GrowthChart;