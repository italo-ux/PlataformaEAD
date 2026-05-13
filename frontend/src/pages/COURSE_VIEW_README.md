# 📚 Plataforma EAD - Frontend Course View

## 📋 Visão Geral

Sistema moderno de visualização de cursos online construído com React + Tailwind CSS, estruturado para fácil integração com backend.

## 🎯 Características

- ✅ Design responsivo e moderno (Desktop, Tablet, Mobile)
- ✅ Componentes reutilizáveis e bem estruturados
- ✅ Dados mockados em constante separada (`courseData`)
- ✅ Fácil integração com API/Backend
- ✅ Animações suaves e transições
- ✅ Acessibilidade otimizada

## 📁 Estrutura de Arquivos

```
src/
├── pages/
│   ├── CourseView.tsx           # Página principal do curso
│   └── userHome.tsx             # Página inicial do usuário
├── components/
│   ├── CourseHeader.tsx         # Header da plataforma
│   ├── CoursePlayer.tsx         # Área de reprodução do curso
│   ├── ProgressSection.tsx      # Seção de progresso
│   ├── LessonSidebar.tsx        # Sidebar com lista de aulas
│   └── TabsSection.tsx          # Abas (Sobre/Instrutor)
├── data/
│   └── courseData.ts            # Dados mockados do curso
└── index.css                    # Estilos customizados
```

## 🎨 Componentes

### 1. **CourseHeader**
Header da plataforma com navegação principal.
- Logo e nome da plataforma
- Menu de navegação (Home, Quem Somos, Cursos, Feedbacks)
- Botão "Desempenho"
- Ícones de notificação e configurações
- Avatar do usuário
- Menu responsivo para mobile

### 2. **CoursePlayer**
Área principal de reprodução do conteúdo.
- Thumbnail/imagem do curso
- Overlay escuro com botão Play
- Informações da aula atual
- Botões de navegação (Anterior/Próximo)
- Totalmente responsivo

### 3. **ProgressSection**
Seção de progresso do aluno.
- Percentual de conclusão
- Barra de progresso animada
- Contador de aulas (x de y concluídas)
- Design clean com gradiente azul

### 4. **LessonSidebar**
Sidebar com lista de aulas do curso.
- Ícones de status (concluído/não concluído)
- Nome e duração de cada aula
- Indicador da aula atual
- Scroll interno otimizado
- Clicável para navegar entre aulas

### 5. **TabsSection**
Abas para mostrar diferentes informações.
- **Tab "Sobre"**: Descrição completa do curso
- **Tab "Instrutor"**: Informações do instrutor (foto, bio)
- Animação suave ao trocar de aba

## 📊 Estrutura de Dados

```typescript
interface Course {
  id: number;
  title: string;
  currentLesson: string;
  image: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  about: string;
  instructor: {
    name: string;
    bio: string;
    image?: string;
  };
  lessons: Lesson[];
}

interface Lesson {
  id: number;
  title: string;
  duration: string;
  completed: boolean;
}
```

## 🚀 Como Usar

### Acessar a página de curso:
```
http://localhost:5173/course
```

### Customizar dados:
Edite o arquivo `src/data/courseData.ts` para modificar os dados mockados.

```typescript
export const courseData: Course = {
  id: 1,
  title: "Seu Curso",
  currentLesson: "Aula Atual",
  image: "URL_DA_IMAGEM",
  // ... resto dos dados
};
```

## 🔌 Integração com Backend

### Passo 1: Criar um Hook customizado

```typescript
// src/hooks/useCourse.ts
import { useState, useEffect } from 'react';
import { Course } from '../data/courseData';

export function useCourse(courseId: number) {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await fetch(`/api/courses/${courseId}`);
        const data = await response.json();
        setCourse(data);
      } catch (error) {
        console.error('Erro ao buscar curso:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  return { course, loading };
}
```

### Passo 2: Usar o hook no componente

```typescript
// src/pages/CourseView.tsx
import { useCourse } from '../hooks/useCourse';

export default function CourseView() {
  const { course, loading } = useCourse(1); // courseId = 1

  if (loading) return <div>Carregando...</div>;
  if (!course) return <div>Curso não encontrado</div>;

  return (
    // Usar 'course' ao invés de 'courseData'
  );
}
```

### Passo 3: Endpoints esperados do backend

```
GET /api/courses/:id
GET /api/courses/:id/lessons
POST /api/lessons/:id/complete
POST /api/progress/update
```

## 🎨 Paleta de Cores

- **Primária**: `#4c6fff` (Azul)
- **Secundária**: `#f3f3f3` (Cinza claro)
- **Sucesso**: `#10b981` (Verde)
- **Texto Principal**: `#111827` (Cinza escuro)
- **Texto Secundário**: `#6b7280` (Cinza médio)

## 📱 Responsividade

- **Mobile**: Layout em coluna única, sidebar abaixo
- **Tablet**: Grid 2 colunas parcialmente responsivo
- **Desktop**: Grid 3 colunas (2 para conteúdo, 1 para sidebar)

## 🔄 Fluxo de Navegação

1. Usuário faz login
2. Acessa `/home` (lista de cursos)
3. Clica em um curso → navega para `/course`
4. Visualiza conteúdo, progresso e aulas
5. Pode navegar entre aulas
6. Clica "Voltar para cursos" → retorna para `/home`

## 📦 Dependências

- **react**: UI library
- **react-router-dom**: Roteamento
- **tailwindcss**: Styling
- **lucide-react**: Ícones
- **@tailwindcss/vite**: Plugin do Vite

## 🛠️ Como Executar

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

## 💡 Dicas de Desenvolvimento

1. **Adicionar nova aba**: Edite `TabsSection.tsx` e adicione novo estado
2. **Customizar cores**: Modifique as classes Tailwind nos componentes
3. **Adicionar animações**: Adicione keyframes em `index.css`
4. **Responsividade**: Use breakpoints Tailwind (`sm:`, `md:`, `lg:`, etc.)

## 📝 Exemplo de Implementação com API

Para integrar com uma API real, substitua a importação:

```typescript
// ❌ Remova:
import { courseData } from '../data/courseData';

// ✅ Adicione:
const { course: courseData, loading } = useCourse(courseId);
```

## 🎯 Próximos Passos

- [ ] Integrar com API de backend
- [ ] Adicionar autenticação
- [ ] Implementar sistema de notificações
- [ ] Adicionar comentários e discussões
- [ ] Sistema de certificados
- [ ] Analytics e tracking
- [ ] Video player customizado
- [ ] Testes automatizados

---

**Desenvolvido com ❤️ para PlataformaEAD**
