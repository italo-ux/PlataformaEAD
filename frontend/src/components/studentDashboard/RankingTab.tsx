import { useEffect, useState, useCallback } from "react";
import { Trophy, MapPin, User as UserIcon, AlertCircle, Medal, Award } from "lucide-react";
import { studentDashboardService } from "../../services/studentDashboardService";
import type { RankingScope, RankingResponse, RankingParticipant } from "../../types/studentDashboard";
import type { User } from "../../data/userMock";

interface RankingTabProps {
  user: User;
}

function getAvatarColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 45%)`;
}

function renderAvatar(
  participant: RankingParticipant,
  size: "sm" | "md" | "lg" = "md",
): React.ReactElement {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  };
  const bgColor = participant.avatarUrl ? undefined : getAvatarColor(participant.userId);

  if (participant.avatarUrl) {
    return (
      <img
        src={participant.avatarUrl}
        alt={participant.name}
        className={`rounded-full ${sizeClasses[size]} object-cover`}
      />
    );
  }

  return (
    <div
      className={`rounded-full ${sizeClasses[size]} flex items-center justify-center font-semibold text-white`}
      style={{ backgroundColor: bgColor }}
    >
      {participant.initials}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-1/4" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorMessage({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
      <p className="text-red-700 mb-3">Não foi possível carregar o ranking.</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
      >
        Tentar novamente
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <Trophy className="mx-auto h-12 w-12 text-slate-400" />
      <p className="mt-4 font-bold text-[#25304a]">Nenhum participante no ranking</p>
      <p className="mt-2 text-sm text-slate-500">
        Seja o primeiro a começar a estudar e aparecer aqui!
      </p>
    </div>
  );
}

function RankingHeader({ scope, setScope, userMunicipality }: { scope: RankingScope; setScope: (s: RankingScope) => void; userMunicipality: string | undefined }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 border border-slate-300 rounded-lg p-1 bg-white" role="tablist">
          {(["nacional", "municipal"] as RankingScope[]).map((s) => (
            <button
              key={s}
              role="tab"
              aria-selected={scope === s}
              onClick={() => setScope(s)}
              disabled={s === "municipal" && !userMunicipality}
              className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors min-h-11 ${
                scope === s
                  ? "bg-blue-600 text-white"
                  : "text-slate-700 hover:bg-slate-50"
              } ${s === "municipal" && !userMunicipality ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {s === "municipal" && <MapPin size={16} />}
              {s === "nacional" && <Trophy size={16} />}
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {!userMunicipality && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3" role="alert">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800">Município não informado</p>
            <p className="mt-1 text-sm text-amber-700">
              Informe seu município no perfil para acessar o ranking municipal.
            </p>
            <button
              type="button"
              className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-100 rounded-lg hover:bg-amber-200"
              onClick={() => window.location.href = "/perfil"}
            >
              <UserIcon size={14} /> Editar perfil
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RankingTable({ data, setScope }: { data: RankingResponse; setScope: (s: RankingScope) => void }) {
  const currentUserInTop10 = data.top10.find((p) => p.isCurrentUser);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        {/* Desktop: tabela */}
        <div className="hidden sm:block">
          <div className="overflow-x-auto">
            <table className="w-full" role="table">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Pos.</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Aluno</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">
                  Conquistas
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                  Cursos
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                  Certificados
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.top10.map((participant) => (
                <tr
                  key={participant.userId}
                  className={`hover:bg-slate-50 transition-colors ${
                    participant.isCurrentUser ? "bg-blue-50" : ""
                  }`}
                >
                  <td className="px-4 py-3 font-bold text-[#25304a]">
                    {participant.position === 1 && <span className="text-amber-500 flex items-center gap-1">1º <Medal size={16} /></span>}
                    {participant.position === 2 && <span className="text-slate-400 flex items-center gap-1">2º <Medal size={16} /></span>}
                    {participant.position === 3 && <span className="text-amber-700 flex items-center gap-1">3º <Medal size={16} /></span>}
                    {participant.position > 3 && <span className="text-slate-600">{participant.position}º</span>}
                    {participant.isCurrentUser && (
                      <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Você</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {renderAvatar(participant, "md")}
                      <div className="min-w-0">
                        <p className={`font-medium truncate ${participant.isCurrentUser ? "text-blue-700" : "text-[#25304a]"}`}>
                          {participant.name}
                          {participant.isCurrentUser && <span className="ml-1 text-xs font-medium text-blue-600">(Você)</span>}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell">
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-slate-700">
                      <Trophy size={14} className="text-amber-500" />
                      {participant.achievementsCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-slate-700">
                      <UserIcon size={14} className="text-blue-500" />
                      {participant.completedCoursesCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center hidden lg:table-cell">
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-slate-700">
                      <Award size={14} className="text-amber-500" />
                      {participant.certificatesCount ?? 0}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

        {/* Mobile: cards compactos */}
        <div className="sm:hidden space-y-3">
          {data.top10.map((participant) => (
            <article
              key={participant.userId}
              className={`rounded-xl border p-4 flex items-center gap-3 transition-colors ${
                participant.isCurrentUser ? "bg-blue-50 border-blue-200" : "bg-white border-slate-200"
              }`}
            >
              {/* Avatar/Iniciais */}
              <div
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm"
                style={{ backgroundColor: participant.avatarUrl ? undefined : getAvatarColor(participant.userId) }}
              >
                {participant.avatarUrl ? (
                  <img src={participant.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  participant.initials
                )}
              </div>

              {/* Info principal */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#25304a]">
                    {participant.position === 1 ? (
                      <>1º <Medal size={14} className="text-amber-500" />
                      </>
                    ) : participant.position === 2 ? (
                      <>2º <Medal size={14} className="text-slate-400" />
                      </>
                    ) : participant.position === 3 ? (
                      <>3º <Medal size={14} className="text-amber-700" />
                      </>
                    ) : (
                      `${participant.position}º`
                    )}
                  </span>
                  <span className="font-medium truncate">{participant.name}</span>
                  {participant.isCurrentUser && (
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">Você</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-600 mt-1">
                  <span className="flex items-center gap-1">
                    <Trophy size={10} className="text-amber-500" />
                    <span>{participant.achievementsCount} conquistas</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <UserIcon size={10} className="text-blue-500" />
                    <span>{participant.completedCoursesCount} cursos</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Award size={10} className="text-amber-500" />
                    <span>{participant.certificatesCount ?? 0} certificados</span>
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {currentUserInTop10 && (
        <div className="px-4 py-3 bg-blue-50 border-t border-slate-200 flex items-center justify-between text-sm">
          <span className="text-blue-700 font-medium">Sua posição: {currentUserInTop10.position}º</span>
          <span className="text-slate-500">{currentUserInTop10.achievementsCount} conquistas · {currentUserInTop10.completedCoursesCount} cursos · {currentUserInTop10.certificatesCount ?? 0} certificados</span>
        </div>
      )}

      {!currentUserInTop10 && data.currentUserPosition && data.distanceToTop10 !== undefined && (
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-slate-700">
            <UserIcon size={14} />
            <span>
              Você está em <strong>{data.currentUserPosition}º</strong>,
              a <strong>{data.distanceToTop10}</strong> {data.distanceToTop10 === 1 ? "posição" : "posições"} do Top 10
            </span>
          </div>
          <button
            type="button"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 underline"
            onClick={() => setScope("nacional")}
          >
            Ver ranking nacional
          </button>
        </div>
      )}
    </div>
  );
}

export function RankingTab({ user }: RankingTabProps) {
  const [scope, setScope] = useState<RankingScope>("nacional");
  const [data, setData] = useState<RankingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRanking = useCallback(async () => {
    // Não carrega ranking municipal se não há município no perfil
    if (scope === "municipal" && !user.municipality) {
      setData({
        scope: "municipal",
        top10: [],
        municipalityRequired: true,
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const municipality = scope === "municipal" ? user.municipality : undefined;
      const currentUserId = String(user.id);
      const currentUserName = user.name;
      const result = await studentDashboardService.getRanking(scope, municipality, currentUserId, currentUserName);
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar o ranking.",
      );
    } finally {
      setLoading(false);
    }
  }, [scope, user.id, user.municipality, user.name]);

  useEffect(() => {
    loadRanking();
  }, [loadRanking]);

  if (loading) {
    return (
      <div className="space-y-6">
        <RankingHeader scope={scope} setScope={setScope} userMunicipality={user.municipality} />
        <LoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <RankingHeader scope={scope} setScope={setScope} userMunicipality={user.municipality} />
        <ErrorMessage onRetry={loadRanking} />
      </div>
    );
  }

  if (!data || data.top10.length === 0) {
    return (
      <div className="space-y-6">
        <RankingHeader scope={scope} setScope={setScope} userMunicipality={user.municipality} />
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RankingHeader scope={scope} setScope={setScope} userMunicipality={user.municipality} />
      <RankingTable data={data} setScope={setScope} />
    </div>
  );
}

export default RankingTab;