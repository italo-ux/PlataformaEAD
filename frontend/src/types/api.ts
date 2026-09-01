export type UserRole = "aluno" | "professor" | "admin";

export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  cpf?: string;
  phone?: string;
  role: UserRole;
  createdAt?: string;
}

export interface UserPermissions {
  canAccessCourses: boolean;
  canAccessPerformance: boolean;
  canCreateCourses: boolean;
  canCreateTeachers: boolean;
}

export interface Lesson {
  id: number;
  courseId: number;
  title: string;
  duration: string;
  completed: boolean;
  content: string;
  videoUrl?: string;
  videoName?: string;
  order: number;
  createdAt?: string;
}

export interface Instructor {
  id?: number;
  name: string;
  email?: string;
  bio: string;
  image?: string;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  image: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  about: string;
  instructor: Instructor;
  instructors?: Instructor[];
  lessons: Lesson[];
  createdAt?: string;
  updatedAt?: string;
}

export interface LearningTrail {
  id: string;
  slug: string;
  nome: string;
  descricao: string;
  capa: string;
  accentColor: string;
  courseIds: number[];
}

export interface LearningTrailWithCourses extends LearningTrail {
  courses: Course[];
  progress: number;
  completedLessons: number;
  totalLessons: number;
  completedCourses: number;
}

export interface CreateCourseInput {
  title: string;
  description: string;
  image?: string;
  about: string;
  instructorIds?: number[];
  lessonTitles: string[];
}

export interface CreateLessonInput {
  title: string;
  duration: string;
  content: string;
  videoUrl?: string;
  videoName?: string;
}

export interface UpdateProfileInput {
  name: string;
  email: string;
  avatar?: string;
  cpf?: string;
  phone?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  nextPassword: string;
}

export interface CourseFilters {
  status?: "all" | "in-progress" | "not-started" | "completed";
  search?: string;
  sort?: "recommended" | "progress-desc" | "progress-asc" | "title";
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}