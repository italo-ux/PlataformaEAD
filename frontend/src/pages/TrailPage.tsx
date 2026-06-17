import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Footer from "../components/Footer/Footer";
import Navbar from "../components/Navbar/Navbar";
import {
  formatCourseInstructorNames,
  type Course,
  getMockTrailBySlug,
} from "../data/courseData";
import { getAuthenticatedUser } from "../services/userService";
import {
  ArrowLeft,
  BookOpen,
  Clock3,
  Code2,
  Gamepad2,
  Globe2,
  GraduationCap,
  Landmark,
  Layers3,
  Palette,
  SlidersHorizontal,
  Star,
  UserRound,
  Venus,
  type LucideIcon,
} from "lucide-react";

const trailIcons: Record<string, LucideIcon> = {
  "projeto-inova-inclusao-digital": Globe2,
  "escola-de-games": Gamepad2,
  "projeto-inova-elas-empreendedorismo": Venus,
  "talentos-estagiarios-prefeitura": UserRound,
  techgov: Landmark,
  "expansao-ead-secretarias": Globe2,
};

const courseIcons: Record<number, LucideIcon> = {
  1: Gamepad2,
  2: Code2,
  3: Palette,
  4: GraduationCap,
};

type CourseFilter = "all" | "in-progress" | "not-started" | "completed";
type CourseSort = "recommended" | "progress-desc" | "progress-asc" | "title";

const filterOptions: { label: string; value: CourseFilter }[] = [
  { label: "Todos", value: "all" },
  { label: "Em andamento", value: "in-progress" },
  { label: "Nao iniciados", value: "not-started" },
  { label: "Concluidos", value: "completed" },
];

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function matchesCourseFilter(course: Course, filter: CourseFilter) {
  if (filter === "completed") {
    return course.progress >= 100;
  }

  if (filter === "in-progress") {
    return course.progress > 0 && course.progress < 100;
  }

  if (filter === "not-started") {
    return course.progress === 0;
  }

  return true;
}

