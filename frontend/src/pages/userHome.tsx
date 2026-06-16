import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer/Footer";
import Navbar from "../components/Navbar/Navbar";
import {
  formatCourseInstructorNames,
  getMockTrailsWithCourses,
  mockCourses,
} from "../data/courseData";
import { getAuthenticatedUser } from "../services/userService";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Box,
  Clock3,
  Gamepad2,
  GraduationCap,
  Headset,
  Play,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import HomeIMG from "../assets/home/HomeIMG.png";
const courseIcons: Record<number, LucideIcon> = {
  1: Gamepad2,
  2: BookOpen,
  3: Sparkles,
  4: GraduationCap,
};

const metaverseFeatures = [
  "Salas virtuais para aulas imersivas",
  "Laboratórios 3D para simulações práticas",
  "Projetos colaborativos com avatares",
];

function colorWithAlpha(hexColor: string, alpha: number) {
  const normalized = hexColor.replace("#", "");
  const value = Number.parseInt(normalized, 16);

  if (normalized.length !== 6 || Number.isNaN(value)) {
    return `rgba(37, 99, 235, ${alpha})`;
  }

  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export default function UserHome() {
  const navigate = useNavigate();
  const user = getAuthenticatedUser();
  const trails = getMockTrailsWithCourses();

  const handleStartCourse = (courseId: number) => {
    navigate(`/courses/${courseId}`);
  };

  const handleOpenTrail = (trailSlug: string) => {
    navigate(`/trilhas/${trailSlug}`);
  };

  const scrollToTrails = () => {
    document.getElementById("trilhas")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToCourses = () => {
    document.getElementById("cursos")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#f6f9ff] text-slate-950">
      <Navbar user={user} />

      <main className="overflow-hidden">
        <section className="relative bg-gradient-to-br from-white via-blue-50 to-cyan-50">
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white to-transparent" />
          <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:py-20">
            <div className="relative z-10 max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm">
                <Sparkles size={16} />
                Plataforma EAD Inovação Barueri
              </div>
              <h1 className="text-4xl font-black leading-tight text-[#25304a] sm:text-5xl lg:text-6xl">
                Aprenda tecnologia com trilhas práticas e acompanhamento real.
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
                Continue seus cursos, acompanhe sua jornada e desenvolva
                habilidades para criar projetos digitais, jogos, interfaces e
                experiências imersivas.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => handleStartCourse(1)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                >
                  Continuar aprendendo
                  <ArrowRight size={20} />
                </button>
                <button
                  onClick={scrollToTrails}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-6 py-3 font-bold text-blue-700 transition hover:border-blue-300 hover:bg-blue-50"
                >
                  Ver trilhas
                  <BookOpen size={20} />
                </button>
              </div>
            </div>

            <div className="relative">
              <div>
                <div>
                  <img
                    src={HomeIMG}
                    alt="Estudantes explorando tecnologia em aula"
                    className="aspect-[4/3] h-auto min-h-[280px] w-full object-cover opacity-90 sm:aspect-[16/12] lg:aspect-[5/4]"
                  />
                </div>
                
              </div>
            </div>
          </div>
        </section>

        <section
          id="cursos"
          className="mx-auto max-w-7xl scroll-mt-24 px-4 py-14 sm:px-6 lg:px-8"
        >
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
                Meus cursos
              </p>
              <h2 className="mt-2 text-3xl font-black text-[#25304a]">
                Continue de onde parou
              </h2>
            </div>
            <button
              onClick={scrollToCourses}
              className="inline-flex items-center gap-2 font-bold text-blue-700 transition hover:text-blue-900"
            >
              Ver todos
              <ArrowRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {mockCourses.map((course) => {
              const Icon = courseIcons[course.id] ?? BookOpen;
              const instructorCount = course.instructors?.length ?? 1;
              return (
                <article
                  key={course.id}
                  onClick={() => handleStartCourse(course.id)}
                  className="group cursor-pointer overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/10"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      handleStartCourse(course.id);
                    }
                  }}
                >
                  <div className="relative h-44 overflow-hidden bg-slate-200">
                    <img
                      src={course.image}
                      alt={course.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-transparent" />
                    <div className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/95 text-blue-600 shadow">
                      <Icon size={20} />
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="mb-2 flex items-center justify-between text-xs font-bold text-white">
                        <span>{course.progress}% concluído</span>
                        <span>{course.totalLessons} aulas</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/30">
                        <div
                          className="h-full rounded-full bg-white"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="line-clamp-2 text-lg font-black text-[#25304a] transition group-hover:text-blue-700">
                      {course.title}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                      {course.description}
                    </p>
                    <div className="mt-5 flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold text-slate-500">
                        {instructorCount > 1 ? "Professores: " : "Professor: "}
                        <span className="text-slate-700">
                          {formatCourseInstructorNames(course)}
                        </span>
                      </p>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white transition group-hover:bg-blue-700">
                        <Play size={16} className="fill-white" />
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section
          id="trilhas"
          className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-14 sm:px-6 lg:px-8"
        >
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
                Trilhas de aprendizagem
              </p>
              <h2 className="mt-2 text-3xl font-black text-[#25304a]">
                Escolha uma jornada para seguir
              </h2>
              <p className="mt-3 max-w-2xl leading-7 text-slate-600">
                Cada trilha agrupa cursos relacionados, seguindo o modelo de
                trilhas e cursos do banco de dados.
              </p>
            </div>
            <button
              onClick={scrollToCourses}
              className="inline-flex items-center gap-2 font-bold text-blue-700 transition hover:text-blue-900"
            >
              Ver cursos
              <ArrowRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {trails.map((trail) => {
              const accentBorder = colorWithAlpha(trail.accentColor, 0.25);

              return (
                <article
                  key={trail.id}
                  onClick={() => handleOpenTrail(trail.slug)}
                  className="group cursor-pointer overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/10"
                  style={{ borderColor: accentBorder }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      handleOpenTrail(trail.slug);
                    }
                  }}
                >
                  <div
                    className="h-2"
                    style={{ backgroundColor: trail.accentColor }}
                  />
                  <div className="relative h-36 overflow-hidden bg-slate-200">
                    <img
                      src={trail.capa}
                      alt={trail.nome}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>

                  <div className="p-5">
                    <h3 className="text-lg font-black text-[#25304a] transition group-hover:text-blue-700">
                      {trail.nome}
                    </h3>

                    <div className="mt-5">
                      <div className="mb-2 text-xs font-bold text-slate-500">
                        <span>{trail.progress}% concluído</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${trail.progress}%`,
                            backgroundColor: trail.accentColor,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section id="quem-somos" className="scroll-mt-24 bg-white py-16">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
                Experiência completa
              </p>
              <h2 className="mt-2 text-3xl font-black text-[#25304a]">
                Uma plataforma feita para aprender fazendo!
              </h2>
              <p className="mt-4 leading-7 text-slate-600">
                A home organiza seu progresso, destaca novas trilhas e aproxima
                cada aluno de projetos reais com feedback, certificação e
                conteúdos atualizados.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { title: "Aulas curtas", icon: Clock3 },
                { title: "Certificação", icon: BadgeCheck },
                { title: "Suporte guiado", icon: Headset },
              ].map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5"
                  >
                    <Icon className="text-blue-600" size={24} />
                    <p className="mt-4 font-black text-[#25304a]">
                      {feature.title}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
