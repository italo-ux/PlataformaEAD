import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { Granularity } from "../../types/dashboard";

interface CertificateDataPoint {
  periodo: string;
  certificados: number;
  totalAcumulado: number;
}

interface CertificatesOverTimeProps {
  data: CertificateDataPoint[];
  granularity: Granularity;
  onGranularityChange: (g: Granularity) => void;
  loading?: boolean;
}

function formatPeriod(period: string, granularity: Granularity): string {
  if (granularity === "anual") return period;
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

export function CertificatesOverTime({
  data,
  granularity,
  onGranularityChange,
  loading,
}: CertificatesOverTimeProps) {
  const displayData = useMemo(() => {
    if (!data.length) return [];
    return data.map((d) => ({
      periodo: formatPeriod(d.periodo, granularity),
      certificados: d.certificados,
      acumulado: d.totalAcumulado,
    }));
  }, [data, granularity]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#25304a]">Certificados emitidos</h3>
        </div>
        <div className="h-64 bg-slate-50 animate-pulse rounded-xl" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h3 className="font-semibold text-[#25304a]">Certificados emitidos</h3>
        <select
          value={granularity}
          onChange={(e) => onGranularityChange(e.target.value as Granularity)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[120px] min-h-11"
        >
          <option value="mensal">Mensal</option>
          <option value="anual">Anual</option>
        </select>
      </div>

      <div className="h-64" style={{ width: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={displayData}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <defs>
              <linearGradient id="certificatesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="periodo"
              tick={{ fontSize: 12, fill: "#64748b" }}
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
              label={{
                value: "Certificados",
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
              labelFormatter={(label) => `Período: ${label}`}
              formatter={(value: unknown, name: string | number | undefined) =>
                typeof value === "number"
                  ? [
                      value.toLocaleString("pt-BR"),
                      name === "certificados"
                        ? "Emitidos no período"
                        : "Total acumulado",
                    ]
                  : [
                      "—",
                      name === "certificados"
                        ? "Emitidos no período"
                        : "Total acumulado",
                    ]
              }
            />
            <Legend
              wrapperStyle={{ paddingTop: "16px" }}
              layout="horizontal"
              align="center"
            />
            <Area
              type="monotone"
              dataKey="certificados"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#certificatesGradient)"
              name="Emitidos no período"
            />
            <Area
              type="monotone"
              dataKey="acumulado"
              stroke="#059669"
              strokeWidth={2}
              strokeDasharray="5 5"
              fillOpacity={0}
              name="Total acumulado"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#10b981" }} />
          Emitidos no período
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-6 h-1" style={{ background: "repeating-linear-gradient(90deg, #059669, #059669 4px, transparent 4px, transparent 8px)" }} />
          Total acumulado
        </span>
      </div>
    </div>
  );
}

export default CertificatesOverTime;