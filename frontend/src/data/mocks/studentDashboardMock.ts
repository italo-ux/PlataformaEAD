import type {
  RankingParticipant,
  RankingResponse,
  Achievement,
  AchievementsResponse,
  RankingScope,
  AchievementFilter,
} from "../../types/studentDashboard";

const MOCK_PARTICIPANTS_BASE: Omit<RankingParticipant, "position" | "isCurrentUser" | "initials">[] = [
  { userId: "1", name: "Ana Silva", avatarUrl: undefined, achievementsCount: 12, completedCoursesCount: 8, certificatesCount: 3 },
  { userId: "2", name: "Bruno Costa", avatarUrl: undefined, achievementsCount: 10, completedCoursesCount: 7, certificatesCount: 2 },
  { userId: "3", name: "Carla Souza", avatarUrl: undefined, achievementsCount: 9, completedCoursesCount: 6, certificatesCount: 2 },
  { userId: "4", name: "Daniel Oliveira", avatarUrl: undefined, achievementsCount: 8, completedCoursesCount: 5, certificatesCount: 1 },
  { userId: "5", name: "Eduarda Lima", avatarUrl: undefined, achievementsCount: 7, completedCoursesCount: 5, certificatesCount: 1 },
  { userId: "6", name: "Felipe Santos", avatarUrl: undefined, achievementsCount: 6, completedCoursesCount: 4, certificatesCount: 1 },
  { userId: "7", name: "Gabriela Rocha", avatarUrl: undefined, achievementsCount: 5, completedCoursesCount: 4, certificatesCount: 0 },
  { userId: "8", name: "Henrique Alves", avatarUrl: undefined, achievementsCount: 4, completedCoursesCount: 3, certificatesCount: 0 },
  { userId: "9", name: "Isabela Martins", avatarUrl: undefined, achievementsCount: 3, completedCoursesCount: 2, certificatesCount: 0 },
  { userId: "10", name: "João Pereira", avatarUrl: undefined, achievementsCount: 2, completedCoursesCount: 2, certificatesCount: 0 },
  { userId: "11", name: "Karen Dias", avatarUrl: undefined, achievementsCount: 1, completedCoursesCount: 1, certificatesCount: 0 },
  { userId: "12", name: "Lucas Ferreira", avatarUrl: undefined, achievementsCount: 1, completedCoursesCount: 1, certificatesCount: 0 },
];

const CURRENT_USER_METRICS = {
  achievementsCount: 5,
  completedCoursesCount: 3,
  certificatesCount: 1,
};

function buildRankingData(currentUserId: string, currentUserName: string) {
  // Filtrar participante com mesmo ID antes de inserir current-user
  const filteredBase = MOCK_PARTICIPANTS_BASE.filter(p => p.userId !== currentUserId);
  
  const sortedBase = [...filteredBase].sort((a, b) =>
    b.achievementsCount - a.achievementsCount ||
    b.completedCoursesCount - a.completedCoursesCount ||
    a.name.localeCompare(b.name)
  );

  const displayName = currentUserName || "Você";
  const initials = currentUserName
    ? currentUserName.trim().split(/\s+/).map(p => p[0]).join("").slice(0, 2).toUpperCase()
    : "VC";

  const currentUser: RankingParticipant = {
    userId: currentUserId,
    name: displayName,
    initials,
    ...CURRENT_USER_METRICS,
    isCurrentUser: true,
    position: 0,
  };

  // Create base participants with proper typing
  const baseWithExtras: RankingParticipant[] = sortedBase.map(p => ({
    ...p,
    initials: p.name.trim().split(/\s+/).map(p => p[0]).join("").slice(0, 2).toUpperCase(),
    isCurrentUser: false,
    position: 0,
  }));

  const all = [...baseWithExtras, currentUser].sort((a, b) =>
    b.achievementsCount - a.achievementsCount ||
    b.completedCoursesCount - a.completedCoursesCount ||
    a.name.localeCompare(b.name)
  );

  const top10 = all.slice(0, 10).map((p, i) => ({ ...p, position: i + 1 }));
  const currentUserPos = all.findIndex(p => p.isCurrentUser) + 1;
  const distanceToTop10 = currentUserPos > 10 ? currentUserPos - 10 : undefined;

  return { top10, currentUserPosition: currentUserPos, distanceToTop10 };
}

