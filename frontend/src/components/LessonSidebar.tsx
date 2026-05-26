import { CheckCircle, Circle } from "lucide-react";
import type { Lesson } from "../data/courseData";

interface LessonSidebarProps {
  title: string;
  lessons: Lesson[];
  currentLessonId?: number;
  onSelectLesson?: (lesson: Lesson) => void;
}

export default function LessonSidebar({
  title,
  lessons,
  currentLessonId,
  onSelectLesson,
}: LessonSidebarProps) {
  return (
    <div className="flex h-[258px] flex-col overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
      <h3 className="px-4 pb-2 pt-4 text-sm font-black text-gray-900">
        {title}
      </h3>

      <div className="flex flex-col gap-1 overflow-y-auto px-4 pb-4">
        {lessons.map((lesson, index) => (
          <button
            key={lesson.id}
            onClick={() => onSelectLesson?.(lesson)}
            className={`flex items-start gap-2 rounded-md border p-2 text-left transition ${
              currentLessonId === lesson.id
                ? "border-blue-200 bg-blue-50"
                : "border-transparent hover:bg-gray-50"
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {lesson.completed ? (
                <CheckCircle size={16} className="fill-green-50 text-green-500" />
              ) : (
                <Circle
                  size={16}
                  className={
                    currentLessonId === lesson.id
                      ? "text-blue-400"
                      : "text-gray-300"
                  }
                />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p
                className={`truncate text-xs font-medium ${
                  currentLessonId === lesson.id
                    ? "text-blue-600"
                    : "text-gray-900"
                }`}
              >
                {lesson.title}
              </p>
              <p className="mt-1 text-[10px] text-gray-500">
                {lesson.duration}
              </p>
            </div>

            <span className="shrink-0 text-[10px] font-bold text-gray-400">
              {index + 1}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
