import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Clock3,
  ListVideo,
  Pencil,
  Play,
  Trash2,
} from "lucide-react";
import Footer from "../components/Footer/Footer";
import Navbar from "../components/Navbar/Navbar";
import courseService, { type Aula, type Curso } from "../services/courseService";
import {
  isCourseStarted,
  markCourseAsStarted,
} from "../services/courseProgressService";
import { getAuthenticatedUser } from "../services/userService";

function getYoutubeEmbedUrl(videoUrl: string) {
  try {
    const url = new URL(videoUrl);
    const host = url.hostname.replace(/^www\./, "");
    let videoId = "";

    if (host === "youtu.be") {
      videoId = url.pathname.split("/").filter(Boolean)[0] ?? "";
    } else if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch") videoId = url.searchParams.get("v") ?? "";
      else {
        const parts = url.pathname.split("/").filter(Boolean);
        if (["embed", "shorts", "live"].includes(parts[0])) {
          videoId = parts[1] ?? "";
        }
      }
    }

    return /^[A-Za-z0-9_-]{6,}$/.test(videoId)
      ? `https://www.youtube-nocookie.com/embed/${videoId}`
      : null;
  } catch {
    return null;
  }
}

function formatDuration(minutes: number | null) {
  if (minutes === null) return "Duração não informada";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
}

