import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BadgeCheck, CircleX, Clock3 } from "lucide-react";
import certificateService from "../services/certificateService";
import type { CertificateSummary } from "../services/journeyService";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(
    new Date(value),
  );
}

export default function CertificateValidationPage() {
  const { codigo = "" } = useParams();
  const [certificate, setCertificate] = useState<CertificateSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    certificateService
      .validate(codigo)
      .then((result) => {
        if (!cancelled) setCertificate(result);
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Certificado não encontrado.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [codigo]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f9ff] px-4 py-12">
      <section className="w-full max-w-2xl rounded-3xl border border-blue-100 bg-white p-8 shadow-xl shadow-blue-900/10 sm:p-12">
        <p className="text-sm font-black uppercase tracking-wider text-blue-600">
          Validação pública
        </p>
        <h1 className="mt-2 text-3xl font-black text-[#25304a]">
          Certificado de conclusão
        </h1>

        {loading ? (
          <div className="mt-10 flex items-center gap-3 text-slate-600">
            <Clock3 className="animate-pulse" /> Validando certificado...
          </div>
        ) : error || !certificate ? (
          <div role="alert" className="mt-8 rounded-2xl bg-red-50 p-6 text-red-800">
            <CircleX size={34} />
            <p className="mt-3 font-black">Certificado não localizado</p>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        ) : (
          <div className="mt-8">
            <div className={`flex items-center gap-3 rounded-2xl p-5 ${certificate.status === "valido" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}>
              <BadgeCheck size={36} />
              <div>
                <p className="font-black">
                  Certificado {certificate.status === "valido" ? "válido" : "revogado"}
                </p>
                <p className="text-sm">Código público: {certificate.codigo}</p>
              </div>
            </div>
            <dl className="mt-7 grid gap-5 sm:grid-cols-2">
              <div><dt className="text-xs font-bold uppercase text-slate-500">Aluno</dt><dd className="mt-1 font-bold text-[#25304a]">{certificate.nome_aluno}</dd></div>
              <div><dt className="text-xs font-bold uppercase text-slate-500">Curso</dt><dd className="mt-1 font-bold text-[#25304a]">{certificate.nome_curso}</dd></div>
              <div><dt className="text-xs font-bold uppercase text-slate-500">Carga horária</dt><dd className="mt-1 text-slate-700">{certificate.carga_horaria} horas</dd></div>
              <div><dt className="text-xs font-bold uppercase text-slate-500">Conclusão</dt><dd className="mt-1 text-slate-700">{formatDate(certificate.concluido_em)}</dd></div>
            </dl>
          </div>
        )}

        <p className="mt-10 border-t border-slate-100 pt-6 text-xs leading-5 text-slate-500">
          Esta consulta pública exibe somente os dados necessários para comprovar a conclusão.
        </p>
        <Link to="/login" className="mt-5 inline-block font-bold text-blue-700">
          Acessar a plataforma
        </Link>
      </section>
    </main>
  );
}
