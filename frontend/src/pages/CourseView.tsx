import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock3,
  Download,
  LockKeyhole,
  Pencil,
  Play,
  Trash2,
} from "lucide-react";
import Footer from "../components/Footer/Footer";
import Navbar from "../components/Navbar/Navbar";
import TrackedYoutubePlayer from "../components/TrackedYoutubePlayer";
import courseService from "../services/courseService";
import certificateService from "../services/certificateService";
import journeyService, {
  type CourseJourney,
  type JourneyLesson,
  type PlaybackUpdate,
} from "../services/journeyService";
import { useAuth } from "../context/auth-context";
import { formatDigitalDuration } from "../utils/duration";

export default function CourseView() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const { user } = useAuth();
  const [journey, setJourney] = useState<CourseJourney | null>(null);
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const playerSectionRef = useRef<HTMLElement>(null);

  const loadJourney = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const result = await journeyService.getJourney(courseId);
      setJourney(result);
      setCurrentLessonId(
        result.matricula?.ultima_aula_id ??
          result.aulas.find((lesson) => lesson.status !== "bloqueada")?.id ??
          result.aulas[0]?.id ??
          null,
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível carregar o curso.",
      );
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void loadJourney();
  }, [loadJourney]);

  const currentLesson = useMemo(
    () =>
      journey?.aulas.find((lesson) => lesson.id === currentLessonId) ??
      journey?.aulas.find((lesson) => lesson.status !== "bloqueada") ??
      journey?.aulas[0],
    [currentLessonId, journey],
  );
  const course = journey?.curso;
  const canManage = user?.role === "admin" || user?.role === "professor";

  const startCourse = async () => {
    if (!courseId) return;
    setStarting(true);
    setError("");
    try {
      const result = await journeyService.enroll(courseId);
      setJourney(result);
      const first =
        result.aulas.find((lesson) => lesson.status === "disponivel") ??
        result.aulas[0];
      setCurrentLessonId(first?.id ?? null);
      playerSectionRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível iniciar o curso.");
    } finally {
      setStarting(false);
    }
  };

  const applyPlaybackUpdate = (
    lesson: JourneyLesson,
    update: PlaybackUpdate,
  ) => {
    setJourney((current) => {
      if (!current) return current;
      return {
        ...current,
        matricula: current.matricula
          ? {
              ...current.matricula,
              progresso: update.matricula.progresso,
              conclusao: update.matricula.conclusao,
              ultima_aula_id: update.proxima_aula_id,
            }
          : null,
        aulas: current.aulas.map((item) =>
          item.id === lesson.id
            ? {
                ...item,
                percentual: update.aula.percentual,
                posicao_segundos: update.aula.posicao_segundos,
                status: update.aula.concluida ? "concluida" : item.status,
              }
            : item,
        ),
      };
    });
    if (update.aula.concluida || update.matricula.conclusao) {
      void loadJourney();
    }
  };

  const deleteCourse = async () => {
    if (!course || !window.confirm(`Excluir o curso "${course.nome}"?`)) return;
    setDeleting(true);
    try {
      await courseService.deleteCourse(course.id);
      navigate("/courses");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível excluir o curso.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f6f9ff]">
      <Navbar user={user} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <button type="button" onClick={() => navigate("/courses")} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-blue-600">
          <ArrowLeft size={16} /> Voltar para cursos
        </button>

        {loading && <p className="py-12 text-center text-slate-600">Carregando jornada...</p>}
        {error && <div role="alert" className="mb-6 rounded-lg bg-red-100 p-4 font-semibold text-red-700">{error}</div>}

        {course && journey && (
          <div className="space-y-8">
            <article className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
              <div className="grid lg:grid-cols-[300px_1fr]">
                <div className="min-h-56 bg-blue-50">
                  {course.url_foto ? (
                    <img src={course.url_foto} alt={course.nome} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full min-h-56 items-center justify-center text-blue-600"><BookOpen size={72} /></div>
                  )}
                </div>
                <div className="p-6 sm:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-wide text-blue-600">{course.categoria ?? "Curso"}</p>
                      <h1 className="mt-2 text-3xl font-black text-[#25304a]">{course.nome}</h1>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {user?.role === "aluno" && !journey.matricula && (
                        <button type="button" onClick={startCourse} disabled={starting || journey.aulas.length === 0} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-bold text-white disabled:opacity-60">
                          <Play size={17} />
                          {starting
                            ? "Processando..."
                            : course.ambiente_teste
                              ? "Concluir curso de teste"
                              : "Iniciar curso"}
                        </button>
                      )}
                      {canManage && (
                        <>
                          <button type="button" onClick={() => navigate(`/courses/${course.id}/editar`)} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 font-bold text-blue-700"><Pencil size={16} /> Gerenciar</button>
                          <button type="button" onClick={deleteCourse} disabled={deleting} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 font-bold text-white disabled:opacity-60"><Trash2 size={16} /> {deleting ? "Excluindo..." : "Excluir"}</button>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="mt-5 whitespace-pre-wrap leading-7 text-slate-600">{course.descricao ?? "Sem descrição disponível."}</p>
                  <div className="mt-6 flex flex-wrap gap-4 text-sm font-semibold text-slate-600">
                    <span className="inline-flex items-center gap-2"><Clock3 size={16} /> {course.carga_horaria ?? 0} horas</span>
                    <span>{journey.aulas.length} {journey.aulas.length === 1 ? "aula" : "aulas"}</span>
                    {journey.modo === "preview" && <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">Pré-visualização</span>}
                    {course.ambiente_teste && <span className="rounded-full bg-violet-100 px-3 py-1 text-violet-800">Ambiente de teste</span>}
                  </div>
                  {journey.matricula && (
                    <div className="mt-6">
                      <div className="mb-2 flex justify-between text-sm font-bold text-slate-700"><span>Progresso do curso</span><span>{journey.matricula.progresso}%</span></div>
                      <div className="h-3 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${journey.matricula.progresso}%` }} /></div>
                    </div>
                  )}
                </div>
              </div>
            </article>

            {journey.certificado && (
              <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div><p className="font-black text-emerald-900">Curso concluído</p><p className="mt-1 text-sm text-emerald-800">Seu certificado verificável já está disponível.</p></div>
                  <button type="button" onClick={() => void certificateService.download(journey.certificado!)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-3 font-bold text-white"><Download size={18} /> Baixar certificado</button>
                </div>
              </section>
            )}

            <section ref={playerSectionRef} className="scroll-mt-24">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
                  {!journey.matricula && user?.role === "aluno" ? (
                    <div className="flex aspect-video items-center justify-center bg-slate-900 px-8 text-center text-white">Inicie o curso para liberar a primeira aula.</div>
                  ) : currentLesson?.status === "bloqueada" ? (
                    <div className="flex aspect-video flex-col items-center justify-center bg-slate-900 px-8 text-center text-white"><LockKeyhole size={42} /><p className="mt-3 font-bold">Conclua a aula anterior para continuar.</p></div>
                  ) : currentLesson?.url_video ? (
                    <TrackedYoutubePlayer
                      key={currentLesson.id}
                      videoUrl={currentLesson.url_video}
                      title={currentLesson.titulo}
                      resumeAt={currentLesson.posicao_segundos}
                      completed={currentLesson.status === "concluida" || journey.modo === "preview"}
                      onStart={(position) =>
                        journeyService.startPlayback(course.id, currentLesson.id, position)
                      }
                      onHeartbeat={(sessionId, input) =>
                        journeyService.heartbeat(
                          course.id,
                          currentLesson.id,
                          sessionId,
                          input,
                        )
                      }
                      onEnd={(sessionId, input) =>
                        journeyService.endPlayback(
                          course.id,
                          currentLesson.id,
                          sessionId,
                          input,
                        )
                      }
                      onUpdate={(update) => applyPlaybackUpdate(currentLesson, update)}
                      onError={setError}
                    />
                  ) : (
                    <div className="flex aspect-video items-center justify-center bg-slate-900 px-8 text-center text-white">O vídeo desta aula está indisponível.</div>
                  )}
                  {currentLesson && (
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div><p className="text-xs font-bold uppercase text-blue-600">Aula {currentLesson.ordem}</p><h2 className="mt-1 text-xl font-black text-[#25304a]">{currentLesson.titulo}</h2></div>
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{Math.round(currentLesson.percentual)}%</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        {formatDigitalDuration(currentLesson.duracao_segundos)}
                      </p>
                      <p className="mt-5 whitespace-pre-wrap border-t border-slate-100 pt-5 leading-7 text-slate-600">{currentLesson.descricao ?? "Sem conteúdo complementar."}</p>
                    </div>
                  )}
                </div>

                <aside className="h-fit overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
                  <h2 className="border-b border-slate-100 px-4 py-4 font-black text-[#25304a]">Conteúdo do curso</h2>
                  <div className="max-h-[560px] overflow-y-auto p-2">
                    {journey.aulas.map((lesson) => (
                      <button
                        key={lesson.id}
                        type="button"
                        disabled={lesson.status === "bloqueada"}
                        onClick={() => setCurrentLessonId(lesson.id)}
                        className={`mb-1 flex w-full gap-3 rounded-xl p-3 text-left transition ${lesson.id === currentLesson?.id ? "bg-blue-50 text-blue-700" : lesson.status === "bloqueada" ? "cursor-not-allowed text-slate-400" : "hover:bg-slate-50"}`}
                      >
                        <span className="mt-0.5">{lesson.status === "concluida" ? <CheckCircle2 size={20} className="text-emerald-600" /> : lesson.status === "bloqueada" ? <LockKeyhole size={18} /> : <Play size={18} />}</span>
                        <span className="min-w-0 flex-1"><span className="block font-bold">{lesson.titulo}</span><span className="mt-1 block text-xs">{lesson.status === "concluida" ? "Concluída" : lesson.status === "bloqueada" ? "Bloqueada" : `${Math.round(lesson.percentual)}% assistido`}</span></span>
                      </button>
                    ))}
                  </div>
                </aside>
              </div>
            </section>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
