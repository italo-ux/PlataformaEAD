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
}

export interface CursoInput {
  nome: string;
  descricao?: string;
  url_foto?: string;
  carga_horaria?: number;
  categoria?: string;
  nivel?: string;
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
};

export default courseService;
