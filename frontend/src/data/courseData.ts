// Mocks de cursos usados apenas no frontend. Quando os endpoints do backend
// estiverem prontos, troque estes helpers por chamadas reais de API.
export interface Lesson {
  id: number;
  title: string;
  duration: string;
  completed: boolean;
  content: string;
  videoUrl?: string;
  videoName?: string;
}

export interface Instructor {
  id?: number;
  name: string;
  email?: string;
  bio: string;
  image?: string;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  image: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  about: string;
  instructor: Instructor;
  instructors?: Instructor[];
  lessons: Lesson[];
}

export interface LearningTrail {
  id: string;
  slug: string;
  nome: string;
  descricao: string;
  capa: string;
  accentColor: string;
  courseIds: number[];
}

export interface LearningTrailWithCourses extends LearningTrail {
  courses: Course[];
  progress: number;
  completedLessons: number;
  totalLessons: number;
  completedCourses: number;
}

export interface CreateMockCourseInput {
  title: string;
  description: string;
  image?: string;
  about: string;
  instructor?: Instructor;
  instructors?: Instructor[];
  lessonTitles: string[];
}

export interface CreateMockLessonInput {
  title: string;
  duration: string;
  content: string;
  videoUrl?: string;
  videoName?: string;
}

export const mockCourses: Course[] = [
  {
    id: 1,
    title: "Curso de Game Development",
    description:
      "Aprenda a criar jogos 2D e 3D com lógica visual, protótipos e experiências interativas.",
    image:
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&h=680&fit=crop",
    progress: 70,
    completedLessons: 7,
    totalLessons: 10,
    about:
      "Neste curso de Game Development, você aprende fundamentos de jogos, construção de cenas, eventos, sprites, menus e publicação. Todo o fluxo usa exemplos práticos para transformar uma ideia simples em um protótipo jogável.",
    instructor: {
      id: 2,
      name: "Professor Tecnologia",
      email: "professor@plataforma.com",
      bio: "Desenvolvedor de games com mais de 8 anos de experiência em projetos educativos e jogos publicados em plataformas digitais.",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    },
    lessons: [
      {
        id: 1,
        title: "Introdução ao Curso",
        duration: "10:50",
        completed: true,
        content:
          "Visão geral da jornada, ferramentas usadas e resultado esperado ao final do curso.",
      },
      {
        id: 2,
        title: "Configurando o GDevelop",
        duration: "15:30",
        completed: true,
        content:
          "Instalação, criação do primeiro projeto e organização inicial das cenas.",
      },
      {
        id: 3,
        title: "Criando seu primeiro jogo",
        duration: "22:45",
        completed: true,
        content:
          "Montagem do primeiro personagem, objetivo do jogo e controles básicos.",
      },
      {
        id: 4,
        title: "Sprites e Animações",
        duration: "18:20",
        completed: true,
        content:
          "Preparação dos assets, estados de animação e troca de sprites durante a partida.",
      },
      {
        id: 5,
        title: "Sistema de Colisão",
        duration: "25:10",
        completed: true,
        content:
          "Como detectar contato entre objetos e transformar colisões em regras de jogo.",
      },
      {
        id: 6,
        title: "Lógica e Comportamentos",
        duration: "28:50",
        completed: true,
        content:
          "Uso de eventos, condições e comportamentos para criar interações reutilizáveis.",
      },
      {
        id: 7,
        title: "Pontuação e Feedback",
        duration: "20:15",
        completed: true,
        content:
          "Criação de HUD, pontos, mensagens de acerto e retorno visual para o jogador.",
      },
      {
        id: 8,
        title: "Som e Música",
        duration: "16:30",
        completed: false,
        content:
          "Adição de efeitos sonoros, trilhas e ajustes de volume para melhorar a experiência.",
      },
      {
        id: 9,
        title: "UI e Menus",
        duration: "24:00",
        completed: false,
        content:
          "Construção de telas de início, pausa, fim de jogo e navegação entre cenas.",
      },
      {
        id: 10,
        title: "Publicando seu jogo",
        duration: "12:40",
        completed: false,
        content:
          "Checklist final, exportação do projeto e preparação para compartilhar o jogo.",
      },
    ],
  },
  {
    id: 2,
    title: "Web Development",
    description:
      "Domine React, TypeScript e arquitetura moderna para aplicações escaláveis.",
    image:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&h=680&fit=crop",
    progress: 45,
    completedLessons: 4,
    totalLessons: 9,
    about:
      "Uma trilha para evoluir interfaces React com componentes bem tipados, roteamento, estado local, consumo de dados mockados e preparação para APIs reais.",
    instructor: {
      name: "Maria Santos",
      bio: "Engenheira front-end focada em React, TypeScript e design systems para produtos educacionais.",
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    },
    lessons: [
      {
        id: 1,
        title: "Arquitetura do projeto",
        duration: "14:10",
        completed: true,
        content:
          "Organização de pastas, responsabilidade dos componentes e convenções de importação.",
      },
      {
        id: 2,
        title: "Componentes reutilizáveis",
        duration: "18:40",
        completed: true,
        content:
          "Criação de componentes de interface com props claras e comportamento previsível.",
      },
      {
        id: 3,
        title: "Rotas com parâmetros",
        duration: "21:00",
        completed: true,
        content:
          "Uso de parâmetros de rota para abrir telas dinâmicas como detalhes de curso.",
      },
      {
        id: 4,
        title: "Estado local com hooks",
        duration: "19:25",
        completed: true,
        content:
          "Padrões para formulários, listas, seleção de itens e estados de carregamento.",
      },
      {
        id: 5,
        title: "Serviços mockados",
        duration: "16:55",
        completed: false,
        content:
          "Como simular chamadas de API sem acoplar a interface ao backend ainda inexistente.",
      },
      {
        id: 6,
        title: "Tratamento de erros",
        duration: "13:45",
        completed: false,
        content:
          "Mensagens claras para o usuário e separação entre erros de campo e erros gerais.",
      },
      {
        id: 7,
        title: "Build e lint",
        duration: "12:20",
        completed: false,
        content:
          "Verificações antes do commit e como evitar falhas específicas de ambiente.",
      },
      {
        id: 8,
        title: "Preparando integração real",
        duration: "17:05",
        completed: false,
        content:
          "Pontos de troca entre mocks e endpoints reais com menor impacto na interface.",
      },
      {
        id: 9,
        title: "Revisão final",
        duration: "09:30",
        completed: false,
        content:
          "Checklist para revisar acessibilidade, rotas, estados vazios e comportamento mobile.",
      },
    ],
  },
  {
    id: 3,
    title: "UX/UI Design",
    description:
      "Crie interfaces claras, prototipos navegaveis e experiencias digitais memoraveis.",
    image:
      "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1200&h=680&fit=crop",
    progress: 0,
    completedLessons: 0,
    totalLessons: 6,
    about:
      "Curso introdutório de UX/UI para estruturar problemas, desenhar fluxos, criar telas e validar ideias com usuários antes da implementação.",
    instructor: {
      name: "Carlos Lima",
      bio: "Designer de produto com experiência em pesquisas, protótipos e interfaces para serviços públicos digitais.",
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
    },
    lessons: [
      {
        id: 1,
        title: "Fundamentos de UX",
        duration: "11:20",
        completed: false,
        content:
          "Conceitos essenciais para entender necessidades, contexto e objetivos do usuário.",
      },
      {
        id: 2,
        title: "Mapeando jornadas",
        duration: "15:15",
        completed: false,
        content:
          "Organização de etapas, dores e oportunidades em uma jornada de aprendizagem.",
      },
      {
        id: 3,
        title: "Wireframes",
        duration: "18:00",
        completed: false,
        content:
          "Desenho de estrutura e hierarquia antes de aplicar detalhes visuais.",
      },
      {
        id: 4,
        title: "Design visual",
        duration: "22:10",
        completed: false,
        content:
          "Uso de cor, tipografia, espaçamento e componentes para melhorar clareza.",
      },
      {
        id: 5,
        title: "Prototipagem",
        duration: "20:35",
        completed: false,
        content:
          "Conexão entre telas e simulação de fluxos principais antes do desenvolvimento.",
      },
      {
        id: 6,
        title: "Teste com usuários",
        duration: "16:45",
        completed: false,
        content:
          "Planejamento de teste simples, coleta de feedback e ajustes de interface.",
      },
    ],
  },
  {
    id: 4,
    title: "Data Science com Python",
    description:
      "Explore análise de dados, machine learning e visualizações com projetos práticos.",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=680&fit=crop",
    progress: 30,
    completedLessons: 3,
    totalLessons: 8,
    about:
      "Uma introdução prática a ciência de dados usando Python, leitura de bases, limpeza, gráficos e modelos simples para apoiar decisões.",
    instructor: {
      name: "Ana Silva",
      bio: "Cientista de dados e educadora, com foco em tornar análise e automação acessíveis para diferentes perfis de alunos.",
      image:
        "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop",
    },
    lessons: [
      {
        id: 1,
        title: "Ambiente Python",
        duration: "12:00",
        completed: true,
        content:
          "Preparação do ambiente, notebooks e bibliotecas usadas na trilha.",
      },
      {
        id: 2,
        title: "Leitura de dados",
        duration: "17:20",
        completed: true,
        content:
          "Importação de arquivos, inspeção inicial e entendimento das colunas.",
      },
      {
        id: 3,
        title: "Limpeza de dados",
        duration: "21:10",
        completed: true,
        content:
          "Tratamento de valores ausentes, duplicados e padronização de formatos.",
      },
      {
        id: 4,
        title: "Analise exploratória",
        duration: "24:40",
        completed: false,
        content:
          "Uso de estatísticas simples para encontrar padrões e levantar hipóteses.",
      },
      {
        id: 5,
        title: "Visualizações",
        duration: "19:50",
        completed: false,
        content:
          "Criação de gráficos que comunicam dados com clareza e contexto.",
      },
      {
        id: 6,
        title: "Modelo preditivo simples",
        duration: "27:30",
        completed: false,
        content:
          "Treinamento de um modelo básico e avaliação inicial de resultados.",
      },
      {
        id: 7,
        title: "Apresentando resultados",
        duration: "14:20",
        completed: false,
        content:
          "Como organizar achados, limitações e próximos passos em uma narrativa.",
      },
      {
        id: 8,
        title: "Projeto final",
        duration: "32:15",
        completed: false,
        content:
          "Aplicação completa do fluxo de ciência de dados em um pequeno case.",
      },
    ],
  },
];

