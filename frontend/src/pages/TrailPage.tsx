import { useNavigate, useParams } from "react-router-dom";
import Footer from "../components/Footer/Footer";
import Navbar from "../components/Navbar/Navbar";
import {
  type Course,
  getMockTrailBySlug,
} from "../data/courseData";
import { getAuthenticatedUser } from "../services/userService";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Code2,
  Gamepad2,
  Layers3,
  Palette,
  Play,
  type LucideIcon,
} from "lucide-react";

const courseIcons: Record<number, LucideIcon> = {
  1: Gamepad2,
  2: Code2,
  3: Palette,
  4: BarChart3,
};

function colorWithAlpha(hexColor: string, alpha: number) {
  const normalized = hexColor.replace("#", "");
  const value = Number.parseInt(normalized, 16);

  if (normalized.length !== 6 || Number.isNaN(value)) {
    return `rgba(37, 99, 235, ${alpha})`;
  }

  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
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
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10">
      <div className="relative h-48 overflow-hidden bg-slate-200">
        <img
          src={course.image}
          alt={course.title}
          className="h-full w-full object-cover transition duration-500 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-transparent" />
        <div
          className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-600 shadow"
          style={{ color: accentColor }}
        >
          <Icon size={22} />
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <div className="mb-2 flex items-center justify-between text-xs font-bold text-white">
            <span>{course.progress}% concluido</span>
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
        <h3 className="text-lg font-black text-[#25304a]">{course.title}</h3>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
          {course.description}
        </p>
        <div className="mt-5 flex items-center justify-between gap-4">
          <p className="text-xs font-semibold text-slate-500">
            Professor:{" "}
            <span className="text-slate-700">{course.instructor.name}</span>
          </p>
          <button
            type="button"
            onClick={() => onOpenCourse(course.id)}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
            style={{ backgroundColor: accentColor }}
          >
            Abrir
            <ArrowRight size={16} />
          </button>
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
      <div className="min-h-screen bg-[#f6f9ff] text-slate-950">
        <Navbar user={user} />
        <main className="mx-auto grid min-h-[60vh] max-w-4xl place-items-center px-4 py-20 text-center sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-blue-100 bg-white p-8 shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
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
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700"
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

  const accentSoft = colorWithAlpha(trail.accentColor, 0.12);
  const accentBorder = colorWithAlpha(trail.accentColor, 0.25);
  const nextCourse =
    trail.courses.find((course) => course.progress < 100) ?? trail.courses[0];

  return (
    <div className="min-h-screen bg-[#f6f9ff] text-slate-950">
      <Navbar user={user} />

      <main className="overflow-hidden">
        <section className="border-b border-slate-200 bg-white">
          <div
            className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:py-16"
          >
            <div>
              <button
                type="button"
                onClick={() => navigate("/home#trilhas")}
                className="mb-7 inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-slate-950"
              >
                <ArrowLeft size={18} />
                Voltar para trilhas
              </button>

              <div
                className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold"
                style={{
                  borderColor: accentBorder,
                  backgroundColor: accentSoft,
                  color: trail.accentColor,
                }}
              >
                <Layers3 size={16} />
                Trilha de aprendizagem
              </div>

              <h1 className="mt-5 text-4xl font-black leading-tight text-[#25304a] sm:text-5xl">
                {trail.nome}
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                {trail.descricao}
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  {
                    label: "Cursos",
                    value: trail.courses.length,
                    icon: BookOpen,
                  },
                  {
                    label: "Aulas",
                    value: trail.totalLessons,
                    icon: Layers3,
                  },
                  {
                    label: "Progresso",
                    value: `${trail.progress}%`,
                    icon: CheckCircle2,
                  },
                ].map((metric) => {
                  const Icon = metric.icon;

                  return (
                    <div
                      key={metric.label}
                      className="rounded-2xl border bg-white p-5 shadow-sm"
                      style={{ borderColor: accentBorder }}
                    >
                      <Icon size={22} style={{ color: trail.accentColor }} />
                      <p className="mt-3 text-2xl font-black text-[#25304a]">
                        {metric.value}
                      </p>
                      <p className="text-sm font-semibold text-slate-500">
                        {metric.label}
                      </p>
                    </div>
                  );
                })}
              </div>

              {nextCourse && (
                <button
                  type="button"
                  onClick={() => navigate(`/courses/${nextCourse.id}`)}
                  className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-bold text-white shadow-lg transition hover:opacity-90"
                  style={{
                    backgroundColor: trail.accentColor,
                    boxShadow: `0 18px 36px ${colorWithAlpha(
                      trail.accentColor,
                      0.22,
                    )}`,
                  }}
                >
                  Continuar trilha
                  <Play size={18} className="fill-white" />
                </button>
              )}
            </div>

            <div className="relative">
              <div
                className="absolute -inset-4 rounded-[2rem] opacity-30 blur-2xl"
                style={{ backgroundColor: trail.accentColor }}
              />
              <div className="relative overflow-hidden rounded-[2rem] border border-white bg-white shadow-2xl shadow-slate-900/10">
                <div
                  className="h-3"
                  style={{ backgroundColor: trail.accentColor }}
                />
                <img
                  src={trail.capa}
                  alt={trail.nome}
                  className="h-80 w-full object-cover sm:h-96"
                />
                <div className="p-6">
                  <div className="mb-3 flex items-center justify-between text-sm font-bold text-slate-500">
                    <span>{trail.completedLessons} aulas concluidas</span>
                    <span>{trail.totalLessons} aulas</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${trail.progress}%`,
                        backgroundColor: trail.accentColor,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p
                className="text-sm font-bold uppercase tracking-wide"
                style={{ color: trail.accentColor }}
              >
                Cursos da trilha
              </p>
              <h2 className="mt-2 text-3xl font-black text-[#25304a]">
                Siga a sequencia recomendada
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-slate-600">
              Os cursos aparecem na ordem definida pela relacao
              trilha_curso do modelo de dados.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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
