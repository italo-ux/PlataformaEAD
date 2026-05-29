import {
  addMockCourse,
  getMockCourseById,
  type Course,
  type CreateMockCourseInput,
  type Lesson,
} from "../data/courseData";

const MOCK_DELAY_MS = 250;

function waitForMock<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), MOCK_DELAY_MS);
  });
}

async function failMock(message: string): Promise<never> {
  await waitForMock(null);
  throw new Error(message);
}

// Servico de cursos mockado. Quando a API de cursos estiver pronta, troque os
// metodos internos por chamadas HTTP mantendo as assinaturas publicas.
class CourseService {
  async createCourse(courseData: CreateMockCourseInput): Promise<Course> {
    const lessonTitles = courseData.lessonTitles
      .map((lessonTitle) => lessonTitle.trim())
      .filter(Boolean);

    if (
      !courseData.title.trim() ||
      !courseData.description.trim() ||
      !courseData.about.trim() ||
      lessonTitles.length === 0
    ) {
      return failMock("Preencha os dados obrigatorios do curso");
    }

    // Hoje o curso nasce no array mockado em memoria. No backend real, este
    // ponto deve virar uma chamada HTTP autenticada feita pelo professor/admin.
    const createdCourse = addMockCourse({
      ...courseData,
      lessonTitles,
    });

    return waitForMock(createdCourse);
  }

  async getCourse(courseId: number): Promise<Course> {
    const course = getMockCourseById(courseId);

    if (!course) {
      return failMock("Curso nao encontrado");
    }

    return waitForMock(course);
  }

  async getCourseLessons(courseId: number): Promise<Lesson[]> {
    const course = getMockCourseById(courseId);

    if (!course) {
      return failMock("Curso nao encontrado");
    }

    return waitForMock(course.lessons);
  }

  async completeLesson(courseId: number, lessonId: number): Promise<void> {
    const course = getMockCourseById(courseId);
    const lessonExists = course?.lessons.some((lesson) => lesson.id === lessonId);

    if (!course || !lessonExists) {
      return failMock("Aula nao encontrada");
    }

    return waitForMock(undefined);
  }

  async updateCourseProgress(courseId: number, progress: number): Promise<void> {
    const course = getMockCourseById(courseId);

    if (!course || progress < 0 || progress > 100) {
      return failMock("Progresso invalido");
    }

    return waitForMock(undefined);
  }

  async getLesson(courseId: number, lessonId: number): Promise<Lesson> {
    const course = getMockCourseById(courseId);
    const lesson = course?.lessons.find((item) => item.id === lessonId);

    if (!lesson) {
      return failMock("Aula nao encontrada");
    }

    return waitForMock(lesson);
  }

  async submitLessonFeedback(
    courseId: number,
    lessonId: number,
    rating: number,
    comment?: string,
  ): Promise<void> {
    const course = getMockCourseById(courseId);
    const lessonExists = course?.lessons.some((lesson) => lesson.id === lessonId);

    if (!course || !lessonExists || rating < 1 || rating > 5) {
      return failMock("Feedback invalido");
    }

    void comment;
    return waitForMock(undefined);
  }
}

export default new CourseService();
