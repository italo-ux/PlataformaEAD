import { useEffect, useState } from "react";
import type { Course } from "../data/courseData";
import courseService from "../services/courseService";

interface UseCourseReturn {
  course: Course | null;
  loading: boolean;
  error: string | null;
  updateProgress: (lessonsCompleted: number) => Promise<void>;
  completeLesson: (lessonId: number) => Promise<void>;
}

// Reads from the mock course service for now. Replace courseService internals
// with real API calls when the backend contract is ready.
export function useCourse(courseId: number): UseCourseReturn {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchCourse = async () => {
      try {
        setLoading(true);
        const data = await courseService.getCourse(courseId);

        if (isMounted) {
          setCourse(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Erro ao buscar curso");
          setCourse(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCourse();

    return () => {
      isMounted = false;
    };
  }, [courseId]);

  const updateProgress = async (lessonsCompleted: number) => {
    if (!course) {
      return;
    }

    const normalizedCompleted = Math.min(
      Math.max(lessonsCompleted, 0),
      course.totalLessons,
    );
    const progress = Math.round(
      (normalizedCompleted / course.totalLessons) * 100,
    );

    await courseService.updateCourseProgress(course.id, progress);
    setCourse({
      ...course,
      completedLessons: normalizedCompleted,
      progress,
    });
  };

  const completeLesson = async (lessonId: number) => {
    if (!course) {
      return;
    }

    await courseService.completeLesson(course.id, lessonId);

    const updatedLessons = course.lessons.map((lesson) =>
      lesson.id === lessonId ? { ...lesson, completed: true } : lesson,
    );
    const completedCount = updatedLessons.filter((lesson) => lesson.completed)
      .length;

    setCourse({
      ...course,
      lessons: updatedLessons,
      completedLessons: completedCount,
      progress: Math.round((completedCount / course.totalLessons) * 100),
    });
  };

  return {
    course,
    loading,
    error,
    updateProgress,
    completeLesson,
  };
}
