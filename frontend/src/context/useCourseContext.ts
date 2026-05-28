import { useContext } from "react";
import { CourseContext } from "./CourseContextValue";

export function useCourseContext() {
  const context = useContext(CourseContext);

  if (context === undefined) {
    throw new Error("useCourseContext deve ser usado dentro de CourseProvider");
  }

  return context;
}
