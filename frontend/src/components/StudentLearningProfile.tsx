import { ArrowRight, BookOpen, Layers3 } from "lucide-react";
import type { EnrollmentSummary } from "../services/journeyService";
import type { Trilha } from "../services/trailService";

interface FollowedTrail extends Trilha {
  enrolledCourseCount: number;
}

export default function StudentLearningProfile({
  enrollments,
  error,
  loading,
  onOpenCourse,
  onOpenTrail,
  trails,
}: {
  enrollments: EnrollmentSummary[];
  error: string;
  loading: boolean;
  onOpenCourse: (courseId: string) => void;
  onOpenTrail: (trailId: string) => void;
  trails: FollowedTrail[];
}) {
  return (
    <section className="border-t border-slate-200 bg-[#f6f9ff]">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-7">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-blue-600">
            Minha aprendizagem
          </p>
          <h2 className="mt-2 text-2xl font-black text-[#25304a]">
            Cursos e trilhas
          </h2>
        </div>
        {loading && (
          <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
            Carregando sua aprendizagem...
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"
          >
            {error}
          </p>
        )}

        {!loading && !error && enrollments.length === 0 && trails.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <BookOpen className="mx-auto h-9 w-9 text-blue-500" />
            <h3 className="mt-3 text-lg font-black text-[#25304a]">
              Nenhum curso ou trilha iniciado
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Explore o catálogo para começar sua jornada de aprendizagem.
            </p>
          </div>
        )}

        {!loading && !error && enrollments.length > 0 && (
          <div>
            <div className="mb-4 flex items-center gap-2">
              <BookOpen size={20} className="text-blue-600" />
              <h3 className="text-lg font-black text-[#25304a]">
                Cursos matriculados
              </h3>
              <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
                {enrollments.length}
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {enrollments.map((enrollment) => (
                <button
                  key={enrollment.id}
                  type="button"
                  onClick={() => onOpenCourse(enrollment.curso.id)}
                  className="group flex overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:border-blue-200 hover:shadow-md"
                >
                  <div className="flex h-32 w-32 shrink-0 items-center justify-center bg-slate-100">
                    {enrollment.curso.url_foto ? (
                      <img
                        src={enrollment.curso.url_foto}
                        alt=""
                        className="h-full w-full object-cover object-center"
                      />
                    ) : (
                      <BookOpen size={34} className="text-blue-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 p-4">
                    <p className="line-clamp-2 font-black text-[#25304a]">
                      {enrollment.curso.nome}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {enrollment.aulas_concluidas}/{enrollment.total_aulas}{" "}
                      aulas
                    </p>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-[#4d87dc]"
                        style={{ width: String(enrollment.progresso) + "%" }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-500">
                        {enrollment.progresso}% concluído
                      </span>
                      <ArrowRight
                        size={15}
                        className="text-blue-600 transition group-hover:translate-x-1"
                      />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {!loading && !error && trails.length > 0 && (
          <div className={enrollments.length > 0 ? "mt-9" : ""}>
            <div className="mb-4 flex items-center gap-2">
              <Layers3 size={20} className="text-violet-600" />
              <h3 className="text-lg font-black text-[#25304a]">
                Trilhas que estou seguindo
              </h3>
              <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-bold text-violet-700">
                {trails.length}
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {trails.map((trail) => (
                <button
                  key={trail.id}
                  type="button"
                  onClick={() => onOpenTrail(trail.id)}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:border-violet-200 hover:shadow-md"
                >
                  <div className="flex h-32 items-center justify-center bg-violet-50">
                    {trail.capa ? (
                      <img
                        src={trail.capa}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Layers3 size={38} className="text-violet-500" />
                    )}
                  </div>
                  <div className="p-4">
                    <p className="line-clamp-2 font-black text-[#25304a]">
                      {trail.nome}
                    </p>
                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      {trail.enrolledCourseCount}{" "}
                      {trail.enrolledCourseCount === 1
                        ? "curso iniciado"
                        : "cursos iniciados"}{" "}
                      nesta trilha
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-violet-700">
                      Ver trilha{" "}
                      <ArrowRight
                        size={14}
                        className="transition group-hover:translate-x-1"
                      />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
