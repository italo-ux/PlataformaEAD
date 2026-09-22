import { apiFetch } from "./api";
import type { Curso } from "./courseService";

export type LessonJourneyStatus = "bloqueada" | "disponivel" | "concluida";

export interface JourneyLesson {
  id: string;
  titulo: string;
  descricao: string | null;
  duracao_minutos: number | null;
  duracao_segundos: number | null;
  ordem: number;
  url_video: string | null;
  tipo: "video" | "pdf" | "link" | "imagem" | "questionario";
  questionario: {
    id: string;
    nota_minima: number;
    max_tentativas: number | null;
    pontos_base: number;
    perguntas: Array<{
      id: string;
      enunciado: string;
      ordem: number;
      pontos: number;
      alternativas: Array<{ id: string; texto: string; ordem: number }>;
    }>;
  } | null;
  status: LessonJourneyStatus;
  percentual: number;
  posicao_segundos: number;
}

export interface CertificateSummary {
  id: string;
  codigo: string;
  nome_aluno: string;
  nome_curso: string;
  carga_horaria: number;
  concluido_em: string;
  emitido_em: string;
  status: "valido" | "revogado";
}

export interface CourseJourney {
  curso: Curso;
  modo: "aluno" | "preview";
  matricula: {
    id: string;
    progresso: number;
    conclusao: boolean;
    concluido_em: string | null;
    ultima_aula_id: string | null;
    segundos_estudados: number;
  } | null;
  certificado?: CertificateSummary | null;
  aulas: JourneyLesson[];
}

export interface EnrollmentSummary {
  id: string;
  progresso: number;
  conclusao: boolean;
  concluido_em: string | null;
  ultima_aula_id: string | null;
  segundos_estudados: number;
  data_matricula: string;
  aulas_concluidas: number;
  total_aulas: number;
  curso: Curso;
}

export interface JourneyMetrics {
  matriculas_iniciadas: number;
  aulas_concluidas: number;
  cursos_concluidos: number;
  certificados_emitidos: number;
}

export type PlaybackState = "playing" | "paused" | "ended";

export interface PlaybackSessionInfo {
  id: string;
  sequencia: number;
  duracao_segundos: number;
  heartbeat_segundos: number;
  expira_em: string;
}

export interface PlaybackUpdate {
  sequencia: number;
  creditado: boolean;
  motivo: "continuo" | "repeticao" | "salto" | "ancora" | "sem_movimento" | "duplicado";
  aula: {
    percentual: number;
    posicao_segundos: number;
    concluida: boolean;
  };
  matricula: { progresso: number; conclusao: boolean };
  proxima_aula_id: string | null;
}

export interface QuizResult {
  tentativa_id: string;
  numero: number;
  acertos: number;
  total_perguntas: number;
  percentual: number;
  aprovado: boolean;
  pontos_obtidos: number;
  tentativas_restantes: number;
  gabarito_disponivel: boolean;
  respostas: Array<{
    pergunta_id: string;
    alternativa_selecionada_id: string;
    alternativa_correta_id: string | null;
    correta: boolean;
  }>;
}

export class JourneyRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function read<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as
      | { message?: string | string[] }
      | null;
    const message = data?.message;
    throw new JourneyRequestError(
      Array.isArray(message)
        ? message.join(" ")
        : message || "Não foi possível carregar sua jornada.",
      response.status,
    );
  }
  return response.json() as Promise<T>;
}

const journeyService = {
  getJourney: (courseId: string) =>
    apiFetch(`/cursos/${courseId}/jornada`).then(read<CourseJourney>),
  enroll: (courseId: string) =>
    apiFetch(`/cursos/${courseId}/matricula`, { method: "POST" }).then(
      read<CourseJourney>,
    ),
  listEnrollments: () =>
    apiFetch("/usuarios/me/matriculas").then(read<EnrollmentSummary[]>),
  metrics: () =>
    apiFetch("/admin/metricas-jornada").then(read<JourneyMetrics>),
  submitQuiz: (
    courseId: string,
    lessonId: string,
    respostas: Array<{ pergunta_id: string; alternativa_id: string }>,
  ) =>
    apiFetch(`/cursos/${courseId}/aulas/${lessonId}/questionario/tentativas`, {
      method: "POST",
      body: JSON.stringify({ respostas }),
    }).then(read<QuizResult>),
  validateVideo: (courseId: string, lessonId: string) =>
    apiFetch(`/cursos/${courseId}/aulas/${lessonId}/validar-video`, {
      method: "POST",
    }).then(read<{ disponivel: boolean; validado_em: string }>),
  startPlayback: (
    courseId: string,
    lessonId: string,
    posicao_segundos: number,
  ) =>
    apiFetch(`/cursos/${courseId}/aulas/${lessonId}/reproducao`, {
      method: "POST",
      body: JSON.stringify({ posicao_segundos }),
    }).then(read<PlaybackSessionInfo>),
  heartbeat: (
    courseId: string,
    lessonId: string,
    sessionId: string,
    input: { sequencia: number; posicao_segundos: number; estado: PlaybackState },
  ) =>
    apiFetch(
      `/cursos/${courseId}/aulas/${lessonId}/reproducao/${sessionId}/heartbeat`,
      { method: "POST", keepalive: true, body: JSON.stringify(input) },
    ).then(read<PlaybackUpdate>),
  endPlayback: (
    courseId: string,
    lessonId: string,
    sessionId: string,
    input: { sequencia: number; posicao_segundos: number },
  ) =>
    apiFetch(
      `/cursos/${courseId}/aulas/${lessonId}/reproducao/${sessionId}/encerrar`,
      { method: "POST", keepalive: true, body: JSON.stringify(input) },
    ).then(read<PlaybackUpdate>),
};

export default journeyService;
