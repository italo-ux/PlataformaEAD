import { useState, useEffect } from 'react';
import type { Course } from '../data/courseData';
import { courseData } from '../data/courseData';

interface UseCourseReturn {
  course: Course | null;
  loading: boolean;
  error: string | null;
  updateProgress: (lessonsCompleted: number) => Promise<void>;
  completeLesson: (lessonId: number) => Promise<void>;
}

/**
 * Hook customizado para gerenciar dados do curso
 * 
 * Exemplo de uso:
 * ```
 * const { course, loading, error } = useCourse(1);
 * ```
 * 
 * IMPORTANTE: Substitua a implementação mockada pelas chamadas de API real
 */
export function useCourse(courseId: number): UseCourseReturn {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        
        // TODO: Substituir por chamada de API real
        // const response = await fetch(`/api/courses/${courseId}`);
        // if (!response.ok) throw new Error('Curso não encontrado');
        // const data: Course = await response.json();
        
        // Mock data (remover em produção)
        await new Promise(resolve => setTimeout(resolve, 500));
        setCourse(courseData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao buscar curso');
        setCourse(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  const updateProgress = async (lessonsCompleted: number) => {
    try {
      // TODO: Implementar chamada para API de atualização de progresso
      // const response = await fetch(`/api/progress/${courseId}`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ lessonsCompleted })
      // });
      
      // Mock update
      if (course) {
        setCourse({
          ...course,
          completedLessons: lessonsCompleted,
          progress: Math.round((lessonsCompleted / course.totalLessons) * 100)
        });
      }
    } catch (err) {
      console.error('Erro ao atualizar progresso:', err);
    }
  };

  const completeLesson = async (lessonId: number) => {
    try {
      // TODO: Implementar chamada para API de conclusão de aula
      // const response = await fetch(`/api/lessons/${lessonId}/complete`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' }
      // });
      
      // Mock completion
      if (course) {
        const updatedLessons = course.lessons.map(lesson =>
          lesson.id === lessonId ? { ...lesson, completed: true } : lesson
        );
        const completedCount = updatedLessons.filter(l => l.completed).length;
        
        setCourse({
          ...course,
          lessons: updatedLessons,
          completedLessons: completedCount,
          progress: Math.round((completedCount / course.totalLessons) * 100)
        });
      }
    } catch (err) {
      console.error('Erro ao marcar aula como concluída:', err);
    }
  };

  return {
    course,
    loading,
    error,
    updateProgress,
    completeLesson
  };
}
