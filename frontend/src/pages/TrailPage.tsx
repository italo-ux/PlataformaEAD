import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  BookmarkCheck,
  BookmarkPlus,
  Clock3,
  Layers3,
  Search,
} from "lucide-react";
import Footer from "../components/Footer/Footer";
import Navbar from "../components/Navbar/Navbar";
import journeyService from "../services/journeyService";
import trailService, { type Trilha } from "../services/trailService";
import { getAuthenticatedUser } from "../services/userService";

type CourseSort = "name" | "category" | "level";

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function TrailPage() {
  const { trailId } = useParams();
  const navigate = useNavigate();
  const user = getAuthenticatedUser();
  const [trail, setTrail] = useState<Trilha | null>(null);
  const [loading, setLoading] = useState(Boolean(trailId));
  const [error, setError] = useState(trailId ? "" : "Trilha inválida.");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<CourseSort>("name");
  const [startedCourseIds, setStartedCourseIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followError, setFollowError] = useState("");

  useEffect(() => {
    if (!trailId) {
      return;
    }
    let cancelled = false;
    trailService
      .getTrail(trailId)
      .then((data) => {
        if (!cancelled) setTrail(data);
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Não foi possível carregar a trilha.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [trailId]);

  useEffect(() => {
    if (user?.role !== "aluno") return;
    let cancelled = false;
    journeyService
      .listEnrollments()
      .then((items) => {
        if (!cancelled) {
          setStartedCourseIds(
            new Set(
              items
                .filter((item) => !item.conclusao)
                .map((item) => item.curso.id),
            ),
          );
        }
      })
      .catch(() => {
        if (!cancelled) setStartedCourseIds(new Set());
      });
    return () => {
      cancelled = true;
    };
  }, [user?.role]);
  useEffect(() => {
    if (!trailId || user?.role !== "aluno") return;
    let cancelled = false;
    trailService
      .getFollowStatus(trailId)
      .then(({ seguindo }) => {
        if (!cancelled) setFollowing(seguindo);
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setFollowError(
            reason instanceof Error
              ? reason.message
              : "Não foi possível consultar esta trilha.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [trailId, user?.role]);

  const toggleFollowing = async () => {
    if (!trailId || followLoading) return;
    setFollowLoading(true);
    setFollowError("");
    try {
      if (following) {
        await trailService.unfollowTrail(trailId);
        setFollowing(false);
      } else {
        await trailService.followTrail(trailId);
        setFollowing(true);
      }
      window.dispatchEvent(new Event("ead.trails.changed"));
    } catch (reason: unknown) {
      setFollowError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível atualizar a trilha.",
      );
    } finally {
      setFollowLoading(false);
    }
  };

  const courses = useMemo(() => {
    const normalizedSearch = normalize(search.trim());
    return [...(trail?.cursos ?? [])]
      .filter((course) =>
        normalize(
          `${course.nome} ${course.descricao ?? ""} ${course.categoria ?? ""} ${course.nivel ?? ""}`,
        ).includes(normalizedSearch),
      )
      .sort((a, b) => {
        if (sort === "category") {
          return (a.categoria ?? "").localeCompare(b.categoria ?? "", "pt-BR");
        }
        if (sort === "level") {
          return (a.nivel ?? "").localeCompare(b.nivel ?? "", "pt-BR");
        }
        return a.nome.localeCompare(b.nome, "pt-BR");
      });
  }, [search, sort, trail]);

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-slate-950">
      <Navbar user={user} />
      <main>
        {loading ? (
          <div className="mx-auto max-w-7xl px-4 py-20 text-center text-slate-600">
            Carregando trilha...
          </div>
        ) : error || !trail ? (
          <div className="mx-auto grid min-h-[60vh] max-w-4xl place-items-center px-4 py-20 text-center">
            <div className="rounded-xl border border-blue-100 bg-white p-8 shadow-sm">
              <Layers3 className="mx-auto text-blue-600" size={36} />
              <h1 className="mt-5 text-3xl font-black text-[#25304a]">
                Trilha não encontrada
              </h1>
              <p className="mt-3 text-slate-600">{error}</p>
              <button
                type="button"
                onClick={() => navigate("/home")}
                className="mt-6 inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-3 font-bold text-white"
              >
                <ArrowLeft size={18} /> Voltar para home
              </button>
            </div>
          </div>
        ) : (
          <>
            <section
              className="text-white"
              style={{ backgroundColor: trail.cor_fundo || "#3f5fd8" }}
            >
              <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 md:grid-cols-[1fr_280px] md:items-center lg:px-8">
                <div>
                  <button
                    type="button"
                    onClick={() => navigate("/home")}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-blue-100 hover:text-white"
                  >
                    <ArrowLeft size={16} /> Voltar para home
                  </button>
                  <div className="mt-6 flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/50 bg-white/10">
                      <Layers3 size={30} />
                    </div>
                    <div>
                      <p className="text-sm font-bold uppercase tracking-wide text-blue-100">
                        Trilha de aprendizagem
                      </p>
                      <h1 className="mt-1 text-3xl font-black">{trail.nome}</h1>
                    </div>
                  </div>
                  <p className="mt-5 max-w-3xl leading-7 text-blue-50">
                    {trail.descricao ?? "Explore os cursos desta trilha."}
                  </p>
                  <p className="mt-4 text-sm font-bold text-blue-100">
                    {trail.cursos.length}{" "}
                    {trail.cursos.length === 1 ? "curso" : "cursos"}
                    {trail.nivel ? ` • ${trail.nivel}` : ""}
                  </p>
                  {user?.role === "aluno" && (
                    <div className="mt-6">
                      <button
                        type="button"
                        onClick={toggleFollowing}
                        disabled={followLoading}
                        aria-pressed={following}
                        className={
                          "inline-flex h-11 items-center gap-2 rounded-lg border px-5 text-sm font-black transition disabled:cursor-wait disabled:opacity-60 " +
                          (following
                            ? "border-white bg-white text-blue-700 hover:bg-blue-50"
                            : "border-white/60 bg-white/10 text-white hover:bg-white/20")
                        }
                      >
                        {following ? (
                          <BookmarkCheck size={19} />
                        ) : (
                          <BookmarkPlus size={19} />
                        )}
                        {followLoading
                          ? "Atualizando..."
                          : following
                            ? "Trilha seguida"
                            : "Seguir trilha"}
                      </button>
                      {followError && (
                        <p className="mt-2 text-sm font-semibold text-amber-200">
                          {followError}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                {trail.capa && (
                  <img
                    src={trail.capa}
                    alt={trail.nome}
                    className="h-44 w-full rounded-xl object-cover shadow-xl"
                  />
                )}
              </div>
            </section>

            <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
              <div className="mb-7 grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_220px]">
                <label className="relative block">
                  <span className="mb-1 block text-xs font-bold text-slate-600">
                    Buscar
                  </span>
                  <Search
                    className="absolute bottom-[13px] left-3 text-slate-400"
                    size={18}
                  />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar cursos na trilha"
                    className="h-11 w-full rounded-md border border-slate-200 pl-10 pr-3"
                  />
                </label>
                <label className="grid gap-1 text-xs font-bold text-slate-600">
                  Ordenar
                  <select
                    value={sort}
                    onChange={(event) =>
                      setSort(event.target.value as CourseSort)
                    }
                    className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm"
                  >
                    <option value="name">Nome</option>
                    <option value="category">Categoria</option>
                    <option value="level">Nível</option>
                  </select>
                </label>
              </div>

              {courses.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                  <BookOpen className="mx-auto text-slate-400" size={40} />
                  <p className="mt-3 font-bold text-[#25304a]">
                    {trail.cursos.length === 0
                      ? "Nenhum curso vinculado a esta trilha"
                      : "Nenhum curso encontrado"}
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {courses.map((course) => (
                    <article
                      key={course.id}
                      onClick={() => navigate(`/courses/${course.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ")
                          navigate(`/courses/${course.id}`);
                      }}
                      role="button"
                      tabIndex={0}
                      className="group cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                    >
                      <div className="h-40 bg-slate-100">
                        {course.url_foto ? (
                          <img
                            src={course.url_foto}
                            alt={course.nome}
                            className="h-full w-full object-cover transition group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-blue-600">
                            <BookOpen size={42} />
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <div className="flex flex-wrap gap-2 text-xs font-bold">
                          {course.categoria && (
                            <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700">
                              {course.categoria}
                            </span>
                          )}
                          {startedCourseIds.has(course.id) && (
                            <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">
                              Em andamento
                            </span>
                          )}
                        </div>
                        <h2 className="mt-3 text-lg font-black text-[#25304a]">
                          {course.nome}
                        </h2>
                        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                          {course.descricao ?? "Sem descrição disponível."}
                        </p>
                        <div className="mt-4 flex items-center justify-between text-xs font-semibold text-slate-500">
                          <span>{course.nivel ?? "Nível não informado"}</span>
                          <span className="inline-flex items-center gap-1">
                            <Clock3 size={14} />
                            {course.carga_horaria === null
                              ? "--"
                              : `${course.carga_horaria}h`}
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
