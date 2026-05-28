import { useState, type ReactNode } from "react";
import {
  CourseContext,
  type CourseContextUser,
} from "./CourseContextValue";

export function CourseProvider({ children }: { children: ReactNode }) {
  const [currentCourseId, setCurrentCourseId] = useState<number | null>(1);
  const [user, setUser] = useState<CourseContextUser | null>(null);

  const logout = () => {
    setUser(null);
    setCurrentCourseId(null);
  };

  return (
    <CourseContext.Provider
      value={{
        currentCourseId,
        setCurrentCourseId,
        user,
        setUser,
        isAuthenticated: user !== null,
        logout,
      }}
    >
      {children}
    </CourseContext.Provider>
  );
}
