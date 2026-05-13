// Mock data - Fácil de substituir por chamadas de API
export interface Lesson {
  id: number;
  title: string;
  duration: string;
  completed: boolean;
}

export interface Instructor {
  name: string;
  bio: string;
  image?: string;
}

export interface Course {
  id: number;
  title: string;
  currentLesson: string;
  image: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  about: string;
  instructor: Instructor;
  lessons: Lesson[];
}

export const courseData: Course = {
  id: 1,
  title: "Curso de Game Development",
  currentLesson: "Introdução ao GDevelop",
  image: "https://images.unsplash.com/photo-1535655519926-e3400ca199e7?w=1200&h=600&fit=crop",
  progress: 70,
  completedLessons: 7,
  totalLessons: 10,
  about:
    "Neste curso completo de Game Development, você aprenderá desde os conceitos fundamentais até técnicas avançadas de desenvolvimento de jogos. Trabalharemos com a plataforma GDevelop, que permite criar jogos 2D e 3D sem necessidade de escrever código complexo. Você criará vários projetos práticos e terá uma base sólida para continuar sua jornada no desenvolvimento de games.",
  instructor: {
    name: "João Silva",
    bio: "Desenvolvedor de games com mais de 8 anos de experiência. Criou diversos jogos publicados em plataformas digitais. Apaixonado por educação e compartilhar conhecimento com a comunidade.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop"
  },
  lessons: [
    {
      id: 1,
      title: "Introdução ao Curso",
      duration: "10:50",
      completed: true
    },
    {
      id: 2,
      title: "Configurando o GDevelop",
      duration: "15:30",
      completed: true
    },
    {
      id: 3,
      title: "Criando seu primeiro jogo",
      duration: "22:45",
      completed: true
    },
    {
      id: 4,
      title: "Sprites e Animações",
      duration: "18:20",
      completed: true
    },
    {
      id: 5,
      title: "Sistema de Colisão",
      duration: "25:10",
      completed: true
    },
    {
      id: 6,
      title: "Lógica e Comportamentos",
      duration: "28:50",
      completed: true
    },
    {
      id: 7,
      title: "Introdução ao GDevelop",
      duration: "20:15",
      completed: true
    },
    {
      id: 8,
      title: "Som e Música",
      duration: "16:30",
      completed: false
    },
    {
      id: 9,
      title: "UI e Menus",
      duration: "24:00",
      completed: false
    },
    {
      id: 10,
      title: "Publicando seu jogo",
      duration: "12:40",
      completed: false
    }
  ]
};
