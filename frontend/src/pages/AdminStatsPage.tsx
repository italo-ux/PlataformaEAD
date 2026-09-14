import { useEffect, useState } from "react";
import { Award, BookOpenCheck, GraduationCap, PlayCircle } from "lucide-react";
import Navbar from "../components/Navbar/Navbar";
import { useAuth } from "../context/auth-context";
import journeyService, { type JourneyMetrics } from "../services/journeyService";

export default function AdminStatsPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<JourneyMetrics | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    journeyService
      .metrics()
      .then(setMetrics)
      .catch((reason: unknown) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Não foi possível carregar os indicadores.",
        ),
      );
  }, []);

  const cards = [
    {
      label: "Matrículas iniciadas",
      value: metrics?.matriculas_iniciadas,
      icon: PlayCircle,
    },
    {
      label: "Aulas concluídas",
      value: metrics?.aulas_concluidas,
      icon: BookOpenCheck,
    },
    {
      label: "Cursos concluídos",
      value: metrics?.cursos_concluidos,
      icon: GraduationCap,
    },
    {
      label: "Certificados emitidos",
      value: metrics?.certificados_emitidos,
      icon: Award,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f6f9ff]">
      <Navbar user={user} />
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
          Indicadores reais
        </p>
        <h1 className="mt-2 text-4xl font-black text-[#25304a]">
          Jornada do aluno
        </h1>
        <p className="mt-3 text-slate-600">
          Contagens consolidadas diretamente das matrículas, aulas e certificados.
        </p>
        {error && (
          <div role="alert" className="mt-6 rounded-xl bg-red-100 p-4 font-semibold text-red-700">
            {error}
          </div>
        )}
        <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <article key={card.label} className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
                <Icon className="text-blue-600" size={28} />
                <p className="mt-5 text-sm font-semibold text-slate-500">{card.label}</p>
                <p className="mt-1 text-3xl font-black text-[#25304a]">
                  {card.value ?? "—"}
                </p>
              </article>
            );
          })}
        </section>
      </main>
    </div>
  );
}
