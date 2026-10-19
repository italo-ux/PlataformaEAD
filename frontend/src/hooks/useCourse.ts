import { useEffect, useState } from "react";
import courseService, { type Curso } from "../services/courseService";

export function useCourse(courseId: string) {
  const [course, setCourse] = useState<Curso | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { courseService.getCourse(courseId).then(setCourse).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Erro ao buscar curso")).finally(() => setLoading(false)); }, [courseId]);
  return { course, loading, error };
}
