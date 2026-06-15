// Imports principais da página: React, navegação e componentes visuais usados no dashboard.
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer/Footer";
import Navbar from "../components/Navbar/Navbar";
import { mockCourses } from "../data/courseData";
import { getAuthenticatedUser } from "../services/userService";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  Clock3,
  Download,
  Gamepad2,
  GraduationCap,
  MapPin,
  Medal,
  Sparkles,
  Trophy,
  type LucideIcon,
} from "lucide-react";


// Dados estáticos usados para exibir estatísticas rápidas, abas e cartões de conquista/ranking.
const quickStats = [
  { label: "Cursos ativos", value: "4", icon: BookOpen },
  { label: "Aulas concluídas", value: "18/40", icon: CheckCircle2 },
  { label: "Tempo de estudo", value: "12h 40m", icon: Clock3 },
  { label: "Certificados", value: "2", icon: Trophy },
];

const courseIcons: Record<number, LucideIcon> = {
  1: Gamepad2,
  2: BookOpen,
  3: Sparkles,
  4: GraduationCap,
};

const navTabs = [
  { id: "cursos", label: "Meus Cursos" },
  { id: "conquistas", label: "Conquistas" },
  { id: "ranking", label: "Ranking" },
  { id: "certificados", label: "Certificados" },
] as const;

const achievements = [
  { title: "Primeiro curso concluído", detail: "Você completou sua primeira trilha com sucesso.", icon: Medal },
  { title: "10 horas de estudo", detail: "Seu tempo acumulado nas trilhas ultrapassou 10h.", icon: Award },
  { title: "Sequência de 7 dias", detail: "Você manteve uma rotina consistente de estudos esta semana.", icon: BadgeCheck },
];

const rankingCards = [
  {
    label: "Ranking municipal",
    value: "#12",
    detail: "Posição entre estudantes da sua cidade com base em cursos, horas e certificados.",
    accent: "bg-emerald-50 text-emerald-700",
    icon: MapPin,
  },
  {
    label: "Ranking nacional",
    value: "#84",
    detail: "Classificação geral da plataforma com foco em desempenho e conquistas.",
    accent: "bg-violet-50 text-violet-700",
    icon: Trophy,
  },
];

