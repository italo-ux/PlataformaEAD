import { useMemo } from "react";
import {
  GraduationCap,
  Award,
  Clock,
  FileText,
  Star,
  Target,
  Hourglass,
  Users,
  MessageSquare,
  Map,
  CheckCircle2,
} from "lucide-react";
import type { Achievement } from "../../types/studentDashboard";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  GraduationCap,
  Award,
  Clock,
  FileText,
  Star,
  Target,
  Hourglass,
  Users,
  MessageSquare,
  Map,
};

interface AchievementCardProps {
  achievement: Achievement;
  onToggle?: () => void;
  isExpanded?: boolean;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function AchievementCard({
  achievement,
  onToggle,
  isExpanded,
}: AchievementCardProps) {
  const Icon = useMemo(
    () => ICON_MAP[achievement.icon] || Award,
    [achievement.icon],
  );

  const isConquered = achievement.status === "conquistada";
  const progressPercent = achievement.progress
    ? Math.min(100, Math.max(0, Math.round((achievement.progress.current / Math.max(1, achievement.progress.target)) * 100)))
    : null;

  return (
    <article
      className={`rounded-2xl border transition-all duration-200 ${
        isConquered
          ? "bg-amber-50 border-amber-200"
          : "bg-slate-50 border-slate-200 grayscale"
      } ${isExpanded ? "ring-2 ring-blue-500 ring-offset-2" : ""}`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-5 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-2xl"
        aria-expanded={isExpanded}
      >
        <div className="flex items-start gap-4">
          <div
            className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
              isConquered
                ? "bg-amber-100 text-amber-500"
                : "bg-slate-100 text-slate-400"
            }`}
          >
            <Icon size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-[#25304a] truncate">{achievement.title}</h3>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  isConquered
                    ? "bg-amber-100 text-amber-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {isConquered ? "Conquistada" : "Bloqueada"}
              </span>
            </div>
            <p className="mt-1.5 text-sm text-slate-700 line-clamp-2">{achievement.description}</p>
            {isConquered && (
              <p className="mt-2 text-xs text-amber-700 font-medium">
                Conquistada em {achievement.acquiredAt ? formatDate(achievement.acquiredAt) : "Data não registrada"}
              </p>
            )}
            {!isConquered && progressPercent !== null && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Progresso</span>
                  <span>{achievement.progress!.current} / {achievement.progress!.target}</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-400 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          {onToggle && (
            <span className="flex-shrink-0 text-slate-400 transition-transform duration-200" style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t px-5 pb-5 bg-white/50" style={{ borderColor: isExpanded ? "rgb(59 130 246)" : isConquered ? "#fde68a" : "#e2e8f0" }}>
          <div className="mt-4 space-y-3">
            <div>
              <div className="flex items-center gap-2">
                {isConquered && <CheckCircle2 size={14} className="text-green-500" />}
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {isConquered ? "Requisito concluído" : "Requisito"}
                </p>
              </div>
              <p className="text-sm text-slate-700 mt-1">{achievement.unlockCondition}</p>
            </div>
            {!isConquered && achievement.progress && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Progresso atual</p>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-400 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-slate-600 w-20 text-right">
                    {progressPercent}%
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {achievement.progress.current} de {achievement.progress.target} concluídos
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

export default AchievementCard;