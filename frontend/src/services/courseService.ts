import { apiFetch } from "./api";

export interface Curso {
  id: string;
  nome: string;
  descricao: string | null;
  url_foto: string | null;
  carga_horaria: number | null;
  categoria: string | null;
  nivel: string | null;
  ambiente_teste: boolean;
  id_instrutor: string;
  status: "rascunho" | "publicado";
  publicado_em?: string | null;
}

export interface CursoInput {
  nome: string;
  descricao?: string;
  url_foto?: string;
  carga_horaria?: number;
  categoria?: string;
  nivel?: string;
  ambiente_teste?: boolean;
}

export interface Aula {
  id: string;
  titulo: string;
  descricao: string | null;
  url_video: string;
  duracao_minutos: number | null;
  duracao_segundos: number | null;
  youtube_video_id: string | null;
  youtube_embeddable: boolean | null;
  youtube_validado_em: string | null;
  ordem: number;
}

export interface AulaInput {
  titulo: string;
  descricao?: string;
  url_video: string;
  duracao_segundos: number;
  ordem?: number;
}

function getErrorMessage(data: unknown, fallback: string) {
  if (!data || typeof data !== "object" || !("message" in data)) return fallback;
  const message = (data as { message?: unknown }).message;
  return Array.isArray(message) ? message.join(" ") : typeof message === "string" ? message : fallback;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await apiFetch(path, options);

  if (!response.ok) {
    let data: unknown;
    try { data = await response.json(); } catch { data = null; }
    throw new Error(getErrorMessage(data, "Não foi possível concluir a operação."));
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

const courseService = {
  listCourses: () =>
    request<Curso[]>("/cursos"),
  getCourse: (id: string) =>
    request<Curso>(`/cursos/${id}`),
  createCourse: (curso: CursoInput) =>
    request<Curso>("/cursos", { method: "POST", body: JSON.stringify(curso) }),
  updateCourse: (id: string, curso: Partial<CursoInput>) =>
    request<Curso>(`/cursos/${id}`, { method: "PATCH", body: JSON.stringify(curso) }),
  deleteCourse: (id: string) =>
    request<void>(`/cursos/${id}`, { method: "DELETE" }),
  publishCourse: (id: string) =>
    request<Curso>(`/cursos/${id}/publicar`, { method: "POST" }),
  listLessons: (courseId: string) =>
    request<Aula[]>(`/cursos/${courseId}/aulas`),
  createLesson: (courseId: string, aula: AulaInput) =>
    request<Aula>(`/cursos/${courseId}/aulas`, {
      method: "POST",
      body: JSON.stringify(aula),
    }),
  updateLesson: (courseId: string, lessonId: string, aula: Partial<AulaInput>) =>
    request<Aula>(`/cursos/${courseId}/aulas/${lessonId}`, {
      method: "PATCH",
      body: JSON.stringify(aula),
    }),
  deleteLesson: (courseId: string, lessonId: string) =>
    request<void>(`/cursos/${courseId}/aulas/${lessonId}`, {
      method: "DELETE",
    }),
};

export default courseService;
