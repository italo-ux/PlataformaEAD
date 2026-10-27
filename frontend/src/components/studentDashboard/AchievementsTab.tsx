import { useEffect, useState, useCallback } from "react";
import { Trophy, Lock, Hourglass } from "lucide-react";
import { studentDashboardService } from "../../services/studentDashboardService";
import type { AchievementFilter, AchievementsResponse } from "../../types/studentDashboard";
import { AchievementCard } from "./AchievementCard";

function EmptyStateMessage({ filter }: { filter: AchievementFilter }) {
  const messages: Record<AchievementFilter, string> = {
    todas: "Nenhuma conquista disponível no momento.",
    conquistadas: "Complete cursos e atividades para desbloquear conquistas.",
    em_progresso: "Nenhuma conquista em progresso no momento.",
    bloqueadas: "Nenhuma conquista bloqueada no momento.",
  };
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <Trophy className="mx-auto h-12 w-12 text-slate-400" />
      <p className="mt-4 font-bold text-[#25304a]">{messages[filter]}</p>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 animate-pulse">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-200" />
            <div className="flex-1 space-y-3">
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-4 bg-slate-200 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorRetry({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
      <p className="text-red-700 mb-3">Não foi possível carregar as conquistas.</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
      >
        Tentar novamente
      </button>
    </div>
  );
}

export function AchievementsTab() {
  const [filter, setFilter] = useState<AchievementFilter>("todas");
  const [data, setData] = useState<AchievementsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadAchievements = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await studentDashboardService.getAchievements(filter);
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar as conquistas.",
      );
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const filterLabels: Record<AchievementFilter, { label: string; icon: React.ComponentType<{ size?: number }> }> = {
    todas: { label: "Todas", icon: Trophy },
    conquistadas: { label: "Conquistadas", icon: Trophy },
    em_progresso: { label: "Em progresso", icon: Hourglass },
    bloqueadas: { label: "Bloqueadas", icon: Lock },
  };

  return (
    <div className="space-y-4">
      {/* Header + Stats - SEMPRE visível */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600">
          <span className="font-semibold text-amber-600">{data?.stats.conquered ?? 0}</span> de <span className="font-semibold">{data?.stats.total ?? 0}</span> conquistadas
        </div>
      </div>

      {/* Filtros - SEMPRE visíveis */}
      <div className="flex flex-wrap gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Filtrar conquistas">
        {(["todas", "conquistadas", "em_progresso", "bloqueadas"] as AchievementFilter[]).map((f) => {
          const Icon = filterLabels[f].icon;
          return (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              onClick={() => {
                setFilter(f);
                setExpandedId(null);
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors min-h-11 whitespace-nowrap ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
              }`}
            >
              <Icon size={16} />
              {filterLabels[f].label}
            </button>
          );
        })}
      </div>

      {/* Área de resultados */}
      {loading ? (
        <SkeletonGrid />
      ) : error ? (
        <ErrorRetry onRetry={loadAchievements} />
      ) : !data || data.achievements.length === 0 ? (
        <EmptyStateMessage filter={filter} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.achievements.map((achievement) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              isExpanded={expandedId === achievement.id}
              onToggle={() => toggleExpand(achievement.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default AchievementsTab;