function CourseTrailCard({
  course,
  accentColor,
  onOpenCourse,
}: {
  course: Course;
  accentColor: string;
  onOpenCourse: (courseId: number) => void;
}) {
  const Icon = courseIcons[course.id] ?? BookOpen;

  return (
    <article
      onClick={() => onOpenCourse(course.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          onOpenCourse(course.id);
        }
      }}
      className="group cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
      role="button"
      tabIndex={0}
    >
      <div className="relative h-36 overflow-hidden bg-slate-200">
        <img
          src={course.image}
          alt={course.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg bg-white/95 shadow-sm">
          <Icon size={18} style={{ color: accentColor }} />
        </div>
      </div>

      <div className="p-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-blue-600">
          {course.title.includes("Game") ? "Tecnologia" : "Software"}
        </p>
        <h3 className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm font-black leading-5 text-[#25304a]">
          {course.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
          {course.description}
        </p>

        <div className="mt-4 flex items-center justify-between gap-3 text-[11px] font-semibold text-slate-500">
          <span className="inline-flex items-center gap-1 text-amber-500">
            <Star size={13} className="fill-amber-400" />
            {Math.max(1, Math.round(course.progress / 20))}.0
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock3 size={13} />
            {course.totalLessons} aulas
          </span>
        </div>
      </div>
    </article>
  );
}

export default function TrailPage() {
  const { trailSlug } = useParams();
  const navigate = useNavigate();
  const user = getAuthenticatedUser();
  const trail = useMemo(
    () => (trailSlug ? getMockTrailBySlug(trailSlug) : null),
    [trailSlug],
  );
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState<CourseFilter>("all");
  const [courseSort, setCourseSort] = useState<CourseSort>("recommended");
  const filteredCourses = useMemo(() => {
    const trailCourses = trail?.courses ?? [];
    const normalizedSearch = normalizeSearchText(searchTerm.trim());

    return [...trailCourses]
      .filter((course) => {
        const searchableContent = normalizeSearchText(
          `${course.title} ${course.description} ${formatCourseInstructorNames(
            course,
          )}`,
        );

        return (
          matchesCourseFilter(course, courseFilter) &&
          (!normalizedSearch || searchableContent.includes(normalizedSearch))
        );
      })
      .sort((currentCourse, nextCourse) => {
        if (courseSort === "progress-desc") {
          return nextCourse.progress - currentCourse.progress;
        }

        if (courseSort === "progress-asc") {
          return currentCourse.progress - nextCourse.progress;
        }

        if (courseSort === "title") {
          return currentCourse.title.localeCompare(nextCourse.title, "pt-BR");
        }

        return 0;
      });
  }, [courseFilter, courseSort, searchTerm, trail]);

  if (!trail) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] text-slate-950">
        <Navbar user={user} />
        <main className="mx-auto grid min-h-[60vh] max-w-4xl place-items-center px-4 py-20 text-center sm:px-6 lg:px-8">
          <div className="rounded-lg border border-blue-100 bg-white p-8 shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Layers3 size={28} />
            </div>
            <h1 className="mt-6 text-3xl font-black text-[#25304a]">
              Trilha nao encontrada
            </h1>
            <p className="mt-3 leading-7 text-slate-600">
              Essa trilha não existe na lista mockada atual.
            </p>
            <button
              type="button"
              onClick={() => navigate("/home")}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700"
            >
              <ArrowLeft size={18} />
              Voltar para home
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const TrailIcon = trailIcons[trail.slug] ?? Layers3;
  const foundCoursesText = `${filteredCourses.length} ${
    filteredCourses.length === 1 ? "curso encontrado" : "cursos encontrados"
  }`;

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-slate-950">
      <Navbar user={user} />

      <main>
        <section
          className="text-white"
          style={{ backgroundColor: trail.accentColor }}
        >
          <div className="mx-auto flex max-w-7xl items-center gap-5 px-4 py-7 sm:px-6 lg:px-8">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border-2 border-white/80 text-white">
              <TrailIcon size={34} strokeWidth={2.1} />
            </div>
            <h1 className="max-w-3xl text-2xl font-black leading-tight sm:text-3xl">
              {trail.nome}
            </h1>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate("/home")}
            className="flex w-fit items-center gap-2 text-xs font-medium text-gray-700 transition hover:text-blue-600"
          >
            <ArrowLeft size={14} />
            Voltar para home
          </button>
          <div className="mb-6 flex items-center justify-between gap-4">
            <p className="text-sm font-bold text-slate-700">
              {foundCoursesText}
            </p>

            <button
              type="button"
              onClick={() => setIsFilterOpen((current) => !current)}
              className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm font-bold text-slate-700 transition hover:bg-white"
              aria-expanded={isFilterOpen}
              aria-controls="trail-course-filters"
              aria-label="Filtrar cursos"
            >
              Filtrar
              <SlidersHorizontal size={22} strokeWidth={2.4} />
            </button>
          </div>

          {isFilterOpen && (
            <div
              id="trail-course-filters"
              className="mb-6 grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[1fr_auto_auto]"
            >
              <label className="grid gap-2 text-sm font-bold text-slate-700">
                Buscar
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Nome, descricao ou professor"
                  className="h-11 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <div className="grid gap-2 text-sm font-bold text-slate-700">
                Status
                <div
                  className="grid grid-cols-2 overflow-hidden rounded-md border border-slate-200 sm:flex"
                  role="group"
                  aria-label="Filtrar cursos por status"
                >
                  {filterOptions.map((option) => {
                    const isSelected = courseFilter === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setCourseFilter(option.value)}
                        aria-pressed={isSelected}
                        className={`px-3 py-2 text-xs font-bold transition ${
                          isSelected
                            ? "bg-blue-600 text-white"
                            : "bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="grid gap-2 text-sm font-bold text-slate-700">
                Ordenar
                <select
                  value={courseSort}
                  onChange={(event) =>
                    setCourseSort(event.target.value as CourseSort)
                  }
                  className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="recommended">Recomendados</option>
                  <option value="progress-desc">Maior progresso</option>
                  <option value="progress-asc">Menor progresso</option>
                  <option value="title">Titulo</option>
                </select>
              </label>
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => (
              <CourseTrailCard
                key={course.id}
                course={course}
                accentColor={trail.accentColor}
                onOpenCourse={(courseId) => navigate(`/courses/${courseId}`)}
              />
            ))}
          </div>

          {filteredCourses.length === 0 && (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-10 text-center">
              <p className="font-bold text-[#25304a]">
                Nenhum curso encontrado
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Ajuste os filtros para ver outros cursos desta trilha.
              </p>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
