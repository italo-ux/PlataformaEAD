export type RankingScope = "nacional" | "municipal";
export type AchievementFilter = "todas" | "conquistadas" | "bloqueadas";
export type AchievementStatus = "conquistada" | "bloqueada";

export interface RankingParticipant {
  position: number;
  userId: string;
  name: string;
  avatarUrl?: string;
  initials: string;
  achievementsCount: number;
  completedCoursesCount: number;
  trophies?: number;
  isCurrentUser: boolean;
}

export interface RankingResponse {
  scope: RankingScope;
  top10: RankingParticipant[];
  currentUserPosition?: number;
  distanceToTop10?: number;
  municipality?: string;
  municipalityRequired?: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlockCondition: string;
  icon: string;
  status: AchievementStatus;
  acquiredAt?: string;
  progress?: {
    current: number;
    target: number;
  };
}

export interface AchievementsResponse {
  achievements: Achievement[];
  stats: { total: number; conquered: number; locked: number };
}

export class StudentDashboardApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}