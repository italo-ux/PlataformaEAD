// Frontend-only course mocks. Replace these helpers with API calls when the
// backend course endpoints are ready.
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
    title: "Web Development Avancado",
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
      bio: "Cientista de dados e educadora, com foco em tornar analise e automacao acessiveis para iniciantes.",
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

export function getMockCourseById(courseId: number) {
  return mockCourses.find((course) => course.id === courseId) ?? null;
}

export function getRelatedMockCourses(courseId: number, limit = 3) {
  return mockCourses
    .filter((course) => course.id !== courseId)
    .slice(0, limit);
}