export const courseData = mockCourses[0];

export const mockLearningTrails: LearningTrail[] = [
  {
    id: "trilha-projeto-inova-inclusao-digital",
    slug: "projeto-inova-inclusao-digital",
    nome: "Projeto Inova Inclusão Digital",
    descricao:
      "Formação para ampliar acesso, autonomia e fluencia digital em ferramentas, interfaces e dados.",
    capa:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&h=680&fit=crop",
    accentColor: "#e6a100",
    courseIds: [1, 2, 3, 4],
  },
  {
    id: "trilha-escola-de-games",
    slug: "escola-de-games",
    nome: "Escola de Games",
    descricao:
      "Aprendizagem prática para criar jogos digitais, protótipos interativos e experiências imersivas.",
    capa:
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&h=680&fit=crop",
    accentColor: "#8b1fd1",
    courseIds: [1, 2, 3, 4],
  },
  {
    id: "trilha-projeto-inova-elas-empreendedorismo",
    slug: "projeto-inova-elas-empreendedorismo",
    nome: "Projeto Inova + Elas Empreendedorismo",
    descricao:
      "Jornada para fortalecer ideias, comunicação digital, protótipos e tomada de decisão para empreender.",
    capa:
      "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1200&h=680&fit=crop",
    accentColor: "#e50046",
    courseIds: [1, 2, 3, 4],
  },
  {
    id: "trilha-talentos-estagiarios-prefeitura",
    slug: "talentos-estagiarios-prefeitura",
    nome: "Desenvolvimento de Talentos Estagiários Prefeitura",
    descricao:
      "Formação para estagiários desenvolverem competências digitais, analíticas e de produto no serviço público.",
    capa:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=680&fit=crop",
    accentColor: "#22a915",
    courseIds: [1, 2, 3, 4],
  },
  {
    id: "trilha-techgov",
    slug: "techgov",
    nome: "TechGov",
    descricao:
      "Capacitação em tecnologia aplicada ao governo, dados, plataformas digitais e melhoria de processos públicos.",
    capa:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&h=680&fit=crop",
    accentColor: "#0a7a8f",
    courseIds: [1, 2, 3, 4],
  },
  {
    id: "trilha-expansao-ead-secretarias",
    slug: "expansao-ead-secretarias",
    nome: "Expansão do Programa EAD as Secretárias",
    descricao:
      "Apoio a secretarias na ampliação do EAD com organização de conteúdo, trilhas e experiências digitais.",
    capa:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=680&fit=crop",
    accentColor: "#0a8ea3",
    courseIds: [1, 2, 3, 4],
  },
];

