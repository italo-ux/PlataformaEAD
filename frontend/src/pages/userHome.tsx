import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer/Footer";
import Navbar from "../components/Navbar/Navbar";
import trailService, { type Trilha } from "../services/trailService";
import journeyService, { type EnrollmentSummary } from "../services/journeyService";
import { getAuthenticatedUser } from "../services/userService";
import {
  ArrowRight,
  BookOpen,
  Sparkles,
} from "lucide-react";
import HomeIMG from "../assets/home/HomeIMG.png";

function colorWithAlpha(hexColor: string, alpha: number) {
  const normalized = hexColor.replace("#", "");
  const value = Number.parseInt(normalized, 16);

  if (normalized.length !== 6 || Number.isNaN(value)) {
    return `rgba(68, 124, 252, ${alpha})`;
  }

  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export default function UserHome() {
  const navigate = useNavigate();
  const user = getAuthenticatedUser();
  const [trails, setTrails] = useState<Trilha[]>([]);
  const [loadingTrails, setLoadingTrails] = useState(true);
  const [trailError, setTrailError] = useState("");
  const [startedCourses, setStartedCourses] = useState<EnrollmentSummary[]>([]);
  const [loadingStartedCourses, setLoadingStartedCourses] = useState(
    user?.role === "aluno",
  );

  useEffect(() => {
    if (user?.role !== "aluno") {
      return;
    }

    let cancelled = false;
    journeyService
      .listEnrollments()
      .then((enrollments) => {
        if (!cancelled) {
          setStartedCourses(enrollments.filter((item) => !item.conclusao));
        }
      })
      .catch(() => {
        if (!cancelled) setStartedCourses([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingStartedCourses(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.role]);

  useEffect(() => {
    let cancelled = false;
    trailService
      .listTrails()
      .then((data) => {
        if (!cancelled) setTrails(data);
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setTrailError(
            reason instanceof Error
              ? reason.message
              : "Não foi possível carregar as trilhas.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingTrails(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleStartCourse = () => {
    const current = startedCourses[0];
    navigate(current ? `/courses/${current.curso.id}` : "/courses");
  };

  const handleOpenCourse = (courseId: string) => {
    navigate(`/courses/${courseId}`);
  };

  const handleOpenTrail = (trailId: string) => {
    navigate(`/trilhas/${trailId}`);
  };

  const scrollToTrails = () => {
    document.getElementById("trilhas")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#263452]">
      <Navbar user={user} />

      <main className="overflow-hidden">
        <section className="relative bg-[#f8fafc]">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:py-20">
            <div className="relative z-10 max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-blue-600">
                <Sparkles size={16} />
                Plataforma EAD Inovação Barueri
              </div>
              <h1 className="text-4xl font-bold leading-[1.15] tracking-[-0.02em] text-[#263452] sm:text-5xl">
                Aprenda tecnologia com trilhas práticas!
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
                Continue seus cursos, acompanhe seu progresso e desenvolva
                habilidades para criar projetos digitais, jogos, interfaces e
                experiências imersivas.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={handleStartCourse}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-6 py-3 font-medium text-white shadow-sm transition hover:bg-blue-700"
                >
                  Continuar aprendendo
                  <ArrowRight size={20} />
                </button>
                <button
                  onClick={scrollToTrails}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-blue-200 bg-white px-6 py-3 font-medium text-blue-700 transition hover:border-blue-300 hover:bg-blue-50"
                >
                  Ver trilhas
                  <BookOpen size={20} />
                </button>
              </div>
            </div>

            <div className="relative">
              <div>
                <div>
                  <img
                    src={HomeIMG}
                    alt="Estudantes explorando tecnologia em aula"
                    className="aspect-[4/3] h-auto min-h-[280px] w-full object-cover opacity-90 sm:aspect-[16/12] lg:aspect-[5/4]"
                  />
                </div>
                
              </div>
            </div>
          </div>
        </section>

        {/* TEMPORARY VISUAL BLOCK: blue "Meus cursos" area. */}
        <div
          data-temporary-style="home-content-blue-inversion"
          className="bg-[#447cfc] text-white"
        >
          <section
            id="cursos"
            className="mx-auto max-w-7xl scroll-mt-24 px-4 py-14 sm:px-6 lg:px-8"
          >
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-blue-100">
                Meus cursos
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.01em] text-white">
                Continue de onde parou
              </h2>
            </div>
            <button
              onClick={() => navigate("/courses")}
              className="inline-flex items-center gap-2 font-medium text-white transition hover:text-blue-100"
            >
              Ver todos
              <ArrowRight size={18} />
            </button>
          </div>

          {loadingStartedCourses ? (
            <p className="text-sm text-blue-50">Carregando cursos iniciados...</p>
          ) : startedCourses.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
              {startedCourses.map((enrollment) => {
              const course = enrollment.curso;
              return (
                <article
                  key={course.id}
                  onClick={() => handleOpenCourse(course.id)}
                  className="group cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-200 hover:shadow-md"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      handleOpenCourse(course.id);
                    }
                  }}
                >
                  <div className="relative h-44 overflow-hidden bg-slate-200">
                    {course.url_foto ? (
                      <img
                        src={course.url_foto}
                        alt={course.nome}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-blue-600">
                        <BookOpen size={40} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-950/5 to-transparent" />
                    <div className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-lg bg-white/95 text-blue-600 shadow-sm">
                      <BookOpen size={20} />
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="mb-2 flex items-center justify-between text-xs font-medium text-white">
                        <span>{enrollment.progresso}% concluído</span>
                        <span>{enrollment.aulas_concluidas}/{enrollment.total_aulas} aulas</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/30">
                        <div
                          className="h-full rounded-full bg-white"
                          style={{ width: `${enrollment.progresso}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="line-clamp-2 text-lg font-semibold text-[#263452] transition group-hover:text-blue-700">
                      {course.nome}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                      {course.descricao ?? "Sem descrição disponível."}
                    </p>
                    <div className="mt-5 flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold text-slate-500">
                        Categoria:
                        <span className="text-slate-700">
                          {course.categoria ?? "Não informada"}
                        </span>
                      </p>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition group-hover:bg-blue-100">
                        <ArrowRight size={16} />
                      </div>
                    </div>
                  </div>
                </article>
              );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
              <p className="font-medium text-[#263452]">
                Nenhum curso em andamento
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Inicie um curso pelo catálogo para ele aparecer aqui.
              </p>
              <button
                type="button"
                onClick={() => navigate("/courses")}
                className="mt-5 inline-flex items-center gap-2 font-medium text-blue-700 transition hover:text-blue-900"
              >
                Ver cursos
                <ArrowRight size={18} />
              </button>
            </div>
          )}
          </section>
        </div>
        {/* END TEMPORARY VISUAL BLOCK: blue "Meus cursos" area. */}

        <section
          id="trilhas"
          className="mx-auto max-w-7xl scroll-mt-24 px-4 py-14 sm:px-6 lg:px-8"
        >
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-blue-600">
                Trilhas de aprendizagem
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.01em] text-[#263452]">
                Escolha uma trilha para seguir
              </h2>
              <p className="mt-3 max-w-2xl leading-7 text-slate-600">
                Cada trilha agrupa cursos relacionados, seguindo o modelo de
                trilhas e cursos do banco de dados.
              </p>
            </div>
            <button
              onClick={() => navigate("/courses")}
              className="inline-flex items-center gap-2 font-medium text-blue-700 transition hover:text-blue-900"
            >
              Ver cursos
              <ArrowRight size={18} />
            </button>
          </div>

          {loadingTrails ? (
            <p className="text-sm text-slate-600">Carregando trilhas...</p>
          ) : trailError ? (
            <div className="rounded-xl bg-red-50 px-5 py-4 font-semibold text-red-700">
              {trailError}
            </div>
          ) : trails.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
              <p className="font-medium text-[#263452]">Nenhuma trilha cadastrada</p>
              <p className="mt-2 text-sm text-slate-500">
                Um administrador pode criar a primeira trilha pelo perfil.
              </p>
            </div>
          ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {trails.map((trail, index) => {
              const accentColor = ["#447cfc", "#7c3aed", "#0891b2", "#059669"][index % 4];
              const accentBorder = colorWithAlpha(accentColor, 0.25);

              return (
                <article
                  key={trail.id}
                  onClick={() => handleOpenTrail(trail.id)}
                  className="group cursor-pointer overflow-hidden rounded-xl border bg-white shadow-sm transition hover:shadow-md"
                  style={{ borderColor: accentBorder }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      handleOpenTrail(trail.id);
                    }
                  }}
                >
                  <div
                    className="h-1"
                    style={{ backgroundColor: accentColor }}
                  />
                  <div className="relative h-36 overflow-hidden bg-slate-200">
                    {trail.capa ? (
                      <img
                        src={trail.capa}
                        alt={trail.nome}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-blue-600">
                        <BookOpen size={42} />
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-[#263452] transition group-hover:text-blue-700">
                      {trail.nome}
                    </h3>

                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                      {trail.descricao ?? "Trilha de aprendizagem."}
                    </p>
                    <p className="mt-5 text-xs font-medium text-slate-500">
                      {trail.cursos.length} {trail.cursos.length === 1 ? "curso" : "cursos"}
                      {trail.nivel ? ` • ${trail.nivel}` : ""}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
          )}
        </section>

      </main>

      <Footer />
    </div>
  );
}
