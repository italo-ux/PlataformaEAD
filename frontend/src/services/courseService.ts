import type { Course, Lesson } from '../data/courseData';

/**
 * Serviço de API para requisições relacionadas a cursos
 * 
 * IMPORTANTE: Configure a baseURL com sua API real
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class CourseService {
  /**
   * Buscar um curso por ID
   */
  async getCourse(courseId: number): Promise<Course> {
    try {
      const response = await fetch(`${API_BASE_URL}/courses/${courseId}`);
      if (!response.ok) throw new Error('Falha ao buscar curso');
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar curso:', error);
      throw error;
    }
  }

  /**
   * Buscar todas as aulas de um curso
   */
  async getCourseLessons(courseId: number): Promise<Lesson[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/courses/${courseId}/lessons`);
      if (!response.ok) throw new Error('Falha ao buscar aulas');
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar aulas:', error);
      throw error;
    }
  }

  /**
   * Marcar uma aula como concluída
   */
  async completeLesson(courseId: number, lessonId: number): Promise<void> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/courses/${courseId}/lessons/${lessonId}/complete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      if (!response.ok) throw new Error('Falha ao marcar aula como concluída');
    } catch (error) {
      console.error('Erro ao concluir aula:', error);
      throw error;
    }
  }

  /**
   * Atualizar progresso do curso
   */
  async updateCourseProgress(courseId: number, progress: number): Promise<void> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/courses/${courseId}/progress`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ progress })
        }
      );
      if (!response.ok) throw new Error('Falha ao atualizar progresso');
    } catch (error) {
      console.error('Erro ao atualizar progresso:', error);
      throw error;
    }
  }

  /**
   * Buscar aula específica
   */
  async getLesson(courseId: number, lessonId: number): Promise<Lesson> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/courses/${courseId}/lessons/${lessonId}`
      );
      if (!response.ok) throw new Error('Falha ao buscar aula');
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar aula:', error);
      throw error;
    }
  }

  /**
   * Enviar feedback sobre uma aula
   */
  async submitLessonFeedback(
    courseId: number,
    lessonId: number,
    rating: number,
    comment?: string
  ): Promise<void> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/courses/${courseId}/lessons/${lessonId}/feedback`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ rating, comment })
        }
      );
      if (!response.ok) throw new Error('Falha ao enviar feedback');
    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
      throw error;
    }
  }
}

export default new CourseService();
