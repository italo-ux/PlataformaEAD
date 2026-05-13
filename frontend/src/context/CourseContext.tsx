import { createContext, useState, useContext, type ReactNode } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

interface CourseContextType {
  currentCourseId: number | null;
  setCurrentCourseId: (id: number) => void;
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  logout: () => void;
}

const CourseContext = createContext<CourseContextType | undefined>(undefined);

export function CourseProvider({ children }: { children: ReactNode }) {
  const [currentCourseId, setCurrentCourseId] = useState<number | null>(1);
  const [user, setUser] = useState<User | null>(null);

  const isAuthenticated = user !== null;

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
        isAuthenticated,
        logout
      }}
    >
      {children}
    </CourseContext.Provider>
  );
}

export function useCourseContext() {
  const context = useContext(CourseContext);
  if (context === undefined) {
    throw new Error('useCourseContext deve ser usado dentro de CourseProvider');
  }
  return context;
}
