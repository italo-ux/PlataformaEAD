import { apiFetch } from "./api";
import type {
  RankingScope,
  RankingResponse,
  AchievementFilter,
  AchievementsResponse,
} from "../types/studentDashboard";
import { mockStudentDashboardService } from "../data/mocks/studentDashboardMock";

type DataSource = "mock" | "api";

const DATA_SOURCE: DataSource = (import.meta.env.VITE_STUDENT_DASHBOARD_DATA_SOURCE as DataSource) ?? "mock";

if (!["mock", "api"].includes(DATA_SOURCE)) {
  throw new Error(`VITE_STUDENT_DASHBOARD_DATA_SOURCE inválido: "${DATA_SOURCE}". Use "mock" ou "api".`);
}

export class StudentDashboardApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Contrato da API: GET /aluno/ranking
 * 
 * Query params:
 * - scope: "nacional" | "municipal" (obrigatório)
 * - municipality: string (obrigatório se scope === "municipal")
 * - currentUserId: string (opcional)
 * - currentUserName: string (opcional)
 * 
 * Response (RankingResponse):
 * {
 *   scope: "nacional" | "municipal",
 *   top10: RankingParticipant[],
 *   currentUserPosition?: number,
 *   distanceToTop10?: number,
 *   municipality?: string,
 *   municipalityRequired?: boolean
 * }
 * 
 * RankingParticipant:
 * {
 *   position: number,
 *   userId: string,
 *   name: string,
 *   avatarUrl?: string,
 *   initials: string,
 *   achievementsCount: number,
 *   completedCoursesCount: number,
 *   certificatesCount?: number,  // NOVO: substitui trophies
 *   isCurrentUser: boolean
 * }
 */
const realService = {
  getRanking: async (scope: RankingScope, municipality?: string, currentUserId?: string, currentUserName?: string): Promise<RankingResponse> => {
    const params = new URLSearchParams({ scope });
    if (municipality) params.append("municipality", municipality);
    if (currentUserId) params.append("currentUserId", currentUserId);
    if (currentUserName) params.append("currentUserName", currentUserName);
    
    const response = await apiFetch(`/aluno/ranking?${params.toString()}`);
    if (!response.ok) {
      throw new Error(
        `API de ranking indisponível (${response.status}). ` +
        `Configure VITE_STUDENT_DASHBOARD_DATA_SOURCE=mock para desenvolvimento ou implemente o endpoint /aluno/ranking.`
      );
    }
    return response.json();
  },

  /**
   * Contrato da API: GET /aluno/conquistas
   * 
   * Query params:
   * - filter: "todas" | "conquistadas" | "bloqueadas" (default: "todas")
   * 
   * Response (AchievementsResponse):
   * {
   *   achievements: Achievement[],
   *   stats: { total: number; conquered: number; locked: number }
   * }
   * 
   * Achievement:
   * {
   *   id: string,
   *   title: string,
   *   description: string,
   *   unlockCondition: string,
   *   icon: string,
   *   status: "conquistada" | "bloqueada",
   *   acquiredAt?: string,      // ISO 8601
   *   progress?: { current: number; target: number }
   * }
   */
  getAchievements: async (filter: AchievementFilter = "todas"): Promise<AchievementsResponse> => {
    const response = await apiFetch(`/aluno/conquistas?filter=${filter}`);
    if (!response.ok) {
      throw new Error(
        `API de conquistas indisponível (${response.status}). ` +
        `Configure VITE_STUDENT_DASHBOARD_DATA_SOURCE=mock para desenvolvimento ou implemente o endpoint /aluno/conquistas.`
      );
    }
    return response.json();
  },
};

const mockServiceWrapper = {
  getRanking: async (scope: RankingScope, municipality?: string, currentUserId?: string, currentUserName?: string): Promise<RankingResponse> => {
    return mockStudentDashboardService.getRanking(scope, municipality, currentUserId, currentUserName);
  },
  getAchievements: (filter: AchievementFilter = "todas") => mockStudentDashboardService.getAchievements(filter),
};

export const studentDashboardService = DATA_SOURCE === "mock" 
  ? mockServiceWrapper 
  : realService;

export default studentDashboardService;