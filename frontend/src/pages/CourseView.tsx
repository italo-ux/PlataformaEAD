import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  Clock3,
  Download,
  GraduationCap,
  LockKeyhole,
  Play,
  AlertTriangle,
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
import QuizLesson from "../components/QuizLesson";

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
  const canManage =
    user?.role === "admin" ||
    (user?.role === "professor" &&
      String(course?.id_instrutor) === String(user.id));
  const completedLessons =
    journey?.aulas.filter((lesson) => lesson.status === "concluida").length ??
    0;

  const startCourse = async () => {
    if (!courseId) return;
    setStarting(true);
    setError("");
    try {
      const result = await journeyService.enroll(courseId);
      setJourney(result);
      window.dispatchEvent(new Event("ead.sidebar.refresh"));
      const first =
        result.aulas.find((lesson) => lesson.status === "disponivel") ??
        result.aulas[0];
      setCurrentLessonId(first?.id ?? null);
      playerSectionRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível iniciar o curso.",
      );
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
      window.dispatchEvent(new Event("ead.sidebar.refresh"));
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
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível excluir o curso.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleVideoError = (lesson: JourneyLesson, message: string) => {
    setError(message);
    if (!courseId) return;
    void journeyService
      .validateVideo(courseId, lesson.id)
      .then((validation) => {
        if (validation.disponivel) return;
        if (user?.role === "aluno") {
          navigate("/courses", { replace: true });
          return;
        }
        void loadJourney();
      })
      .catch(() => {
        // O erro original do player permanece visível. Falhas transitórias de
        // validação não devem ocultar o curso nem substituir essa mensagem.
      });
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#edf2f8] text-slate-900">
      <Navbar user={user} />
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        <button
          type="button"
          onClick={() => navigate("/courses")}
          className="mb-5 inline-flex items-center gap-2 rounded-lg px-1 py-2 text-sm font-semibold text-slate-600 transition hover:text-blue-600"
        >
          <ArrowLeft size={17} /> Voltar para cursos
        </button>

        {loading && (
          <div className="rounded-3xl border border-slate-200 bg-white py-16 text-center text-slate-600 shadow-sm">
            Carregando jornada...
          </div>
        )}
        {error && (
          <div
            role="alert"
            className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700"
          >
            {error}
          </div>
        )}

        {course && journey && (
          <div className="space-y-6">
            {journey.modo === "preview" && course.conteudo_indisponivel && (
              <div className="flex gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950" role="alert">
                <AlertTriangle className="mt-0.5 shrink-0" size={22} />
                <div>
                  <p className="font-black">Curso indisponível para alunos</p>
                  <p className="mt-1 text-sm">
                    {course.validacao_pendente
                      ? "A validação de um ou mais vídeos está pendente."
                      : "Um ou mais vídeos foram removidos, ficaram privados ou deixaram de permitir incorporação."}
                    {canManage && " Corrija as aulas indicadas antes de divulgar o curso novamente."}
                  </p>
                  {course.videos_indisponiveis?.length ? (
                    <ul className="mt-2 list-disc pl-5 text-sm font-semibold">
                      {course.videos_indisponiveis.map((video) => (
                        <li key={video.id}>{video.titulo}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            )}
            {!journey.matricula && (
              <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-xl shadow-slate-300/50">
                <div className="grid lg:grid-cols-[minmax(0,1.08fr)_minmax(380px,0.92fr)]">
                  <div className="relative min-h-[260px] overflow-hidden bg-slate-100 sm:min-h-[340px] lg:min-h-[410px]">
                    {course.url_foto ? (
                      <img
                        src={course.url_foto}
                        alt={`Capa do curso ${course.nome}`}
                        className="absolute inset-0 h-full w-full object-cover object-center"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#172033] via-[#24365c] to-[#3567d5] text-white">
                        <div className="text-center">
                          <BookOpen
                            size={72}
                            className="mx-auto text-blue-200"
                          />
                          <p className="mt-4 text-sm font-bold uppercase tracking-[0.16em] text-blue-100">
                            {course.categoria ?? "Curso"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col p-6 sm:p-8 lg:p-10">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-blue-700 ring-1 ring-blue-100">
                        {course.categoria ?? "Curso"}
                      </span>
                      {journey.modo === "preview" && (
                        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 ring-1 ring-amber-200">
                          Pré-visualização
                        </span>
                      )}
                      {course.ambiente_teste && (
                        <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-800 ring-1 ring-violet-200">
                          Ambiente de teste
                        </span>
                      )}
                    </div>

                    <h1 className="mt-6 text-3xl font-black leading-tight tracking-tight text-[#172033] sm:text-4xl">
                      {course.nome}
                    </h1>
                    <p className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-slate-600">
                      {course.descricao ?? "Sem descrição disponível."}
                    </p>

                    <div className="mt-7 flex flex-wrap gap-2">
                      {user?.role === "aluno" && !journey.matricula && (
                        <button
                          type="button"
                          onClick={startCourse}
                          disabled={starting || journey.aulas.length === 0}
                          className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#5dce73] px-6 py-3 font-black text-white transition-colors hover:bg-[#4fbd65] disabled:opacity-60"
                        >
                          {starting
                            ? "Processando..."
                            : course.ambiente_teste
                              ? "Concluir curso de teste"
                              : "Matricule-se"}
                        </button>
                      )}
                      {canManage && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/courses/${course.id}/editar`)
                            }
                            className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700"
                          >
                            Gerenciar
                          </button>
                          <button
                            type="button"
                            onClick={deleteCourse}
                            disabled={deleting}
                            className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-red-200 bg-white px-5 py-3 font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                          >
                            {deleting ? "Excluindo..." : "Excluir"}
                          </button>
                        </>
                      )}
                    </div>

                    <div className="mt-7 grid gap-3 border-t border-slate-200 pt-6 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                      <div className="flex items-center gap-3">
                        <span className="rounded-xl bg-blue-50 p-2.5 text-blue-700">
                          <Clock3 size={18} />
                        </span>
                        <span>
                          <span className="block text-xs font-semibold text-slate-400">
                            Carga horária
                          </span>
                          <span className="text-sm font-black text-[#25304a]">
                            {course.carga_horaria ?? 0} horas
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="rounded-xl bg-blue-50 p-2.5 text-blue-700">
                          <BookOpen size={18} />
                        </span>
                        <span>
                          <span className="block text-xs font-semibold text-slate-400">
                            Conteúdo
                          </span>
                          <span className="text-sm font-black text-[#25304a]">
                            {journey.aulas.length}{" "}
                            {journey.aulas.length === 1 ? "aula" : "aulas"}
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="rounded-xl bg-blue-50 p-2.5 text-blue-700">
                          <GraduationCap size={19} />
                        </span>
                        <span>
                          <span className="block text-xs font-semibold text-slate-400">
                            Progresso
                          </span>
                          <span className="text-sm font-black text-[#25304a]">
                            {completedLessons} concluídas
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}
            {journey.certificado && (
              <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="rounded-xl bg-emerald-600 p-2.5 text-white">
                      <Check size={20} />
                    </span>
                    <div>
                      <p className="font-black text-emerald-900">
                        Curso concluído
                      </p>
                      <p className="mt-1 text-sm text-emerald-800">
                        Seu certificado verificável já está disponível.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      void certificateService.download(journey.certificado!)
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 font-bold text-white hover:bg-emerald-800"
                  >
                    <Download size={18} /> Baixar certificado
                  </button>
                </div>
              </section>
            )}

            <section ref={playerSectionRef} className="scroll-mt-24">
              <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_370px]">
                <article className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-lg shadow-slate-200/60">
                  {currentLesson && (
                    <header className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
                          Aula {currentLesson.ordem}
                        </p>
                        <h2 className="mt-1 text-xl font-black text-[#25304a] sm:text-2xl">
                          {currentLesson.titulo}
                        </h2>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 size={15} />{" "}
                          {formatDigitalDuration(
                            currentLesson.duracao_segundos,
                          )}
                        </span>
                        <span className="rounded-full bg-blue-50 px-3 py-1.5 font-bold text-blue-700">
                          {Math.round(currentLesson.percentual)}%
                        </span>
                      </div>
                    </header>
                  )}

                  <div className={currentLesson?.tipo === "questionario" ? "bg-white" : "bg-[#0f172a]"}>
                    {!journey.matricula && user?.role === "aluno" ? (
                      <div className="flex aspect-video items-center justify-center px-8 text-center text-white">
                        <div>
                          <LockKeyhole
                            className="mx-auto text-blue-300"
                            size={42}
                          />
                          <p className="mt-4 font-bold">
                            Inicie o curso para liberar a primeira aula.
                          </p>
                        </div>
                      </div>
                    ) : currentLesson?.status === "bloqueada" ? (
                      <div className="flex aspect-video flex-col items-center justify-center px-8 text-center text-white">
                        <LockKeyhole size={42} className="text-blue-300" />
                        <p className="mt-4 font-bold">
                          Conclua a aula anterior para continuar.
                        </p>
                      </div>
                    ) : currentLesson?.tipo === "questionario" ? (
                      <QuizLesson
                        courseId={course.id}
                        lesson={currentLesson}
                        canSubmit={
                          user?.role === "aluno" &&
                          journey.modo === "aluno" &&
                          currentLesson.status !== "concluida"
                        }
                        onCompleted={() => void loadJourney()}
                      />
                    ) : currentLesson?.url_video ? (
                      <TrackedYoutubePlayer
                        key={currentLesson.id}
                        videoUrl={currentLesson.url_video}
                        title={currentLesson.titulo}
                        resumeAt={currentLesson.posicao_segundos}
                        completed={
                          currentLesson.status === "concluida" ||
                          journey.modo === "preview"
                        }
                        onStart={(position) =>
                          journeyService.startPlayback(
                            course.id,
                            currentLesson.id,
                            position,
                          )
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
                        onUpdate={(update) =>
                          applyPlaybackUpdate(currentLesson, update)
                        }
                        onError={(message) =>
                          handleVideoError(currentLesson, message)
                        }
                      />
                    ) : (
                      <div className="flex aspect-video items-center justify-center px-8 text-center text-white">
                        O vídeo desta aula está indisponível.
                      </div>
                    )}
                  </div>

                  {currentLesson && (
                    <div className="p-5 sm:p-7">
                      <div className="flex items-center gap-3">
                        <span className="h-px flex-1 bg-slate-200" />
                        <h3 className="text-sm font-black uppercase tracking-[0.12em] text-slate-500">
                          Visão geral
                        </h3>
                        <span className="h-px flex-1 bg-slate-200" />
                      </div>
                      <p className="mt-5 whitespace-pre-wrap text-[15px] leading-7 text-slate-600">
                        {currentLesson.descricao ??
                          "Sem conteúdo complementar."}
                      </p>
                    </div>
                  )}
                </article>

                <aside className="sticky top-24 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-lg shadow-slate-200/60">
                  <div className="bg-[#172033] px-5 py-5 text-white">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-300">
                          Programa
                        </p>
                        <h2 className="mt-1 text-lg font-black">
                          Conteúdo do curso
                        </h2>
                      </div>
                      <span className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold ring-1 ring-white/10">
                        {journey.aulas.length} aulas
                      </span>
                    </div>
                  </div>
                  <div className="max-h-[650px] overflow-y-auto p-3">
                    {journey.aulas.map((lesson, index) => {
                      const active = lesson.id === currentLesson?.id;
                      const locked = lesson.status === "bloqueada";
                      const complete = lesson.status === "concluida";
                      return (
                        <button
                          key={lesson.id}
                          type="button"
                          disabled={locked}
                          onClick={() => setCurrentLessonId(lesson.id)}
                          className={`mb-2 flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition ${
                            active
                              ? "border-blue-200 bg-blue-50 shadow-sm"
                              : locked
                                ? "cursor-not-allowed border-transparent bg-slate-50 text-slate-400"
                                : "border-transparent hover:border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
                              complete
                                ? "bg-emerald-100 text-emerald-700"
                                : active
                                  ? "bg-blue-600 text-white"
                                  : locked
                                    ? "bg-slate-200 text-slate-500"
                                    : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {complete ? (
                              <CheckCircle2 size={18} />
                            ) : locked ? (
                              <LockKeyhole size={16} />
                            ) : (
                              String(index + 1).padStart(2, "0")
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span
                              className={`block line-clamp-2 text-sm font-bold ${active ? "text-blue-800" : "text-[#25304a]"}`}
                            >
                              {lesson.titulo}
                            </span>
                            <span className="mt-1.5 flex items-center justify-between gap-2 text-xs">
                              <span>
                                {complete
                                  ? "Concluída"
                                  : locked
                                    ? "Bloqueada"
                                    : `${Math.round(lesson.percentual)}% assistido`}
                              </span>
                              {!locked && !complete && (
                                <Play
                                  size={13}
                                  className={
                                    active ? "text-blue-600" : "text-slate-400"
                                  }
                                />
                              )}
                            </span>
                            {!locked && (
                              <span className="mt-2 block h-1 overflow-hidden rounded-full bg-slate-200">
                                <span
                                  className={`block h-full rounded-full ${complete ? "bg-emerald-500" : "bg-blue-500"}`}
                                  style={{
                                    width: `${complete ? 100 : lesson.percentual}%`,
                                  }}
                                />
                              </span>
                            )}
                          </span>
                        </button>
                      );
                    })}
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