const fallbackCourseImage =
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&h=680&fit=crop";

export function getMockCourseById(courseId: number) {
  return mockCourses.find((course) => course.id === courseId) ?? null;
}

export function getCourseInstructors(course: Course) {
  return course.instructors && course.instructors.length > 0
    ? course.instructors
    : [course.instructor];
}

export function formatCourseInstructorNames(course: Course) {
  return getCourseInstructors(course)
    .map((instructor) => instructor.name)
    .join(", ");
}

export function getCoursesForTrail(trail: LearningTrail) {
  return trail.courseIds
    .map((courseId) => getMockCourseById(courseId))
    .filter((course): course is Course => Boolean(course));
}

export function getMockTrailsWithCourses(): LearningTrailWithCourses[] {
  return mockLearningTrails.map((trail) => {
    const courses = getCoursesForTrail(trail);
    const totalLessons = courses.reduce(
      (total, course) => total + course.totalLessons,
      0,
    );
    const completedLessons = courses.reduce(
      (total, course) => total + course.completedLessons,
      0,
    );
    const completedCourses = courses.filter(
      (course) => course.progress >= 100,
    ).length;

    return {
      ...trail,
      courses,
      progress:
        totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0,
      completedLessons,
      totalLessons,
      completedCourses,
    };
  });
}

