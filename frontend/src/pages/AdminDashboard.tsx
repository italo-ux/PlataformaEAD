import { useCallback, useEffect, useMemo, useState } from "react";
import { Users, GraduationCap, BookOpenCheck, Award, Download } from "lucide-react";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import { useAuth } from "../context/auth-context";
import dashboardService from "../services/dashboardService";
import courseService from "../services/courseService";
import trailService from "../services/trailService";
import type { DashboardFilters, OverviewMetrics, Granularity } from "../types/dashboard";
import KpiCard from "../components/dashboard/KpiCard";
import BrazilMap from "../components/dashboard/BrazilMap";
import GrowthChart from "../components/dashboard/GrowthChart";
import CourseTrackComparison from "../components/dashboard/CourseTrackComparison";
import LearningFunnel from "../components/dashboard/LearningFunnel";
import CertificatesOverTime from "../components/dashboard/CertificatesOverTime";
import GlobalFilters from "../components/dashboard/GlobalFilters";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<DashboardFilters>({
    periodoInicio: "",
    periodoFim: "",
  });
  const [overview, setOverview] = useState<OverviewMetrics | null>(null);
  const [ufDistribution, setUfDistribution] = useState<Array<{ uf: string; nome: string; alunos: number; participacao: number }>>([]);
  const [growthSeries, setGrowthSeries] = useState<Array<{ periodo: string; novosAlunos: number; totalAcumulado: number; alunosAtivos?: number; horasEstudo?: number }>>([]);
  const [courseTrackPerformance, setCourseTrackPerformance] = useState<Array<{ id: string; nome: string; tipo: "curso" | "trilha"; matriculas: number; progressoMedio: number; taxaConclusao: number; alunosAtivos: number }>>([]);
  const [learningFunnel, setLearningFunnel] = useState<Array<{ etapa: string; quantidade: number; percentual: number }>>([]);
  const [certificatesOverTime, setCertificatesOverTime] = useState<Array<{ periodo: string; certificados: number; totalAcumulado: number }>>([]);
  const [courses, setCourses] = useState<Array<{ id: string; nome: string }>>([]);
  const [trilhas, setTrilhas] = useState<Array<{ id: string; nome: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUf, setSelectedUf] = useState("");
  const [growthGranularity, setGrowthGranularity] = useState<Granularity>("mensal");
  const [growthMetric, setGrowthMetric] = useState<"novos" | "acumulado">("novos");
  const [certGranularity, setCertGranularity] = useState<Granularity>("mensal");
  const [sortBy, setSortBy] = useState<"matriculas" | "progressoMedio" | "taxaConclusao" | "alunosAtivos">("matriculas");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [summary, coursesData, trilhasData] = await Promise.all([
        dashboardService.getSummary(filters, growthGranularity, certGranularity),
        courseService.listCourses(),
        trailService.listTrails(),
      ]);

      setOverview(summary.overview);
      setUfDistribution(summary.ufDistribution);
      setGrowthSeries(summary.growthSeries);
      setCourseTrackPerformance(summary.courseTrackPerformance);
      setLearningFunnel(summary.learningFunnel);
      setCertificatesOverTime(summary.certificatesOverTime);
      setCourses(coursesData);
      setTrilhas(trilhasData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar os dados do dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }, [
    filters,
    growthGranularity,
    certGranularity,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUfClick = (uf: string) => {
    setSelectedUf(uf);
    setFilters((prev) => ({ ...prev, uf: uf || undefined }));
  };

  const handleExportCsv = () => {
    const csvLines = ["secao,metrica,valor,detalhes"];
    const csvCell = (value: string | number) =>
      `"${String(value).replaceAll('"', '""')}"`;
    const addRow = (section: string, metric: string, value: string | number, details: string) => {
      csvLines.push([section, metric, value, details].map(csvCell).join(","));
    };

    // Visão geral
    if (overview) {
      addRow("visao_geral", "alunos_cadastrados", overview.alunosCadastrados, "total no período");
      addRow("visao_geral", "alunos_ativos", overview.alunosAtivos, "total no período");
      addRow("visao_geral", "matriculas_iniciadas", overview.matriculasIniciadas, "total no período");
      addRow("visao_geral", "taxa_conclusao", overview.taxaConclusao.toFixed(1), "percentual");
      addRow("visao_geral", "certificados_emitidos", overview.certificadosEmitidos, "total no período");
    }

    // Distribuição UF
    ufDistribution.forEach((uf) => {
      addRow("uf_distribuicao", uf.uf, uf.alunos, `${uf.participacao.toFixed(2)}%`);
    });

    // Crescimento
    growthSeries.forEach((g) => {
      addRow("crescimento", g.periodo, g.novosAlunos, "novos alunos");
      addRow("crescimento", g.periodo, g.totalAcumulado, "total acumulado");
    });

    // Cursos/Trilhas
    courseTrackPerformance.forEach((c) => {
      addRow("cursos_trilhas", `${c.tipo}: ${c.nome}`, c.matriculas, "matrículas");
      addRow("cursos_trilhas", `${c.tipo}: ${c.nome}`, c.progressoMedio.toFixed(1), "progresso médio (%)");
      addRow("cursos_trilhas", `${c.tipo}: ${c.nome}`, c.taxaConclusao.toFixed(1), "taxa de conclusão (%)");
      addRow("cursos_trilhas", `${c.tipo}: ${c.nome}`, c.alunosAtivos, "alunos ativos");
    });

    // Funil
    learningFunnel.forEach((f) => {
      addRow("funil", f.etapa, f.quantidade, `${f.percentual.toFixed(1)}%`);
    });

    // Certificados
    certificatesOverTime.forEach((c) => {
      addRow("certificados", c.periodo, c.certificados, "emitidos no período");
      addRow("certificados", c.periodo, c.totalAcumulado, "total acumulado");
    });

    const csvContent = csvLines.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    const dateStr = new Date().toISOString().split("T")[0];
    link.setAttribute("download", `dashboard-ead-${dateStr}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const kpiCards = useMemo(() => {
    if (!overview) return [];

    return [
      {
        label: "Alunos cadastrados",
        value: overview.alunosCadastrados.toLocaleString("pt-BR"),
        icon: Users,
      },
      {
        label: "Alunos ativos",
        value: overview.alunosAtivos.toLocaleString("pt-BR"),
        icon: GraduationCap,
      },
      {
        label: "Matrículas iniciadas",
        value: overview.matriculasIniciadas.toLocaleString("pt-BR"),
        icon: BookOpenCheck,
      },
      {
        label: "Taxa de conclusão",
        value: `${overview.taxaConclusao.toFixed(1)}%`,
        icon: Award,
      },
      {
        label: "Certificados emitidos",
        value: overview.certificadosEmitidos.toLocaleString("pt-BR"),
        icon: Award,
      },
    ];
  }, [overview]);

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#f6f9ff] flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-[#25304a]">Acesso restrito</h1>
          <p className="mt-2 text-slate-600">
            Esta área é destinada apenas a administradores.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f9ff]">
      <Navbar user={user} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
              Dashboard administrativo
            </p>
            <h1 className="mt-2 text-3xl font-black text-[#25304a]">
              Visão geral da plataforma EAD
            </h1>
            <p className="mt-2 text-slate-600">
              Métricas consolidadas de alunos, matrículas, engajamento e conclusão.
            </p>
          </div>
          <div className="flex-shrink-0">
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={loading || !overview}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download size={16} /> Exportar CSV
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl bg-red-100 p-4 font-semibold text-red-700 flex items-center justify-between"
          >
            <span>{error}</span>
            <button
              onClick={loadData}
              className="text-sm font-medium text-red-700 underline hover:text-red-800"
            >
              Tentar novamente
            </button>
          </div>
        )}

        <GlobalFilters
          filters={filters}
          onFiltersChange={setFilters}
          courses={courses}
          trilhas={trilhas}
          loading={loading}
        />

        <section className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {kpiCards.map((card) => (
            <KpiCard
              key={card.label}
              label={card.label}
              value={card.value}
              icon={card.icon}
              loading={loading}
            />
          ))}
        </section>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <BrazilMap
            data={ufDistribution}
            selectedUf={selectedUf}
            onUfClick={handleUfClick}
            loading={loading}
          />

          <GrowthChart
            data={growthSeries}
            granularity={growthGranularity}
            onGranularityChange={setGrowthGranularity}
            metric={growthMetric}
            onMetricChange={setGrowthMetric}
            comparePreviousYear={false}
            loading={loading}
            title="Crescimento de alunos"
            yAxisLabel="Alunos"
          />
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <LearningFunnel data={learningFunnel} loading={loading} />

          <CertificatesOverTime
            data={certificatesOverTime}
            granularity={certGranularity}
            onGranularityChange={setCertGranularity}
            loading={loading}
          />
        </div>

        <section className="mt-10">
          <CourseTrackComparison
            data={courseTrackPerformance}
            loading={loading}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        </section>
      </main>
      <Footer />
    </div>
  );
}
