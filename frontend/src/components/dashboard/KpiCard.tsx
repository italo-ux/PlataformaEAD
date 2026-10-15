import type { ComponentType } from "react";

interface KpiCardProps {
  label: string;
  value: number | string;
  icon: ComponentType<{ size?: number }>;
  trend?: {
    value: number;
    label: string;
    positive: boolean;
  };
  loading?: boolean;
}

export function KpiCard({ label, value, icon: Icon, trend, loading }: KpiCardProps) {
  return (
    <article className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-1 text-3xl font-black text-[#25304a]">
            {loading ? (
              <span className="inline-block w-20 h-8 bg-slate-200 animate-pulse rounded" />
            ) : (
              value
            )}
          </p>
        </div>
        <div className="rounded-xl bg-blue-50 p-3 text-blue-600 flex-shrink-0">
          <Icon size={28} />
        </div>
      </div>
      {trend && !loading && (
        <div className="mt-4 flex items-center gap-2 text-sm">
          <span
            className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full text-xs ${
              trend.positive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
            }`}
          >
            {trend.positive ? "▲" : "▼"} {trend.value}%
          </span>
          <span className="text-slate-500">{trend.label}</span>
        </div>
      )}
    </article>
  );
}

export default KpiCard;