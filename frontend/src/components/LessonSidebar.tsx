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
  onSelectLesson
}: LessonSidebarProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col h-fit max-h-96 overflow-y-auto">
      <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>

      {/* Lessons List */}
      <div className="flex flex-col gap-2">
        {lessons.map((lesson, index) => (
          <button
            key={lesson.id}
            onClick={() => onSelectLesson?.(lesson)}
            className={`flex items-start gap-3 p-3 rounded-lg transition text-left ${
              currentLessonId === lesson.id
                ? "bg-blue-50 border border-blue-200"
                : "hover:bg-gray-50 border border-transparent"
            }`}
          >
            {/* Status Icon */}
            <div className="mt-1 flex-shrink-0">
              {lesson.completed ? (
                <CheckCircle
                  size={20}
                  className="text-green-500 fill-green-50"
                />
              ) : (
                <Circle
                  size={20}
                  className={`text-gray-300 ${
                    currentLessonId === lesson.id
                      ? "text-blue-400"
                      : "text-gray-300"
                  }`}
                />
              )}
            </div>

            {/* Lesson Info */}
            <div className="flex-1 min-w-0">
              <p
                className={`font-medium text-sm truncate ${
                  currentLessonId === lesson.id
                    ? "text-blue-600"
                    : "text-gray-900"
                }`}
              >
                {lesson.title}
              </p>
              <p className="text-xs text-gray-500 mt-1">{lesson.duration}</p>
            </div>

            {/* Lesson Number */}
            <span className="text-xs font-bold text-gray-400 flex-shrink-0">
              {index + 1}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