// Componente principal do painel do aluno.
export default function DashboardAluno() {
  // Hook de navegação para abrir uma trilha específica ao clicar em um curso.
  const navigate = useNavigate();
  // Busca o usuário autenticado para exibir dados no cabeçalho.
  const user = getAuthenticatedUser();
  // Controla qual seção do painel está ativa no clique das abas.
  const [activeTab, setActiveTab] = useState<(typeof navTabs)[number]["id"]>("cursos");

  // Faz a rolagem para a área de cursos quando o usuário clica em "Ver todos os cursos".
  const scrollToCourses = () => {
    document
      .getElementById("cursos")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Abre a rota do curso ao clicar em um card.
  const handleStartCourse = (courseId: number) => {
    navigate(`/courses/${courseId}`);
  };

  // Filtra apenas os cursos que ainda estão em andamento e não foram concluídos.
  const openCourses = useMemo(
    () => mockCourses.filter((course) => course.progress > 0 && course.progress < 100),
    [],
  );

  return (

    // Estrutura geral da página: navbar, conteúdo principal e rodapé.
    <div className="min-h-screen bg-[linear-gradient(180deg,#f5f8ff_0%,#ffffff_45%,#f7fbff_100%)] text-slate-900">

      {/* Navbar superior com dados do usuário. */}
      <Navbar user={user} />

          {/* Painel do Aluno */}
            <section className="bg-white border-y border-blue-100">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            
                {/* Título */}
                  <div className="mb-8">
                    <h1 className="text-5xl font-bold text-slate-900">
                    Meu Dashboard
                  </h1>
                    <p className="mt-3 text-xl text-slate-600">
                    Acompanhe seu progresso e continue sua jornada de aprendizado.
                  </p>
                </div>
                  
                  {/* Card Principal */}
                    <div className="overflow-hidden rounded-[32px] bg-gradient-to-r from-blue-500 to-blue-800 p-8 shadow-2xl">
                      <div className="grid gap-10 lg:grid-cols-[1fr_400px] lg:items-center">

                        {/* Dados do aluno */}
                          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">

                            {/* Avatar */}
                              <div className="flex h-36 w-36 items-center justify-center rounded-full">
                                <img
                                src={user?.avatar}
                                alt={user?.name}
                                width={244}
                                height={244}
                                className="h-28 w-28 rounded-full object-cover border-2 border-white/60 shadow-lg shadow-blue-900/60"
                              />
                            </div>
                        
                            {/* Informações */}
                              <div>
                                  <h2 className="text-4xl font-black text-white">
                                  {user?.name}
                                </h2>
                              <div className="mt-3 flex flex-wrap gap-3">
                                <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white"> Nível 12
                              </span>

                                <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white"> 2.850 XP
                              </span>
                              
                                <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white"> #12 Municipal
                              </span>
                            </div>
                              
                              <div className="mt-5 flex items-center gap-2 text-blue-100">
                              <MapPin size={18} />
                            <span>Barueri - SP</span>
                            </div>
                                <p className="mt-4 max-w-xl text-blue-100">
                                Continue estudando para subir de nível, desbloquear conquistas e avançar no ranking de sua cidade e nacional!
                              </p>
                            </div>
                            </div>
                                  
                            {/* XP */}
                              <div>
                                <p className="mb-4 text-xl font-semibold text-white">
                                Progresso para o próximo nível
                              </p>
                                <div className="h-6 overflow-hidden rounded-full bg-white/20">
                              <div
                              className="h-full rounded-full bg-white transition-all"
                              style={{ width: "65%" }}
                              />
                            </div>

                              <div className="mt-3 flex justify-between text-white">
                              <span>650 XP</span>
                              <span>1000 XP</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

    {/* Conteúdo principal do dashboard. */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8 py-12">

      {/* Bloco de estatísticas rápidas no topo do painel. */}
        <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {quickStats.map((stat) => {
            const Icon = stat.icon as LucideIcon;
            return (
            <article key={stat.label} className="rounded-[24px] border border-blue-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-900/10">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <p className="mt-2 text-2xl font-black text-[#18253d]">{stat.value}</p>
                  </div>
                  <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                    <Icon size={18} />
                    </div>
                    </div>
                    </article>
                    );
                  }
                )
                }
                </section>
        
      {/* Abas de navegação entre cursos, conquistas, ranking e certificados. */}
        <section className="mt-8 rounded-[28px] border border-blue-100 bg-white/95 p-5 shadow-[0_20px_60px_-35px_rgba(37,99,235,0.35)] xl:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-600">Painel de navegação</p>
            <h2 className="mt-2 text-xl font-black text-[#18253d] sm:text-2xl">Navegue pelos blocos da sua jornada acadêmica.</h2>
            <p className="mt-1 text-sm text-slate-600">As informações atualizam abaixo conforme a aba selecionada.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {navTabs.map((tab) => (
                <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab.id? 
                  "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                }`
              }
              >
                {tab.label}
                  </button>
              )
            )
          }
          </div>
        </div>
      </section>

    {/* Cursos em andamento. */}
      <section className="mt-4 rounded-[28px] border border-blue-100 bg-white/95 p-5 shadow-[0_20px_60px_-35px_rgba(37,99,235,0.35)] xl:p-6">
      <div className="min-h-[220px]">
        {activeTab === "cursos" && (
          <div id="cursos" className="scroll-mt-24">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Cursos abertos</p>
                <h3 className="mt-2 text-xl font-black text-[#18253d]">Continue de onde parou</h3>
                <p className="mt-2 text-sm text-slate-600">Abaixo estão apenas os cursos em andamento e acessíveis no momento.</p>
                </div>
                <button onClick={scrollToCourses} className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900">Ver todos os cursos <ArrowRight size={15} />
                </button>
                </div>
                
                <div className="mt-6">
                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {openCourses.map((course) => {
                      const Icon = courseIcons[course.id] ?? BookOpen;
                      return (
                      <article key={course.id} onClick={() => handleStartCourse(course.id)} className="group cursor-pointer overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/10" role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") handleStartCourse(course.id); }}>
                        <div className="relative h-40 overflow-hidden bg-slate-200">
                          <img src={course.image} alt={course.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-transparent" />
                          <div className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/95 text-blue-600 shadow"><Icon size={18} /></div>
                          <div className="absolute bottom-4 left-4 right-4">
                            <div className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.18em] text-white">
                              <span>{course.progress}% concluído</span>
                            <span>{course.totalLessons} aulas</span>
                            </div>
                            <div className="h-2 rounded-full bg-white/30"><div className="h-full rounded-full bg-white" style={{ width: `${course.progress}%` }} />
                            </div>
                            </div>
                            </div>
                            <div className="p-5">
                              <h4 className="text-lg font-black text-[#18253d]">{course.title}</h4>
                              <p className="mt-2 text-sm text-slate-600">{course.description}</p>
                              <div className="mt-5 flex items-center justify-between gap-3 text-xs text-slate-500">
                                <span>Professor: {course.instructor.name}</span>
                                <button className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700">Continuar <ArrowRight size={12} />
                                </button>
                                </div>
                                </div>
                                </article>
                                );
                    }
                  )
                }
                </div>
                </div>
                </div>
            )
          }

        {/* Conquistas. */}
          {activeTab === "conquistas" && (
            <div className="p-5 xl:p-6">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Conquistas</p>
              <h3 className="mt-2 text-xl font-black text-[#18253d]">Gamificação para manter o impulso e reconhecer seu progresso</h3>
              <p className="mt-2 text-sm text-slate-600">Cada marco concluído gera reconhecimento, incentiva a continuidade e ajuda a manter a rotina de estudos ativa.</p>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {achievements.map((item) => {
                  const Icon = item.icon as LucideIcon;
                  return (
                  <article key={item.title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3"><div className="rounded-2xl bg-amber-50 p-3 text-amber-600"><Icon size={18} />
                    </div>
                    <h4 className="text-base font-black text-slate-900">{item.title}</h4>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">{item.detail}</p>
                    </article>
                    );
                  }
                )
              }
              </div>
              </div>
            )
          }

        {/* Ranking. */}
          {activeTab === "ranking" && (
            <div className="p-5 xl:p-6">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Ranking</p>
              <h3 className="mt-2 text-xl font-black text-[#18253d]">Classificação baseada em desempenho, horas de estudo e conquistas</h3>
              <p className="mt-2 text-sm text-slate-600">O ranking municipal mostra sua posição entre estudantes da mesma cidade, enquanto o ranking nacional compara seu desempenho com a plataforma inteira.</p>
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                {rankingCards.map((item) => {
                  const Icon = item.icon as LucideIcon;
                  return (
                  <article key={item.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-500">{item.label}</p>
                        <p className="mt-3 text-4xl font-black text-[#18253d]">{item.value}</p>
                        </div>
                        <div className={`rounded-2xl p-3 ${item.accent}`}><Icon size={18} />
                        </div>
                        </div>
                        <p className="mt-4 text-sm text-slate-600">{item.detail}</p>
                        </article>
                        );
                      }
                    )
                  }
                  </div>
                  </div>
                )
              }

        {/* Certificados. */}
          {activeTab === "certificados" && (
            <div className="p-5 xl:p-6">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Certificados</p>
              <h3 className="mt-2 text-xl font-black text-[#18253d]">Centralize seus comprovantes e baixe o que já foi concluído</h3>
              <p className="mt-2 text-sm text-slate-600">Cada certificado reúne nome do curso, data de conclusão, carga horária e status de validação para fácil acesso.</p>
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {mockCourses.filter((course) => course.progress >= 65).slice(0, 3).map((course) => (
                  <article key={course.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Certificado disponível</p>
                        <h4 className="mt-2 text-lg font-black text-slate-900">{course.title}</h4>
                        </div>
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700">{course.progress}%
                        </span>
                        </div>
                        <p className="mt-3 text-sm text-slate-600">Carga horária: {course.totalLessons * 2}h · Status: validado</p>
                        <button className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"><Download size={14} /> Baixar PDF
                        </button>
                        </article>
                      )
                    )
                  }
                  </div>
                  </div>
                )
              }
            </div>
          </section>

        </main>

      <Footer />

    </div>
  );
}
