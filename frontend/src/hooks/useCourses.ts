import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type { Course, Lesson, CreateCourseInput, CreateLessonInput, CourseFilters } from "../types/api";

const COURSES_QUERY_KEY = ["courses"];
const COURSE_QUERY_KEY = (id: number) => ["course", id];
const COURSE_LESSONS_QUERY_KEY = (courseId: number) => ["course", courseId, "lessons"];
const LESSON_QUERY_KEY = (courseId: number, lessonId: number) => ["course", courseId, "lesson", lessonId];
const RELATED_COURSES_QUERY_KEY = (courseId: number) => ["course", courseId, "related"];

export function useCourses(filters?: CourseFilters) {
  return useQuery({
    queryKey: [...COURSES_QUERY_KEY, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status && filters.status !== "all") params.append("status", filters.status);
      if (filters?.search) params.append("search", filters.search);
      if (filters?.sort) params.append("sort", filters.sort);

      const response = await api.get<Course[]>(`/courses?${params.toString()}`);
      return response.data;
    },
  });
}

export function useCourse(courseId: number, enabled = true) {
  return useQuery({
    queryKey: COURSE_QUERY_KEY(courseId),
    queryFn: async () => {
      const response = await api.get<Course>(`/courses/${courseId}`);
      return response.data;
    },
    enabled: enabled && Number.isInteger(courseId) && courseId > 0,
  });
}

export function useCourseLessons(courseId: number, enabled = true) {
  return useQuery({
    queryKey: COURSE_LESSONS_QUERY_KEY(courseId),
    queryFn: async () => {
      const response = await api.get<Lesson[]>(`/courses/${courseId}/lessons`);
      return response.data;
    },
    enabled: enabled && Number.isInteger(courseId) && courseId > 0,
  });
}

export function useLesson(courseId: number, lessonId: number, enabled = true) {
  return useQuery({
    queryKey: LESSON_QUERY_KEY(courseId, lessonId),
    queryFn: async () => {
      const response = await api.get<Lesson>(`/courses/${courseId}/lessons/${lessonId}`);
      return response.data;
    },
    enabled: enabled && Number.isInteger(courseId) && Number.isInteger(lessonId),
  });
}

export function useRelatedCourses(courseId: number, enabled = true) {
  return useQuery({
    queryKey: RELATED_COURSES_QUERY_KEY(courseId),
    queryFn: async () => {
      const response = await api.get<Course[]>(`/courses/${courseId}/related`);
      return response.data;
    },
    enabled: enabled && Number.isInteger(courseId) && courseId > 0,
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCourseInput) => {
      const response = await api.post<Course>("/courses", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COURSES_QUERY_KEY });
    },
  });
}

export function useCreateLesson(courseId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateLessonInput) => {
      const response = await api.post<Lesson>(`/courses/${courseId}/lessons`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COURSE_LESSONS_QUERY_KEY(courseId) });
      queryClient.invalidateQueries({ queryKey: COURSE_QUERY_KEY(courseId) });
    },
  });
}

export function useCompleteLesson(courseId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lessonId: number) => {
      await api.post(`/courses/${courseId}/lessons/${lessonId}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COURSE_LESSONS_QUERY_KEY(courseId) });
      queryClient.invalidateQueries({ queryKey: COURSE_QUERY_KEY(courseId) });
      queryClient.invalidateQueries({ queryKey: COURSES_QUERY_KEY });
    },
  });
}

export function useUpdateCourseProgress(courseId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (progress: number) => {
      await api.patch(`/courses/${courseId}/progress`, { progress });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COURSE_QUERY_KEY(courseId) });
      queryClient.invalidateQueries({ queryKey: COURSES_QUERY_KEY });
    },
  });
}

export function useSubmitLessonFeedback(courseId: number) {
  return useMutation({
    mutationFn: async ({ lessonId, rating, comment }: { lessonId: number; rating: number; comment?: string }) => {
      await api.post(`/courses/${courseId}/lessons/${lessonId}/feedback`, { rating, comment });
    },
  });
}