import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CoursePlayer from "../components/CoursePlayer";
import ProgressSection from "../components/ProgressSection";
import LessonSidebar from "../components/LessonSidebar";
import TabsSection from "../components/TabsSection";
import Footer from "../components/Footer/Footer";
import { courseData } from "../data/courseData";
import type { Lesson } from "../data/courseData";
import Navbar from "../components/Navbar/navbar";

export default function CourseView() {
  const navigate = useNavigate();
  const [currentLessonId, setCurrentLessonId] = useState(
    courseData.lessons[0].id
  );

  const handleSelectLesson = (lesson: Lesson) => {
    setCurrentLessonId(lesson.id);
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePreviousLesson = () => {
    const currentIndex = courseData.lessons.findIndex(
      (l) => l.id === currentLessonId
    );
    if (currentIndex > 0) {
      handleSelectLesson(courseData.lessons[currentIndex - 1]);
    }
  };

  const handleNextLesson = () => {
    const currentIndex = courseData.lessons.findIndex(
      (l) => l.id === currentLessonId
    );
    if (currentIndex < courseData.lessons.length - 1) {
      handleSelectLesson(courseData.lessons[currentIndex + 1]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <Navbar user={null} />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Course Player & Content */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Course Player */}
            <CoursePlayer
              title={courseData.title}
              currentLesson={courseData.currentLesson}
              image={courseData.image}
              onBack={() => navigate("/courses")}
            />

            {/* Tabs Section */}
            <TabsSection
              about={courseData.about}
              instructor={courseData.instructor}
            />
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            {/* Progress Section */}
            <ProgressSection
              progress={courseData.progress}
              completedLessons={courseData.completedLessons}
              totalLessons={courseData.totalLessons}
            />

            {/* Lesson Sidebar */}
            <LessonSidebar
              title="Conteúdo do Curso"
              lessons={courseData.lessons}
              currentLessonId={currentLessonId}
              onSelectLesson={handleSelectLesson}
            />
          </div>
        </div>

        {/* Navigation at Bottom (Mobile Optimization) */}
        <div className="lg:hidden mt-8 grid grid-cols-2 gap-3">
          <button
            onClick={handlePreviousLesson}
            disabled={
              courseData.lessons.findIndex((l) => l.id === currentLessonId) ===
              0
            }
            className="px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Anterior
          </button>
          <button
            onClick={handleNextLesson}
            disabled={
              courseData.lessons.findIndex((l) => l.id === currentLessonId) ===
              courseData.lessons.length - 1
            }
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Próximo →
          </button>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
