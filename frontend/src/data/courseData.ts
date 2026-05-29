// Mocks de cursos usados apenas no frontend. Quando os endpoints do backend
// estiverem prontos, troque estes helpers por chamadas reais de API.
export interface Lesson {
  id: number;
  title: string;
  duration: string;
  completed: boolean;
  content: string;
}

export interface Instructor {
  name: string;
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
  instructor: Instructor;
  lessonTitles: string[];
}

export const mockCourses: Course[] = [
  {
    id: 1,
    title: "Curso de Game Development",
    description:
      "Aprenda a criar jogos 2D e 3D com logica visual, prototipos e experiencias interativas.",
    image:
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&h=680&fit=crop",
    progress: 70,
    completedLessons: 7,
    totalLessons: 10,
    about:
      "Neste curso de Game Development, voce aprende fundamentos de jogos, construcao de cenas, eventos, sprites, menus e publicacao. Todo o fluxo usa exemplos praticos para transformar uma ideia simples em um prototipo jogavel.",
    instructor: {
      name: "Joao Silva",
      bio: "Desenvolvedor de games com mais de 8 anos de experiencia em projetos educativos e jogos publicados em plataformas digitais.",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    },
    lessons: [
      {
        id: 1,
        title: "Introducao ao Curso",
        duration: "10:50",
        completed: true,
        content:
          "Visao geral da jornada, ferramentas usadas e resultado esperado ao final do curso.",
      },
      {
        id: 2,
        title: "Configurando o GDevelop",
        duration: "15:30",
        completed: true,
        content:
          "Instalacao, criacao do primeiro projeto e organizacao inicial das cenas.",
      },
      {
        id: 3,
        title: "Criando seu primeiro jogo",
        duration: "22:45",
        completed: true,
        content:
          "Montagem do primeiro personagem, objetivo do jogo e controles basicos.",
      },
      {
        id: 4,
        title: "Sprites e Animacoes",
        duration: "18:20",
        completed: true,
        content:
          "Preparacao dos assets, estados de animacao e troca de sprites durante a partida.",
      },
      {
        id: 5,
        title: "Sistema de Colisao",
        duration: "25:10",
        completed: true,
        content:
          "Como detectar contato entre objetos e transformar colisoes em regras de jogo.",
      },
      {
        id: 6,
        title: "Logica e Comportamentos",
        duration: "28:50",
        completed: true,
        content:
          "Uso de eventos, condicoes e comportamentos para criar interacoes reutilizaveis.",
      },
      {
        id: 7,
        title: "Pontuacao e Feedback",
        duration: "20:15",
        completed: true,
        content:
          "Criacao de HUD, pontos, mensagens de acerto e retorno visual para o jogador.",
      },
      {
        id: 8,
        title: "Som e Musica",
        duration: "16:30",
        completed: false,
        content:
          "Adicao de efeitos sonoros, trilhas e ajustes de volume para melhorar a experiencia.",
      },
      {
        id: 9,
        title: "UI e Menus",
        duration: "24:00",
        completed: false,
        content:
          "Construcao de telas de inicio, pausa, fim de jogo e navegacao entre cenas.",
      },
      {
        id: 10,
        title: "Publicando seu jogo",
        duration: "12:40",
        completed: false,
        content:
          "Checklist final, exportacao do projeto e preparacao para compartilhar o jogo.",
      },
    ],
  },
  {
    id: 2,
    title: "Web Development",
    description:
      "Domine React, TypeScript e arquitetura moderna para aplicacoes escalaveis.",
    image:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&h=680&fit=crop",
    progress: 45,
    completedLessons: 4,
    totalLessons: 9,
    about:
      "Uma trilha para evoluir interfaces React com componentes bem tipados, roteamento, estado local, consumo de dados mockados e preparacao para APIs reais.",
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
          "Organizacao de pastas, responsabilidade dos componentes e convencoes de importacao.",
      },
      {
        id: 2,
        title: "Componentes reutilizaveis",
        duration: "18:40",
        completed: true,
        content:
          "Criacao de componentes de interface com props claras e comportamento previsivel.",
      },
      {
        id: 3,
        title: "Rotas com parametros",
        duration: "21:00",
        completed: true,
        content:
          "Uso de parametros de rota para abrir telas dinamicas como detalhes de curso.",
      },
      {
        id: 4,
        title: "Estado local com hooks",
        duration: "19:25",
        completed: true,
        content:
          "Padroes para formularios, listas, selecao de itens e estados de carregamento.",
      },
      {
        id: 5,
        title: "Servicos mockados",
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
          "Mensagens claras para o usuario e separacao entre erros de campo e erros gerais.",
      },
      {
        id: 7,
        title: "Build e lint",
        duration: "12:20",
        completed: false,
        content:
          "Verificacoes antes do commit e como evitar falhas especificas de ambiente.",
      },
      {
        id: 8,
        title: "Preparando integracao real",
        duration: "17:05",
        completed: false,
        content:
          "Pontos de troca entre mocks e endpoints reais com menor impacto na interface.",
      },
      {
        id: 9,
        title: "Revisao final",
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
      "Curso introdutorio de UX/UI para estruturar problemas, desenhar fluxos, criar telas e validar ideias com usuarios antes da implementacao.",
    instructor: {
      name: "Carlos Lima",
      bio: "Designer de produto com experiencia em pesquisas, prototipos e interfaces para servicos publicos digitais.",
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
          "Conceitos essenciais para entender necessidades, contexto e objetivos do usuario.",
      },
      {
        id: 2,
        title: "Mapeando jornadas",
        duration: "15:15",
        completed: false,
        content:
          "Organizacao de etapas, dores e oportunidades em uma jornada de aprendizagem.",
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
          "Uso de cor, tipografia, espacamento e componentes para melhorar clareza.",
      },
      {
        id: 5,
        title: "Prototipagem",
        duration: "20:35",
        completed: false,
        content:
          "Conexao entre telas e simulacao de fluxos principais antes do desenvolvimento.",
      },
      {
        id: 6,
        title: "Teste com usuarios",
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
      "Explore analise de dados, machine learning e visualizacoes com projetos praticos.",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=680&fit=crop",
    progress: 30,
    completedLessons: 3,
    totalLessons: 8,
    about:
      "Uma introducao pratica a ciencia de dados usando Python, leitura de bases, limpeza, graficos e modelos simples para apoiar decisoes.",
    instructor: {
      name: "Ana Silva",
      bio: "Cientista de dados e educadora, com foco em tornar analise e automacao acessiveis para diferentes perfis de alunos.",
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
          "Preparacao do ambiente, notebooks e bibliotecas usadas na trilha.",
      },
      {
        id: 2,
        title: "Leitura de dados",
        duration: "17:20",
        completed: true,
        content:
          "Importacao de arquivos, inspecao inicial e entendimento das colunas.",
      },
      {
        id: 3,
        title: "Limpeza de dados",
        duration: "21:10",
        completed: true,
        content:
          "Tratamento de valores ausentes, duplicados e padronizacao de formatos.",
      },
      {
        id: 4,
        title: "Analise exploratoria",
        duration: "24:40",
        completed: false,
        content:
          "Uso de estatisticas simples para encontrar padroes e levantar hipoteses.",
      },
      {
        id: 5,
        title: "Visualizacoes",
        duration: "19:50",
        completed: false,
        content:
          "Criacao de graficos que comunicam dados com clareza e contexto.",
      },
      {
        id: 6,
        title: "Modelo preditivo simples",
        duration: "27:30",
        completed: false,
        content:
          "Treinamento de um modelo basico e avaliacao inicial de resultados.",
      },
      {
        id: 7,
        title: "Apresentando resultados",
        duration: "14:20",
        completed: false,
        content:
          "Como organizar achados, limitacoes e proximos passos em uma narrativa.",
      },
      {
        id: 8,
        title: "Projeto final",
        duration: "32:15",
        completed: false,
        content:
          "Aplicacao completa do fluxo de ciencia de dados em um pequeno case.",
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
      "Formacao para ampliar acesso, autonomia e fluencia digital em ferramentas, interfaces e dados.",
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
      "Aprendizagem pratica para criar jogos digitais, prototipos interativos e experiencias imersivas.",
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
      "Jornada para fortalecer ideias, comunicacao digital, prototipos e tomada de decisao para empreender.",
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
      "Formacao para estagiarios desenvolverem competencias digitais, analiticas e de produto no servico publico.",
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
      "Capacitacao em tecnologia aplicada ao governo, dados, plataformas digitais e melhoria de processos publicos.",
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
      "Apoio a secretarias na ampliacao do EAD com organizacao de conteudo, trilhas e experiencias digitais.",
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
  const lessons: Lesson[] = input.lessonTitles.map((title, index) => ({
    id: index + 1,
    title: title.trim(),
    duration: "00:00",
    completed: false,
    content:
      "Conteudo mockado temporario. O backend futuro deve enviar a descricao, video e materiais desta aula.",
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
    instructor: input.instructor,
    lessons,
  };

  nextMockCourseId += 1;
  mockCourses.push(createdCourse);

  return createdCourse;
}