export default function CourseView() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const user = getAuthenticatedUser();
  const userId = user?.id;
  const [course, setCourse] = useState<Curso | null>(null);
  const [lessons, setLessons] = useState<Aula[]>([]);
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    Promise.all([
      courseService.getCourse(courseId),
      courseService.listLessons(courseId),
    ])
      .then(([courseData, lessonData]) => {
        setCourse(courseData);
        setLessons(lessonData);
        setCurrentLessonId(lessonData[0]?.id ?? null);
        setStarted(userId ? isCourseStarted(userId, courseData.id) : false);
      })
      .catch((reason: unknown) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Não foi possível carregar o curso.",
        ),
      )
      .finally(() => setLoading(false));
  }, [courseId, userId]);

  const currentLesson =
    lessons.find((lesson) => lesson.id === currentLessonId) ?? lessons[0];
  const embedUrl = currentLesson
    ? getYoutubeEmbedUrl(currentLesson.url_video)
    : null;
  const canManageCourse = Boolean(
    course &&
      user &&
      (user.role === "admin" ||
        (user.role === "professor" &&
          course.id_instrutor === String(user.id))),
  );

  const handleStart = () => {
    if (!course || !userId) return;
    markCourseAsStarted(userId, course.id);
    setStarted(true);
  };

  const handleDelete = async () => {
    if (!course || !window.confirm(`Excluir o curso "${course.nome}"?`)) return;
    setDeleting(true);
    try {
      await courseService.deleteCourse(course.id);
      navigate("/courses");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível excluir o curso.",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f7f7]">
      <Navbar user={user} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate("/courses")}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-blue-600"
        >
          <ArrowLeft size={16} />Voltar para cursos
        </button>

        {loading && <p>Carregando curso...</p>}
        {error && (
          <div className="mb-6 rounded-md bg-red-100 p-4 font-semibold text-red-700">
            {error}
          </div>
        )}

        {course && (
          <div className="space-y-8">
            <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="grid lg:grid-cols-[320px_1fr]">
                <div className="min-h-56 bg-slate-200">
                  {course.url_foto ? (
                    <img
                      src={course.url_foto}
                      alt={course.nome}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full min-h-56 items-center justify-center text-blue-600">
                      <BookOpen size={72} />
                    </div>
                  )}
                </div>
                <div className="p-6 sm:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
                        {course.categoria ?? "Curso"}
                      </p>
                      <h1 className="mt-2 text-3xl font-black text-[#25304a]">
                        {course.nome}
                      </h1>
                    </div>
                    {user && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={handleStart}
                          disabled={started}
                          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-default disabled:bg-emerald-600"
                        >
                          <Play size={16} className="fill-current" />
                          {started ? "Curso iniciado" : "Iniciar curso"}
                        </button>
                        {canManageCourse && (
                          <>
                            <button
                              onClick={() =>
                                navigate(`/courses/${course.id}/editar`)
                              }
                              className="inline-flex items-center gap-2 rounded-md border border-blue-200 px-3 py-2 text-sm font-bold text-blue-700 hover:bg-blue-50"
                            >
                              <Pencil size={16} />Gerenciar
                            </button>
                            <button
                              onClick={handleDelete}
                              disabled={deleting}
                              className="inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
                            >
                              <Trash2 size={16} />
                              {deleting ? "Excluindo..." : "Excluir"}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="mt-6 whitespace-pre-wrap leading-7 text-slate-600">
                    {course.descricao ?? "Sem descrição disponível."}
                  </p>
                  <dl className="mt-8 grid gap-4 border-t border-slate-200 pt-6 sm:grid-cols-3">
                    <div>
                      <dt className="text-xs font-bold uppercase text-slate-500">Carga horária</dt>
                      <dd className="mt-1 inline-flex items-center gap-1 font-bold text-slate-800">
                        <Clock3 size={16} />
                        {course.carga_horaria === null
                          ? "Não informada"
                          : `${course.carga_horaria} horas`}
                      </dd>
                    </div>
                    <div><dt className="text-xs font-bold uppercase text-slate-500">Categoria</dt><dd className="mt-1 font-bold text-slate-800">{course.categoria ?? "Não informada"}</dd></div>
                    <div><dt className="text-xs font-bold uppercase text-slate-500">Nível</dt><dd className="mt-1 font-bold text-slate-800">{course.nivel ?? "Não informado"}</dd></div>
                  </dl>
                </div>
              </div>
            </article>

            <section>
              <div className="mb-4 flex items-center gap-3">
                <ListVideo className="text-blue-600" />
                <div>
                  <h2 className="text-2xl font-black text-[#25304a]">Aulas do curso</h2>
                  <p className="text-sm text-slate-500">{lessons.length} {lessons.length === 1 ? "aula" : "aulas"}</p>
                </div>
              </div>

              {currentLesson ? (
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    {embedUrl ? (
                      <iframe
                        className="aspect-video w-full bg-black"
                        src={embedUrl}
                        title={currentLesson.titulo}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    ) : (
                      <div className="flex aspect-video items-center justify-center bg-slate-900 px-6 text-center font-semibold text-white">
                        A URL desta aula não pôde ser reconhecida como vídeo do YouTube.
                      </div>
                    )}
                    <div className="p-6">
                      <p className="text-xs font-bold uppercase text-blue-600">Aula {currentLesson.ordem}</p>
                      <h3 className="mt-1 text-xl font-black text-[#25304a]">{currentLesson.titulo}</h3>
                      <p className="mt-2 text-sm font-semibold text-slate-500">{formatDuration(currentLesson.duracao_minutos)}</p>
                      <div className="mt-5 border-t border-slate-100 pt-5">
                        <h4 className="font-black text-slate-800">Conteúdo da aula</h4>
                        <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-600">{currentLesson.descricao ?? "Esta aula ainda não possui conteúdo complementar."}</p>
                      </div>
                    </div>
                  </div>

                  <aside className="h-fit overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <h3 className="border-b border-slate-100 px-4 py-3 font-black text-slate-800">Conteúdo</h3>
                    <div className="max-h-[520px] overflow-y-auto p-2">
                      {lessons.map((lesson) => (
                        <button
                          key={lesson.id}
                          type="button"
                          onClick={() => setCurrentLessonId(lesson.id)}
                          className={`mb-1 flex w-full gap-3 rounded-lg p-3 text-left transition ${lesson.id === currentLesson.id ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50"}`}
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-black text-blue-700">{lesson.ordem}</span>
                          <span className="min-w-0"><span className="block font-bold">{lesson.titulo}</span><span className="mt-1 block text-xs text-slate-500">{formatDuration(lesson.duracao_minutos)}</span></span>
                        </button>
                      ))}
                    </div>
                  </aside>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                  <ListVideo className="mx-auto text-slate-400" size={40} />
                  <p className="mt-3 font-bold text-slate-700">Nenhuma aula cadastrada</p>
                  <p className="mt-1 text-sm text-slate-500">As aulas com vídeos do YouTube aparecerão aqui.</p>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