const ALL_ACHIEVEMENTS: Achievement[] = [
  {
    id: "1",
    title: "Primeiro Passo",
    description: "Concluiu seu primeiro curso na plataforma",
    unlockCondition: "Concluir 1 curso",
    icon: "GraduationCap",
    status: "conquistada",
    acquiredAt: "2025-01-15T10:30:00Z",
  },
  {
    id: "2",
    title: "Dedicado",
    description: "Concluiu 5 cursos",
    unlockCondition: "Concluir 5 cursos",
    icon: "Award",
    status: "conquistada",
    acquiredAt: "2025-03-22T14:00:00Z",
  },
  {
    id: "3",
    title: "Maratoneta",
    description: "Acumulou 50 horas de estudo",
    unlockCondition: "Acumular 50h de estudo",
    icon: "Clock",
    status: "conquistada",
    acquiredAt: "2025-05-10T09:15:00Z",
  },
  {
    id: "4",
    title: "Certificado",
    description: "Emitiu seu primeiro certificado",
    unlockCondition: "Emitir 1 certificado",
    icon: "FileText",
    status: "conquistada",
    acquiredAt: "2025-02-28T16:45:00Z",
  },
  {
    id: "5",
    title: "Colecionador",
    description: "Conquistou 10 conquistas",
    unlockCondition: "Conquistar 10 conquistas",
    icon: "Star",
    status: "conquistada",
    acquiredAt: "2025-06-01T11:00:00Z",
  },
  {
    id: "6",
    title: "Especialista",
    description: "Concluiu 10 cursos",
    unlockCondition: "Concluir 10 cursos",
    icon: "Target",
    status: "bloqueada",
    progress: { current: 5, target: 10 },
  },
  {
    id: "7",
    title: "Mestre do Tempo",
    description: "Acumulou 100 horas de estudo",
    unlockCondition: "Acumular 100h de estudo",
    icon: "Hourglass",
    status: "bloqueada",
    progress: { current: 50, target: 100 },
  },
  {
    id: "8",
    title: "Embaixador",
    description: "Convidou 5 amigos para a plataforma",
    unlockCondition: "Convidar 5 amigos",
    icon: "Users",
    status: "bloqueada",
    progress: { current: 2, target: 5 },
  },
  {
    id: "9",
    title: "Feedback Master",
    description: "Deixou 10 avaliações de cursos",
    unlockCondition: "Deixar 10 avaliações",
    icon: "MessageSquare",
    status: "bloqueada",
    progress: { current: 3, target: 10 },
  },
  {
    id: "10",
    title: "Trilheiro",
    description: "Concluiu uma trilha completa de aprendizagem",
    unlockCondition: "Concluir 1 trilha",
    icon: "Map",
    status: "bloqueada",
  },
];

export const mockStudentDashboardService = {
  getRanking: async (
    scope: RankingScope,
    municipality?: string,
    currentUserId = "current-user",
    currentUserName = "",
  ): Promise<RankingResponse> => {
    await new Promise((r) => setTimeout(r, 500));

    const { top10, currentUserPosition, distanceToTop10 } = buildRankingData(currentUserId, currentUserName);

    return {
      scope,
      top10,
      currentUserPosition,
      distanceToTop10,
      municipality,
      municipalityRequired: scope === "municipal" && !municipality,
    };
  },

  getAchievements: async (filter: AchievementFilter = "todas"): Promise<AchievementsResponse> => {
    await new Promise((r) => setTimeout(r, 400));

    let filtered = ALL_ACHIEVEMENTS;
    if (filter === "conquistadas") filtered = ALL_ACHIEVEMENTS.filter((a) => a.status === "conquistada");
    if (filter === "bloqueadas") filtered = ALL_ACHIEVEMENTS.filter((a) => a.status === "bloqueada");

    return {
      achievements: filtered,
      stats: {
        total: ALL_ACHIEVEMENTS.length,
        conquered: ALL_ACHIEVEMENTS.filter((a) => a.status === "conquistada").length,
        locked: ALL_ACHIEVEMENTS.filter((a) => a.status === "bloqueada").length,
      },
    };
  },
};