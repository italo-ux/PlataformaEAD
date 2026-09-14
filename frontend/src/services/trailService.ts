import { apiFetch } from "./api";
import type { Curso } from "./courseService";

export interface Trilha {
  id: string;
  nome: string;
  descricao: string | null;
  capa: string | null;
  nivel: string | null;
  cursos: Curso[];
}

export interface TrilhaInput {
  nome: string;
  descricao?: string;
  capa?: string;
  nivel?: string;
  courseIds?: string[];
}

async function request<T>(path: string, options: RequestInit = {}) {
  const response = await apiFetch(path, options);
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as
      | { message?: string | string[] }
      | null;
    const message = data?.message;
    throw new Error(
      Array.isArray(message)
        ? message.join(" ")
        : message || "Não foi possível concluir a operação.",
    );
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

const trailService = {
  listTrails: () => request<Trilha[]>("/trilhas"),
  getTrail: (id: string) => request<Trilha>(`/trilhas/${id}`),
  createTrail: (input: TrilhaInput) =>
    request<Trilha>("/trilhas", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  deleteTrail: (id: string) =>
    request<void>(`/trilhas/${id}`, { method: "DELETE" }),
};

export default trailService;
