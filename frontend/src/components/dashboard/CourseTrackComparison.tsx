import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import type { CourseTrackPerformance } from "../../types/dashboard";

interface CourseTrackComparisonProps {
  data: CourseTrackPerformance[];
  loading?: boolean;
  sortBy?: "matriculas" | "progressoMedio" | "taxaConclusao" | "alunosAtivos";
  onSortChange?: (key: "matriculas" | "progressoMedio" | "taxaConclusao" | "alunosAtivos") => void;
}

const COLORS = {
  matriculas: "#2563eb",
  progressoMedio: "#10b981",
  taxaConclusao: "#f59e0b",
  alunosAtivos: "#8b5cf6",
};

const LABELS = {
  matriculas: "Matrículas",
  progressoMedio: "Progresso médio (%)",
  taxaConclusao: "Taxa de conclusão (%)",
  alunosAtivos: "Alunos ativos",
};

export function CourseTrackComparison({
  data,
  loading,
  sortBy = "matriculas",
  onSortChange,
}: CourseTrackComparisonProps) {
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => b[sortBy] - a[sortBy]);
  }, [data, sortBy]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#25304a]">Cursos e trilhas</h3>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-50 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#25304a]">Cursos e trilhas</h3>
        </div>
        <div className="text-center py-8 text-slate-500">
          Nenhum dado disponível para os filtros selecionados.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h3 className="font-semibold text-[#25304a]">Cursos e trilhas</h3>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-500">Ordenar por:</label>
          <select
            value={sortBy}
            onChange={(e) => onSortChange?.(e.target.value as typeof sortBy)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-11"
          >
            <option value="matriculas">Matrículas</option>
            <option value="progressoMedio">Progresso médio</option>
            <option value="taxaConclusao">Taxa de conclusão</option>
            <option value="alunosAtivos">Alunos ativos</option>
          </select>
        </div>
      </div>

      <div className="h-72" style={{ width: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sortedData}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: "#64748b" }}
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={false}
              label={{
                value: LABELS[sortBy],
                position: "insideBottom",
                offset: -25,
                fill: "#94a3b8",
                fontSize: 11,
              }}
            />
            <YAxis
              type="category"
              dataKey="nome"
              width={180}
              tick={{ fontSize: 11, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
              formatter={((value: unknown, name: string | number | undefined) => {
                if (typeof value === "number") {
                  const label = typeof name === "string" ? LABELS[name as keyof typeof LABELS] || name : String(name);
                  return [value.toLocaleString("pt-BR"), label];
                }
                return ["—", typeof name === "string" ? name : String(name)];
              }) as (value: unknown, name: string | number | undefined) => [string, string]}
              labelFormatter={(label) => label}
            />
            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
              formatter={(value) => LABELS[value as keyof typeof LABELS] || value}
            />
            <Bar
              dataKey={sortBy}
              name={LABELS[sortBy]}
              radius={[0, 4, 4, 0]}
              barSize={24}
            >
              {sortedData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[sortBy]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200">
              <th className="pb-2 font-medium">Curso/Trilha</th>
              <th className="pb-2 font-medium text-right">Matrículas</th>
              <th className="pb-2 font-medium text-right">Progresso médio</th>
              <th className="pb-2 font-medium text-right">Taxa conclusão</th>
              <th className="pb-2 font-medium text-right">Alunos ativos</th>
              <th className="pb-2 font-medium text-center">Tipo</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((item) => (
              <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-2 font-medium text-[#25304a] truncate max-w-xs">
                  {item.nome}
                </td>
                <td className="py-2 text-right text-slate-700">
                  {item.matriculas.toLocaleString("pt-BR")}
                </td>
                <td className="py-2 text-right text-slate-700">
                  {item.progressoMedio.toFixed(1)}%
                </td>
                <td className="py-2 text-right text-slate-700">
                  {item.taxaConclusao.toFixed(1)}%
                </td>
                <td className="py-2 text-right text-slate-700">
                  {item.alunosAtivos.toLocaleString("pt-BR")}
                </td>
                <td className="py-2 text-center">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      item.tipo === "curso"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {item.tipo === "curso" ? "Curso" : "Trilha"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CourseTrackComparison;