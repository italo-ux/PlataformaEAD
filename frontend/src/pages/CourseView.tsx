import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PlusCircle } from "lucide-react";
import CoursePlayer from "../components/CoursePlayer";
import Footer from "../components/Footer/Footer";
import LessonSidebar from "../components/LessonSidebar";
import Navbar from "../components/Navbar/Navbar";
import ProgressSection from "../components/ProgressSection";
import TabsSection from "../components/TabsSection";
import {
  formatCourseInstructorNames,
  getCourseInstructors,
  getMockCourseById,
  getRelatedMockCourses,
  type Lesson,
} from "../data/courseData";
import courseService from "../services/courseService";
import { getAuthenticatedUser } from "../services/userService";

const emptyLessonForm = {
  title: "",
  duration: "",
  content: "",
  videoName: "",
  videoUrl: "",
};

function canManageCourseLessons(
  user: ReturnType<typeof getAuthenticatedUser>,
  course: NonNullable<ReturnType<typeof getMockCourseById>>,
) {
  if (!user) {
    return false;
  }

  if (user.role === "admin") {
    return true;
  }

  if (user.role !== "professor") {
    return false;
  }

  return getCourseInstructors(course).some(
    (instructor) =>
      instructor.id === user.id ||
      instructor.email?.toLowerCase() === user.email.toLowerCase(),
  );
}

export default function CourseView() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const user = getAuthenticatedUser();
  const parsedCourseId = Number(courseId);
  const course = Number.isInteger(parsedCourseId)
    ? getMockCourseById(parsedCourseId)
    : null;
  const [, setLessonListVersion] = useState(0);
  const [lessonSelection, setLessonSelection] = useState<{
    courseId: number | null;
    lessonId: number | null;
  }>({ courseId: null, lessonId: null });
  const [isLessonFormOpen, setIsLessonFormOpen] = useState(false);
  const [lessonForm, setLessonForm] = useState(emptyLessonForm);
  const [lessonFormError, setLessonFormError] = useState("");
  const [lessonFormStatus, setLessonFormStatus] = useState("");
  const [isSavingLesson, setIsSavingLesson] = useState(false);
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

  const handleLessonFormChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;

    setLessonForm((current) => ({
      ...current,
      [name]: value,
    }));
    setLessonFormError("");
    setLessonFormStatus("");
  };

  const handleLessonVideoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      setLessonForm((current) => ({
        ...current,
        videoName: "",
        videoUrl: "",
      }));
      return;
    }

    if (!file.type.startsWith("video/")) {
      setLessonFormError("Selecione um arquivo de vídeo válido.");
      event.target.value = "";
      return;
    }

    setLessonForm((current) => {
      if (current.videoUrl) {
        URL.revokeObjectURL(current.videoUrl);
      }

      return {
        ...current,
        videoName: file.name,
        videoUrl: URL.createObjectURL(file),
      };
    });
    setLessonFormError("");
    setLessonFormStatus("");
  };

  const handleSubmitLesson = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!course) {
      return;
    }

    setLessonFormError("");
    setLessonFormStatus("");
    setIsSavingLesson(true);

    try {
      const createdLesson = await courseService.createLesson(course.id, {
        title: lessonForm.title,
        duration: lessonForm.duration,
        content: lessonForm.content,
        videoName: lessonForm.videoName,
        videoUrl: lessonForm.videoUrl,
      });

      setLessonForm(emptyLessonForm);
      setLessonFormStatus("Aula adicionada ao curso com sucesso.");
      setLessonListVersion((current) => current + 1);
      handleSelectLesson(createdLesson);
    } catch (error) {
      setLessonFormError(
        error instanceof Error
          ? error.message
          : "Não foi possível adicionar a aula.",
      );
    } finally {
      setIsSavingLesson(false);
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
            Este curso não existe na lista mockada atual.
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
  const canAddLesson = canManageCourseLessons(user, course);

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
                lessonVideoName={currentLesson.videoName}
                lessonVideoUrl={currentLesson.videoUrl}
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
            {canAddLesson && (
              <div className="rounded-md border border-blue-100 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-gray-900">
                      Gerenciar aulas
                    </p>
                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      {user?.role === "admin"
                        ? "Acesso administrativo as aulas adicionadas."
                        : `Professor responsável: ${formatCourseInstructorNames(course)}.`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setIsLessonFormOpen((currentValue) => !currentValue)
                    }
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-blue-600 px-3 text-xs font-bold text-white transition hover:bg-blue-700"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Aula
                  </button>
                </div>

                {isLessonFormOpen && (
                  <form onSubmit={handleSubmitLesson} className="mt-4 space-y-3">
                    {lessonFormError && (
                      <div className="rounded-md bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                        {lessonFormError}
                      </div>
                    )}
                    {lessonFormStatus && (
                      <div className="rounded-md bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                        {lessonFormStatus}
                      </div>
                    )}

                    <div>
                      <label
                        htmlFor="lesson-title"
                        className="mb-1 block text-xs font-bold text-gray-700"
                      >
                        Título da aula
                      </label>
                      <input
                        id="lesson-title"
                        name="title"
                        value={lessonForm.title}
                        onChange={handleLessonFormChange}
                        placeholder="Ex: Introducao ao modulo"
                        className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="lesson-duration"
                        className="mb-1 block text-xs font-bold text-gray-700"
                      >
                        Duração
                      </label>
                      <input
                        id="lesson-duration"
                        name="duration"
                        value={lessonForm.duration}
                        onChange={handleLessonFormChange}
                        placeholder="Ex: 12:30"
                        className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="lesson-content"
                        className="mb-1 block text-xs font-bold text-gray-700"
                      >
                        Conteúdo
                      </label>
                      <textarea
                        id="lesson-content"
                        name="content"
                        value={lessonForm.content}
                        onChange={handleLessonFormChange}
                        placeholder="Descreva o conteúdo, material ou orientação da aula"
                        className="min-h-24 w-full resize-y rounded-md border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="lesson-video"
                        className="mb-1 block text-xs font-bold text-gray-700"
                      >
                        Vídeo local da aula
                      </label>
                      <input
                        id="lesson-video"
                        type="file"
                        accept="video/*"
                        onChange={handleLessonVideoChange}
                        className="block w-full cursor-pointer rounded-md border border-gray-200 text-xs text-gray-600 file:mr-3 file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-xs file:font-bold file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {lessonForm.videoName && (
                        <p className="mt-2 truncate text-xs font-semibold text-slate-500">
                          Selecionado: {lessonForm.videoName}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingLesson}
                      className="inline-flex h-10 w-full items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSavingLesson ? "Salvando..." : "Adicionar aula"}
                    </button>
                  </form>
                )}
              </div>
            )}

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
                Próximo item
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
