import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CoursePlayer from "../components/CoursePlayer";
import Footer from "../components/Footer/Footer";
import LessonSidebar from "../components/LessonSidebar";
import Navbar from "../components/Navbar/Navbar";
import ProgressSection from "../components/ProgressSection";
import TabsSection from "../components/TabsSection";
import {
  getCourseInstructors,
  getMockCourseById,
  getRelatedMockCourses,
  type Lesson,
} from "../data/courseData";
import { getAuthenticatedUser } from "../services/userService";

export default function CourseView() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const user = getAuthenticatedUser();
  const parsedCourseId = Number(courseId);
  const course = Number.isInteger(parsedCourseId)
    ? getMockCourseById(parsedCourseId)
    : null;
  const [lessonSelection, setLessonSelection] = useState<{
    courseId: number | null;
    lessonId: number | null;
  }>({ courseId: null, lessonId: null });
  const selectedLessonId =
    lessonSelection.courseId === course?.id ? lessonSelection.lessonId : null;

  const currentLesson =
    course?.lessons.find((lesson) => lesson.id === selectedLessonId) ??
    course?.lessons[0] ??
    null;
  const currentLessonIndex =
    course && currentLesson
      ? course.lessons.findIndex((lesson) => lesson.id === currentLesson.id)
      : -1;

  const handleSelectLesson = (lesson: Lesson) => {
    setLessonSelection({
      courseId: course?.id ?? null,
      lessonId: lesson.id,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePreviousLesson = () => {
    if (course && currentLessonIndex > 0) {
      handleSelectLesson(course.lessons[currentLessonIndex - 1]);
    }
  };

  const handleNextLesson = () => {
    if (course && currentLessonIndex < course.lessons.length - 1) {
      handleSelectLesson(course.lessons[currentLessonIndex + 1]);
    }
  };

  if (!course) {
    return (
      <div className="flex min-h-screen flex-col bg-[#f7f7f7]">
        <Navbar user={user} />
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
          <h1 className="text-3xl font-black text-[#25304a]">
            Curso nao encontrado
          </h1>
          <p className="mt-3 text-gray-600">
            Este curso nao existe na lista mockada atual.
          </p>
          <button
            onClick={() => navigate("/home#cursos")}
            className="mt-8 rounded-md bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            Voltar para cursos
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  const relatedCourses = getRelatedMockCourses(course.id);

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f7f7]">
      <Navbar user={user} />

      <main className="mx-auto w-full max-w-[1120px] flex-1 px-4 py-7 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_330px] lg:items-start">
          <div className="space-y-4">
            {currentLesson && (
              <CoursePlayer
                title={course.title}
                currentLesson={currentLesson.title}
                lessonContent={currentLesson.content}
                lessonDuration={currentLesson.duration}
                image={course.image}
                onBack={() => navigate("/home#cursos")}
              />
            )}

            <ProgressSection
              progress={course.progress}
              completedLessons={course.completedLessons}
              totalLessons={course.totalLessons}
            />
          </div>

          <aside className="space-y-4 pt-7">
            <div className="flex justify-end gap-2">
              <button
                onClick={handlePreviousLesson}
                disabled={currentLessonIndex <= 0}
                className="rounded-md border border-blue-600 bg-white px-4 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Item anterior
              </button>
              <button
                onClick={handleNextLesson}
                disabled={currentLessonIndex >= course.lessons.length - 1}
                className="rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Proximo item
              </button>
            </div>

            <LessonSidebar
              title="Conteudo do Curso"
              lessons={course.lessons}
              currentLessonId={currentLesson?.id}
              onSelectLesson={handleSelectLesson}
            />
          </aside>
        </div>

        <section className="mt-7 max-w-[760px]">
          <TabsSection
            about={course.about}
            instructors={getCourseInstructors(course)}
          />
        </section>

        <section className="mt-6 max-w-[760px]">
          <h2 className="mb-3 px-1 text-lg font-black text-gray-900">
            Cursos relacionados
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {relatedCourses.map((relatedCourse) => (
              <button
                key={relatedCourse.id}
                onClick={() => navigate(`/courses/${relatedCourse.id}`)}
                className="overflow-hidden rounded-sm bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <img
                  src={relatedCourse.image}
                  alt={relatedCourse.title}
                  className="h-16 w-full object-cover"
                />
                <p className="px-3 py-2 text-xs font-bold text-gray-900">
                  {relatedCourse.title}
                </p>
              </button>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
