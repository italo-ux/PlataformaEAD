import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Download,
  Trophy,
} from "lucide-react";
import Footer from "../components/Footer/Footer";
import Navbar from "../components/Navbar/Navbar";
import { useAuth } from "../context/auth-context";
import certificateService from "../services/certificateService";
import journeyService, {
  type CertificateSummary,
  type EnrollmentSummary,
} from "../services/journeyService";

function formatStudyTime(totalSeconds: number) {
  const totalMinutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours ? `${hours}h ${String(minutes).padStart(2, "0")}m` : `${minutes}m`;
}

export default function DashboardAluno() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"cursos" | "certificados">("cursos");
  const [enrollments, setEnrollments] = useState<EnrollmentSummary[]>([]);
  const [certificates, setCertificates] = useState<CertificateSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.role !== "aluno") return;
    let cancelled = false;
    Promise.all([journeyService.listEnrollments(), certificateService.list()])
      .then(([enrollmentData, certificateData]) => {
        if (!cancelled) {
          setEnrollments(enrollmentData);
          setCertificates(certificateData);
        }
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Não foi possível carregar seu painel.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.role]);

  const stats = useMemo(() => {
    const active = enrollments.filter((item) => !item.conclusao);
    return {
      active,
      completedCourses: enrollments.filter((item) => item.conclusao).length,
      completedLessons: enrollments.reduce(
        (total, item) => total + item.aulas_concluidas,
        0,
      ),
      totalLessons: enrollments.reduce(
        (total, item) => total + item.total_aulas,
        0,
      ),
      studyTime: formatStudyTime(
        enrollments.reduce(
          (total, item) => total + item.segundos_estudados,
          0,
        ),
      ),
    };
  }, [enrollments]);

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "aluno") return <Navigate to="/home" replace />;

  const quickStats = [
    { label: "Cursos ativos", value: String(stats.active.length), icon: BookOpen },
    {
      label: "Aulas concluídas",
      value: `${stats.completedLessons}/${stats.totalLessons}`,
      icon: CheckCircle2,
    },
    { label: "Tempo de estudo", value: stats.studyTime, icon: Clock3 },
    { label: "Certificados", value: String(certificates.length), icon: Trophy },
  ];

  return (
    <div className="min-h-screen bg-[#f6f9ff] text-slate-950">
      <Navbar user={user} />
      <header className="border-b border-blue-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
            Painel do aluno
          </p>
          <h1 className="mt-2 text-4xl font-black text-[#25304a]">
            Olá, {user.name}
          </h1>
          <p className="mt-3 text-lg text-slate-600">
            Acompanhe aqui sua jornada persistida, do primeiro vídeo ao certificado.
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        {error && (
          <div role="alert" className="mb-6 rounded-xl bg-red-100 p-4 font-semibold text-red-700">
            {error}
          </div>
        )}

        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {quickStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <article key={stat.label} className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{stat.label}</p>
                    <p className="mt-2 text-2xl font-black text-[#25304a]">{stat.value}</p>
                  </div>
                  <div className="rounded-xl bg-blue-50 p-3 text-blue-600"><Icon size={20} /></div>
                </div>
              </article>
            );
          })}
        </section>

        <div className="mt-8 flex gap-2">
          <button type="button" onClick={() => setActiveTab("cursos")} className={`rounded-lg px-4 py-2 font-bold ${activeTab === "cursos" ? "bg-blue-600 text-white" : "bg-white text-slate-700"}`}>
            Meus cursos
          </button>
          <button type="button" onClick={() => setActiveTab("certificados")} className={`rounded-lg px-4 py-2 font-bold ${activeTab === "certificados" ? "bg-blue-600 text-white" : "bg-white text-slate-700"}`}>
            Certificados
          </button>
        </div>

        {loading ? (
          <p className="py-12 text-center text-slate-600">Carregando dados da jornada...</p>
        ) : activeTab === "cursos" ? (
          <section className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {enrollments.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <p className="font-bold text-[#25304a]">Você ainda não iniciou nenhum curso.</p>
                <button type="button" onClick={() => navigate("/courses")} className="mt-4 font-bold text-blue-700">
                  Explorar catálogo
                </button>
              </div>
            ) : (
              enrollments.map((item) => (
                <article key={item.id} className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
                  <div className="h-40 bg-blue-50">
                    {item.curso.url_foto ? (
                      <img src={item.curso.url_foto} alt={item.curso.nome} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-blue-600"><BookOpen size={44} /></div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-black text-[#25304a]">{item.curso.nome}</h2>
                      {item.conclusao && <CheckCircle2 className="shrink-0 text-emerald-600" size={20} />}
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full bg-emerald-500" style={{ width: `${item.progresso}%` }} />
                    </div>
                    <div className="mt-2 flex justify-between text-xs font-semibold text-slate-500">
                      <span>{item.progresso}%</span>
                      <span>{item.aulas_concluidas}/{item.total_aulas} aulas</span>
                    </div>
                    <button type="button" onClick={() => navigate(`/courses/${item.curso.id}`)} className="mt-5 inline-flex items-center gap-2 font-bold text-blue-700">
                      {item.conclusao ? "Rever curso" : "Continuar"} <ArrowRight size={16} />
                    </button>
                  </div>
                </article>
              ))
            )}
          </section>
        ) : (
          <section className="mt-6 space-y-4">
            {certificates.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <p className="font-bold text-[#25304a]">Nenhum certificado emitido ainda.</p>
                <p className="mt-2 text-sm text-slate-500">Conclua todas as aulas de um curso para gerar o primeiro.</p>
              </div>
            ) : (
              certificates.map((certificate) => (
                <article key={certificate.id} className="flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase text-emerald-700">{certificate.status}</p>
                    <h2 className="mt-1 font-black text-[#25304a]">{certificate.nome_curso}</h2>
                    <p className="mt-1 text-sm text-slate-500">Código {certificate.codigo}</p>
                  </div>
                  <button type="button" onClick={() => void certificateService.download(certificate)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-3 font-bold text-white">
                    <Download size={17} /> Baixar PDF
                  </button>
                </article>
              ))
            )}
          </section>
        )}

        {stats.completedCourses > 0 && (
          <p className="mt-8 text-center text-sm font-semibold text-emerald-700">
            {stats.completedCourses} {stats.completedCourses === 1 ? "curso concluído" : "cursos concluídos"}.
          </p>
        )}
      </main>
      <Footer />
    </div>
  );
}
