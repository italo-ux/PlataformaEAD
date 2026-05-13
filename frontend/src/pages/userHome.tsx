import { useNavigate } from "react-router-dom";
import CourseHeader from "../components/CourseHeader";
import Footer from "../components/Footer/Footer";
import { Play } from "lucide-react";
import Navbar from "../components/Navbar/navbar";
import { mockUser } from "../data/userMock";

export default function UserHome() {
  const navigate = useNavigate();

  // Mockados cursos disponíveis para o usuário
  const availableCourses = [
    {
      id: 1,
      title: "Curso de Game Development",
      description:
        "Aprenda a criar jogos 2D e 3D sem necessidade de escrever código complexo.",
      image:
        "https://images.unsplash.com/photo-1535655519926-e3400ca199e7?w=400&h=300&fit=crop",
      progress: 70,
      instructor: "João Silva"
    },
    {
      id: 2,
      title: "Web Development Avançado",
      description: "Domine React, TypeScript e arquitetura modern de aplicações.",
      image:
        "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=300&fit=crop",
      progress: 45,
      instructor: "Maria Santos"
    },
    {
      id: 3,
      title: "UX/UI Design",
      description: "Crie interfaces incríveis e experiências de usuário memoráveis.",
      image:
        "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop",
      progress: 0,
      instructor: "Carlos Lima"
    },
    {
      id: 4,
      title: "Data Science com Python",
      description:
        "Análise de dados, machine learning e visualização com Python.",
      image:
        "https://images.unsplash.com/photo-1526374965328-7f5ae4e8b08f?w=400&h=300&fit=crop",
      progress: 30,
      instructor: "Ana Silva"
    }
  ];

  const handleStartCourse = (_courseId: number) => {
    navigate(`/course`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <Navbar user={mockUser} />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Bem-vindo à Plataforma EAD!
          </h1>
          <p className="text-gray-600 text-lg">
            Escolha um curso e comece sua jornada de aprendizado
          </p>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {availableCourses.map((course) => (
            <button
              key={course.id}
              onClick={() => handleStartCourse(course.id)}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition group"
            >
              {/* Course Image Container */}
              <div className="relative h-40 overflow-hidden bg-gray-200">
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition"
                />

                {/* Progress Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                  <div className="w-full">
                    <p className="text-white text-xs font-semibold mb-2">
                      {course.progress}% concluído
                    </p>
                    <div className="w-full bg-white/30 rounded-full h-1.5">
                      <div
                        className="bg-white h-full rounded-full transition"
                        style={{ width: `${course.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Play Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartCourse(course.id);
                  }}
                  className="absolute inset-0 flex items-center justify-center group-hover:bg-black/20 transition opacity-0 group-hover:opacity-100"
                >
                  <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition">
                    <Play size={24} className="text-white fill-white ml-0.5" />
                  </div>
                </button>
              </div>

              {/* Course Info */}
              <div className="p-4 text-left">
                <h3 className="font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition">
                  {course.title}
                </h3>
                <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                  {course.description}
                </p>
                <p className="text-xs text-gray-500">
                  Instrutor: <span className="font-medium">{course.instructor}</span>
                </p>
              </div>

              {/* CTA Button */}
              <div className="px-4 pb-4">
                <div className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition text-center group-hover:bg-blue-700">
                  {course.progress > 0 ? "Continuar" : "Começar"}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Featured Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Novos cursos disponíveis
          </h2>
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <h3 className="text-3xl font-bold mb-2">Aprenda com os melhores</h3>
            <p className="mb-6 text-blue-100">
              Novos cursos são adicionados semanalmente. Cadastre-se para receber
              notificações sobre cursos que mais te interessam.
            </p>
            <button className="px-6 py-3 bg-white text-blue-600 rounded-lg font-bold hover:bg-blue-50 transition">
              Ver todos os cursos
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}