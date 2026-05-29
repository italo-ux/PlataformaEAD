import { useNavigate, useParams } from "react-router-dom";
import Footer from "../components/Footer/Footer";
import Navbar from "../components/Navbar/Navbar";
import { type Course, getMockTrailBySlug } from "../data/courseData";
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
  const trail = trailSlug ? getMockTrailBySlug(trailSlug) : null;

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
              Essa trilha nao existe na lista mockada atual.
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
  const foundCoursesText = `${trail.courses.length} ${
    trail.courses.length === 1 ? "curso encontrado" : "cursos encontrados"
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
          <div className="mb-6 flex items-center justify-between gap-4">
            <p className="text-sm font-bold text-slate-700">
              {foundCoursesText}
            </p>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm font-bold text-slate-700 transition hover:bg-white"
              aria-label="Filtrar cursos"
            >
              Filtrar
              <SlidersHorizontal size={22} strokeWidth={2.4} />
            </button>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {trail.courses.map((course) => (
              <CourseTrailCard
                key={course.id}
                course={course}
                accentColor={trail.accentColor}
                onOpenCourse={(courseId) => navigate(`/courses/${courseId}`)}
              />
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