export function getMockTrailBySlug(trailSlug: string) {
  return (
    getMockTrailsWithCourses().find((trail) => trail.slug === trailSlug) ??
    null
  );
}

export function getRelatedMockCourses(courseId: number, limit = 3) {
  return mockCourses
    .filter((course) => course.id !== courseId)
    .slice(0, limit);
}

let nextMockCourseId = Math.max(...mockCourses.map((course) => course.id)) + 1;

// Criacao somente em memoria para desenvolvimento local. Quando o backend de
// cursos existir, esta funcao deve ser substituida por POST /cursos ou similar.
export function addMockCourse(input: CreateMockCourseInput) {
  const instructors =
    input.instructors && input.instructors.length > 0
      ? input.instructors
      : input.instructor
        ? [input.instructor]
        : [];
  const primaryInstructor = instructors[0] ?? {
    name: "Professor não informado",
    bio: "Professor responsável ainda não vinculado no mock.",
  };

  const lessons: Lesson[] = input.lessonTitles.map((title, index) => ({
    id: index + 1,
    title: title.trim(),
    duration: "00:00",
    completed: false,
    content:
      "Conteúdo mockado temporário. O backend futuro deve enviar a descrição, vídeo e materiais desta aula.",
  }));

  const createdCourse: Course = {
    id: nextMockCourseId,
    title: input.title.trim(),
    description: input.description.trim(),
    image: input.image?.trim() || fallbackCourseImage,
    progress: 0,
    completedLessons: 0,
    totalLessons: lessons.length,
    about: input.about.trim(),
    instructor: primaryInstructor,
    instructors,
    lessons,
  };

  nextMockCourseId += 1;
  mockCourses.push(createdCourse);

  return createdCourse;
}

export function addMockLesson(courseId: number, input: CreateMockLessonInput) {
  const course = getMockCourseById(courseId);

  if (!course) {
    return null;
  }

  const nextLessonId =
    Math.max(0, ...course.lessons.map((lesson) => lesson.id)) + 1;
  const lesson: Lesson = {
    id: nextLessonId,
    title: input.title.trim(),
    duration: input.duration.trim() || "00:00",
    completed: false,
    content: input.content.trim(),
    videoUrl: input.videoUrl,
    videoName: input.videoName,
  };

  course.lessons.push(lesson);
  course.totalLessons = course.lessons.length;

  return lesson;
}
