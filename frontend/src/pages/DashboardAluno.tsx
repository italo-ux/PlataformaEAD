import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Footer from "../components/Footer/Footer";
import Navbar from "../components/Navbar/Navbar";
import {
  formatCourseInstructorNames,
  mockCourses,
  type Course,
} from "../data/courseData";
import { getAuthenticatedUser } from "../services/userService";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  Clock3,
  Download,
  Gamepad2,
  GraduationCap,
  MapPin,
  Medal,
  Sparkles,
  Trophy,
  type LucideIcon,
} from "lucide-react";

const courseIcons: Record<number, LucideIcon> = {
  1: Gamepad2,
  2: BookOpen,
  3: Sparkles,
  4: GraduationCap,
};

const navTabs = [
  { id: "cursos", label: "Meus Cursos" },
  { id: "conquistas", label: "Conquistas" },
  { id: "ranking", label: "Ranking" },
  { id: "certificados", label: "Certificados" },
] as const;

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function parseDurationToMinutes(duration: string) {
  const [minutesText, secondsText] = duration.split(":");
  const minutes = Number(minutesText);
  const seconds = Number(secondsText);

  if (Number.isNaN(minutes) || Number.isNaN(seconds)) {
    return 0;
  }

  return minutes + Math.round(seconds / 60);
}

function formatStudyTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }

  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

function getCompletedStudyMinutes(courses: Course[]) {
  return courses.reduce(
    (total, course) =>
      total +
      course.lessons
        .filter((lesson) => lesson.completed)
        .reduce(
          (lessonTotal, lesson) =>
            lessonTotal + parseDurationToMinutes(lesson.duration),
          0,
        ),
    0,
  );
}

