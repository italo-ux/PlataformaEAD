const API_URL = "http://localhost:3000";
const AUTH_TOKEN_STORAGE_KEY = "token";

export interface Curso {
  id: string;
  nome: string;
  descricao: string | null;
  url_foto: string | null;
  carga_horaria: number | null;
  categoria: string | null;
  nivel: string | null;
  id_instrutor: string;
}

export interface CursoInput {
  nome: string;
  descricao?: string;
  url_foto?: string;
  carga_horaria?: number;
  categoria?: string;
  nivel?: string;
}

export interface Aula {
  id: string;
  titulo: string;
  descricao: string | null;
  url_video: string;
  duracao_minutos: number | null;
  ordem: number;
}

export interface AulaInput {
  titulo: string;
  descricao?: string;
  url_video: string;
  duracao_minutos?: number;
  ordem?: number;
}

function getErrorMessage(data: unknown, fallback: string) {
  if (!data || typeof data !== "object" || !("message" in data)) return fallback;
  const message = (data as { message?: unknown }).message;
  return Array.isArray(message) ? message.join(" ") : typeof message === "string" ? message : fallback;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });

  if (!response.ok) {
    let data: unknown;
    try { data = await response.json(); } catch { data = null; }
    throw new Error(getErrorMessage(data, "Não foi possível concluir a operação."));
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function authenticatedHeaders() {
  const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  if (!token) throw new Error("Faça login para gerenciar cursos.");
  return { Authorization: `Bearer ${token}` };
}

const courseService = {
  listCourses: () => request<Curso[]>("/cursos"),
  getCourse: (id: string) => request<Curso>(`/cursos/${id}`),
  createCourse: (curso: CursoInput) =>
    request<Curso>("/cursos", { method: "POST", headers: authenticatedHeaders(), body: JSON.stringify(curso) }),
  updateCourse: (id: string, curso: Partial<CursoInput>) =>
    request<Curso>(`/cursos/${id}`, { method: "PATCH", headers: authenticatedHeaders(), body: JSON.stringify(curso) }),
  deleteCourse: (id: string) =>
    request<void>(`/cursos/${id}`, { method: "DELETE", headers: authenticatedHeaders() }),
  listLessons: (courseId: string) =>
    request<Aula[]>(`/cursos/${courseId}/aulas`),
  createLesson: (courseId: string, aula: AulaInput) =>
    request<Aula>(`/cursos/${courseId}/aulas`, {
      method: "POST",
      headers: authenticatedHeaders(),
      body: JSON.stringify(aula),
    }),
  updateLesson: (courseId: string, lessonId: string, aula: Partial<AulaInput>) =>
    request<Aula>(`/cursos/${courseId}/aulas/${lessonId}`, {
      method: "PATCH",
      headers: authenticatedHeaders(),
      body: JSON.stringify(aula),
    }),
  deleteLesson: (courseId: string, lessonId: string) =>
    request<void>(`/cursos/${courseId}/aulas/${lessonId}`, {
      method: "DELETE",
      headers: authenticatedHeaders(),
    }),
};

export default courseService;
