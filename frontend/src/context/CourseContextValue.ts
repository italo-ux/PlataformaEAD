import { createContext } from "react";

export interface CourseContextUser {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

export interface CourseContextType {
  currentCourseId: number | null;
  setCurrentCourseId: (id: number | null) => void;
  user: CourseContextUser | null;
  setUser: (user: CourseContextUser | null) => void;
  isAuthenticated: boolean;
  logout: () => void;
}

export const CourseContext = createContext<CourseContextType | undefined>(
  undefined,
);
