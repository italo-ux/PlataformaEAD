import {
  getMockCourseById,
  type Course,
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

// Mock course service. Swap these methods for fetch/HTTP client calls when the
// backend course API is available.
class CourseService {
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