export default function DashboardAluno() {
  const navigate = useNavigate();
  const user = getAuthenticatedUser();
  const [activeTab, setActiveTab] =
    useState<(typeof navTabs)[number]["id"]>("cursos");

  const dashboardData = useMemo(() => {
    const openCourses = mockCourses.filter(
      (course) => course.progress > 0 && course.progress < 100,
    );
    const completedCourses = mockCourses.filter(
      (course) => course.progress >= 100,
    );
    const completedLessons = mockCourses.reduce(
      (total, course) => total + course.completedLessons,
      0,
    );
    const totalLessons = mockCourses.reduce(
      (total, course) => total + course.totalLessons,
      0,
    );
    const studyMinutes = getCompletedStudyMinutes(mockCourses);
    const xp = completedLessons * 120 + completedCourses.length * 600;
    const level = Math.max(1, Math.floor(xp / 1000) + 1);
    const levelStart = (level - 1) * 1000;
    const nextLevelXp = level * 1000;
    const currentLevelXp = xp - levelStart;
    const levelProgress = Math.min(
      100,
      Math.round((currentLevelXp / (nextLevelXp - levelStart)) * 100),
    );
    const nextCourse = openCourses[0] ?? mockCourses[0];
    const nextLesson =
      nextCourse.lessons.find((lesson) => !lesson.completed) ??
      nextCourse.lessons[0];
    const municipalRank = Math.max(
      1,
      50 - completedLessons - completedCourses.length * 5,
    );

    return {
      completedCourses,
      completedLessons,
      currentLevelXp,
      level,
      levelProgress,
      municipalRank,
      nextCourse,
      nextLesson,
      nextLevelXp: nextLevelXp - levelStart,
      openCourses,
      studyTimeText: formatStudyTime(studyMinutes),
      totalLessons,
    };
  }, []);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const quickStats = [
    {
      label: "Cursos ativos",
      value: String(dashboardData.openCourses.length),
      icon: BookOpen,
    },
    {
      label: "Aulas concluídas",
      value: `${dashboardData.completedLessons}/${dashboardData.totalLessons}`,
      icon: CheckCircle2,
    },
    {
      label: "Tempo de estudo",
      value: dashboardData.studyTimeText,
      icon: Clock3,
    },
    {
      label: "Certificados",
      value: String(dashboardData.completedCourses.length),
      icon: Trophy,
    },
  ];

  const achievements = [
    {
      title: "Primeiro curso concluído",
      detail:
        dashboardData.completedCourses.length > 0
          ? "Você concluiu seu primeiro curso na plataforma."
          : "Conclua um curso para desbloquear esta conquista.",
      icon: Medal,
      unlocked: dashboardData.completedCourses.length > 0,
    },
    {
      title: "10 aulas concluídas",
      detail: `${Math.min(
        dashboardData.completedLessons,
        10,
      )}/10 aulas concluídas na sua jornada.`,
      icon: Award,
      unlocked: dashboardData.completedLessons >= 10,
    },
    {
      title: "3 cursos em andamento",
      detail: `${Math.min(
        dashboardData.openCourses.length,
        3,
      )}/3 cursos ativos com progresso iniciado.`,
      icon: BadgeCheck,
      unlocked: dashboardData.openCourses.length >= 3,
    },
  ];

  const rankingCards = [
    {
      label: "Ranking municipal",
      value: `#${dashboardData.municipalRank}`,
      detail:
        "Posição calculada pelo progresso, aulas concluídas e certificados.",
      accent: "bg-emerald-50 text-emerald-700",
      icon: MapPin,
    },
    {
      label: "Ranking geral",
      value: `#${dashboardData.municipalRank * 4}`,
      detail:
        "Classificação geral da plataforma considerando sua evolução nos cursos.",
      accent: "bg-violet-50 text-violet-700",
      icon: Trophy,
    },
  ];

  const handleStartCourse = (courseId: number) => {
    navigate(`/courses/${courseId}`);
  };

  return (
    <div className="min-h-screen bg-[#f6f9ff] text-slate-950">
      <Navbar user={user} />

      <section className="border-b border-blue-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8">
            <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
              Painel do aluno
            </p>
            <h1 className="mt-2 text-4xl font-black text-[#25304a] sm:text-5xl">
              Meu Dashboard
            </h1>
            <p className="mt-3 max-w-2xl text-lg leading-8 text-slate-600">
              Acompanhe seu progresso, conquistas e certificados em um só lugar.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-[#25304a] p-6 shadow-xl shadow-blue-900/15 sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-center">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white/60 bg-white/15 text-3xl font-black text-white shadow-lg shadow-blue-900/40">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={`${user.name} avatar`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{getInitials(user.name)}</span>
                  )}
                </div>

                <div>
                  <h2 className="text-3xl font-black text-white sm:text-4xl">
                    {user.name}
                  </h2>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white">
                      Nível {dashboardData.level}
                    </span>
                    <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white">
                      {dashboardData.currentLevelXp} XP
                    </span>
                    <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white">
                      #{dashboardData.municipalRank} Municipal
                    </span>
                  </div>

                  <div className="mt-5 flex items-center gap-2 text-blue-100">
                    <MapPin size={18} />
                    <span>Barueri - SP</span>
                  </div>
                  <p className="mt-4 max-w-xl leading-7 text-blue-100">
                    Continue estudando para subir de nível, desbloquear
                    conquistas e avançar no ranking.
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-4 text-lg font-semibold text-white">
                  Progresso para o próximo nível
                </p>
                <div className="h-4 overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-white transition-all"
                    style={{ width: `${dashboardData.levelProgress}%` }}
                  />
                </div>

                <div className="mt-3 flex justify-between text-sm font-semibold text-white">
                  <span>{dashboardData.currentLevelXp} XP</span>
                  <span>{dashboardData.nextLevelXp} XP</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleStartCourse(dashboardData.nextCourse.id)}
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-50"
                >
                  Continuar: {dashboardData.nextLesson.title}
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto flex w-full max-w-7xl flex-col px-4 py-12 sm:px-6 lg:px-8">
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {quickStats.map((stat) => {
            const Icon = stat.icon;

            return (
              <article
                key={stat.label}
                className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-900/10"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-500">{stat.label}</p>
                    <p className="mt-2 text-2xl font-black text-[#25304a]">
                      {stat.value}
                    </p>
                  </div>
                  <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                    <Icon size={18} />
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section className="mt-8 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm xl:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
                Navegação
              </p>
              <h2 className="mt-2 text-xl font-black text-[#25304a] sm:text-2xl">
                Blocos da sua jornada acadêmica
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Use as abas para alternar entre progresso, conquistas, ranking
                e certificados.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {navTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  aria-pressed={activeTab === tab.id}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                      : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm xl:p-6">
          <div className="min-h-[220px]">
            {activeTab === "cursos" && (
              <div id="cursos" className="scroll-mt-24">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
                      Cursos abertos
                    </p>
                    <h3 className="mt-2 text-xl font-black text-[#25304a]">
                      Continue de onde parou
                    </h3>
                    <p className="mt-2 text-sm text-slate-600">
                      Abaixo estão apenas os cursos em andamento.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/home#cursos")}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900"
                  >
                    Ver catálogo
                    <ArrowRight size={15} />
                  </button>
                </div>

                {dashboardData.openCourses.length > 0 ? (
                  <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {dashboardData.openCourses.map((course) => {
                      const Icon = courseIcons[course.id] ?? BookOpen;

                      return (
                        <article
                          key={course.id}
                          onClick={() => handleStartCourse(course.id)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              handleStartCourse(course.id);
                            }
                          }}
                          className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/10"
                          role="button"
                          tabIndex={0}
                        >
                          <div className="relative h-40 overflow-hidden bg-slate-200">
                            <img
                              src={course.image}
                              alt={course.title}
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-transparent" />
                            <div className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/95 text-blue-600 shadow">
                              <Icon size={18} />
                            </div>
                            <div className="absolute bottom-4 left-4 right-4">
                              <div className="mb-2 flex items-center justify-between text-xs font-bold text-white">
                                <span>{course.progress}% concluído</span>
                                <span>{course.totalLessons} aulas</span>
                              </div>
                              <div className="h-2 rounded-full bg-white/30">
                                <div
                                  className="h-full rounded-full bg-white"
                                  style={{ width: `${course.progress}%` }}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="p-5">
                            <h4 className="line-clamp-2 text-lg font-black text-[#25304a]">
                              {course.title}
                            </h4>
                            <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                              {course.description}
                            </p>
                            <div className="mt-5 flex items-center justify-between gap-3 text-xs text-slate-500">
                              <span>
                                {course.instructors &&
                                course.instructors.length > 1
                                  ? "Professores: "
                                  : "Professor: "}
                                {formatCourseInstructorNames(course)}
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-3 py-2 text-xs font-semibold text-white">
                                Continuar
                                <ArrowRight size={12} />
                              </span>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-6 rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center">
                    <p className="font-bold text-[#25304a]">
                      Nenhum curso em andamento
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      Inicie um curso pelo catálogo para acompanhar o progresso
                      aqui.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "conquistas" && (
              <div className="p-1">
                <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
                  Conquistas
                </p>
                <h3 className="mt-2 text-xl font-black text-[#25304a]">
                  Marcos da sua evolução
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  As conquistas são desbloqueadas conforme seu progresso real
                  nos cursos.
                </p>
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  {achievements.map((item) => {
                    const Icon = item.icon;

                    return (
                      <article
                        key={item.title}
                        className={`rounded-2xl border p-5 shadow-sm ${
                          item.unlocked
                            ? "border-amber-200 bg-amber-50/40"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`rounded-xl p-3 ${
                              item.unlocked
                                ? "bg-amber-100 text-amber-700"
                                : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            <Icon size={18} />
                          </div>
                          <h4 className="text-base font-black text-slate-900">
                            {item.title}
                          </h4>
                        </div>
                        <p className="mt-3 text-sm text-slate-600">
                          {item.detail}
                        </p>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === "ranking" && (
              <div className="p-1">
                <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
                  Ranking
                </p>
                <h3 className="mt-2 text-xl font-black text-[#25304a]">
                  Classificação por desempenho
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  A posição considera cursos iniciados, aulas concluídas e
                  certificados liberados.
                </p>
                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  {rankingCards.map((item) => {
                    const Icon = item.icon;

                    return (
                      <article
                        key={item.label}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-500">
                              {item.label}
                            </p>
                            <p className="mt-3 text-4xl font-black text-[#25304a]">
                              {item.value}
                            </p>
                          </div>
                          <div className={`rounded-xl p-3 ${item.accent}`}>
                            <Icon size={18} />
                          </div>
                        </div>
                        <p className="mt-4 text-sm text-slate-600">
                          {item.detail}
                        </p>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === "certificados" && (
              <div className="p-1">
                <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
                  Certificados
                </p>
                <h3 className="mt-2 text-xl font-black text-[#25304a]">
                  Cursos concluídos
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Certificados aparecem apenas quando o curso chega a 100% de
                  conclusão.
                </p>

                {dashboardData.completedCourses.length > 0 ? (
                  <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {dashboardData.completedCourses.map((course) => (
                      <article
                        key={course.id}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500">
                              Certificado disponível
                            </p>
                            <h4 className="mt-2 text-lg font-black text-slate-900">
                              {course.title}
                            </h4>
                          </div>
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                            100%
                          </span>
                        </div>
                        <p className="mt-3 text-sm text-slate-600">
                          Carga horária: {course.totalLessons * 2}h | Status:
                          validado
                        </p>
                        <button className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700">
                          <Download size={14} />
                          Baixar PDF
                        </button>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center">
                    <p className="font-bold text-[#25304a]">
                      Nenhum certificado disponível
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      Conclua 100% de um curso para liberar o certificado.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
