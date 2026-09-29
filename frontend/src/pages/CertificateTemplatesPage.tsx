import { useEffect, useState, type FormEvent } from "react";
import {
  Award,
  Check,
  FilePenLine,
  Plus,
  Save,
  Sparkles,
  X,
} from "lucide-react";
import Footer from "../components/Footer/Footer";
import Navbar from "../components/Navbar/Navbar";
import { useAuth } from "../context/auth-context";

interface CertificateTemplate {
  id: string;
  name: string;
  eyebrow: string;
  title: string;
  body: string;
  signature: string;
  primaryColor: string;
  accentColor: string;
  isDefault?: boolean;
}

const STORAGE_KEY = "ead.certificate.templates";

const defaultTemplates: CertificateTemplate[] = [
  {
    id: "institucional-azul",
    name: "Institucional azul",
    eyebrow: "Plataforma EAD Inovação Barueri",
    title: "Certificado de conclusão",
    body: "Certificamos que {aluno} concluiu o curso {curso}.",
    signature: "Inovação Barueri",
    primaryColor: "#2563eb",
    accentColor: "#172033",
    isDefault: true,
  },
  {
    id: "conquista-verde",
    name: "Conquista",
    eyebrow: "Formação e desenvolvimento",
    title: "Certificado",
    body: "Concedido a {aluno} pela conclusão do curso {curso}.",
    signature: "Coordenação pedagógica",
    primaryColor: "#059669",
    accentColor: "#134e4a",
  },
  {
    id: "essencial-violeta",
    name: "Essencial",
    eyebrow: "Conhecimento que transforma",
    title: "Certificado de participação",
    body: "Reconhecemos a participação de {aluno} no curso {curso}.",
    signature: "Equipe de formação",
    primaryColor: "#7c3aed",
    accentColor: "#312e81",
  },
];

const emptyTemplate: CertificateTemplate = {
  id: "",
  name: "Novo modelo",
  eyebrow: "Plataforma EAD Inovação Barueri",
  title: "Certificado de conclusão",
  body: "Certificamos que {aluno} concluiu o curso {curso}.",
  signature: "Coordenação pedagógica",
  primaryColor: "#2563eb",
  accentColor: "#172033",
};

function loadTemplates() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return defaultTemplates;
    const parsed = JSON.parse(saved) as unknown;
    return Array.isArray(parsed) && parsed.length > 0
      ? (parsed as CertificateTemplate[])
      : defaultTemplates;
  } catch {
    return defaultTemplates;
  }
}

function templateId() {
  return globalThis.crypto?.randomUUID?.() ?? `modelo-${Date.now()}`;
}

function CertificatePreview({ template }: { template: CertificateTemplate }) {
  return (
    <div
      className="relative aspect-[1.42/1] overflow-hidden rounded-xl bg-white p-4 shadow-inner sm:p-5"
      style={{ border: `8px solid ${template.accentColor}` }}
      aria-label={`Prévia do modelo ${template.name}`}
    >
      <span
        className="absolute -right-10 -top-12 h-32 w-32 rounded-full opacity-15"
        style={{ backgroundColor: template.primaryColor }}
      />
      <span
        className="absolute -bottom-14 -left-8 h-28 w-28 rotate-45 opacity-10"
        style={{ backgroundColor: template.primaryColor }}
      />
      <div className="relative flex h-full flex-col items-center justify-between text-center">
        <div>
          <p
            className="text-[7px] font-bold uppercase tracking-[0.2em] sm:text-[8px]"
            style={{ color: template.primaryColor }}
          >
            {template.eyebrow}
          </p>
          <div
            className="mx-auto mt-2 h-0.5 w-12 rounded-full"
            style={{ backgroundColor: template.primaryColor }}
          />
        </div>
        <div>
          <Award
            className="mx-auto mb-1.5"
            size={22}
            style={{ color: template.primaryColor }}
          />
          <p
            className="font-serif text-base font-bold sm:text-lg"
            style={{ color: template.accentColor }}
          >
            {template.title}
          </p>
          <p className="mx-auto mt-2 max-w-[88%] text-[8px] leading-3 text-slate-500 sm:text-[9px]">
            {template.body
              .replace("{aluno}", "Nome do aluno")
              .replace("{curso}", "Nome do curso")}
          </p>
        </div>
        <div>
          <div className="mx-auto h-px w-20 bg-slate-300" />
          <p className="mt-1 text-[7px] font-semibold text-slate-500">
            {template.signature}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CertificateTemplatesPage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<CertificateTemplate[]>(loadTemplates);
  const [draft, setDraft] = useState<CertificateTemplate | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  }, [templates]);

  const openNewTemplate = () => {
    setStatus("");
    setDraft({ ...emptyTemplate, id: templateId() });
  };

  const openTemplate = (template: CertificateTemplate) => {
    setStatus("");
    setDraft({ ...template });
  };

  const saveTemplate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft) return;
    const exists = templates.some((template) => template.id === draft.id);
    setTemplates((current) =>
      exists
        ? current.map((template) =>
            template.id === draft.id ? { ...draft } : template,
          )
        : [...current, { ...draft }],
    );
    setDraft(null);
    setStatus(exists ? "Modelo atualizado com sucesso." : "Modelo criado com sucesso.");
  };

  return (
    <div className="min-h-screen bg-[#f6f9ff] text-slate-950">
      <Navbar user={user} />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-blue-600">
              <Sparkles size={17} /> Certificados
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-[#25304a] sm:text-4xl">
              Modelos de certificado
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Edite os modelos existentes ou crie um novo layout para as
              próximas emissões.
            </p>
          </div>
          <button
            type="button"
            onClick={openNewTemplate}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Plus size={19} /> Novo modelo
          </button>
        </header>

        {status && (
          <div
            role="status"
            className="mt-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
          >
            <Check size={18} /> {status}
          </div>
        )}

        <section
          aria-label="Modelos de certificado"
          className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
        >
          {templates.map((template) => (
            <article
              key={template.id}
              className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
            >
              <CertificatePreview template={template} />
              <div className="mt-4 flex items-center justify-between gap-3 px-1 pb-1">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate font-bold text-[#25304a]">
                      {template.name}
                    </h2>
                    {template.isDefault && (
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700">
                        Padrão
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Modelo editável</p>
                </div>
                <button
                  type="button"
                  onClick={() => openTemplate(template)}
                  className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                  aria-label={`Editar modelo ${template.name}`}
                >
                  <FilePenLine size={15} /> Editar
                </button>
              </div>
            </article>
          ))}

          <button
            type="button"
            onClick={openNewTemplate}
            className="group flex min-h-72 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/40 p-8 text-center transition hover:border-blue-500 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Criar novo modelo de certificado"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm ring-1 ring-blue-100 transition group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white">
              <Plus size={30} />
            </span>
            <span className="mt-5 text-lg font-black text-[#25304a]">
              Criar novo modelo
            </span>
            <span className="mt-2 max-w-56 text-sm leading-5 text-slate-500">
              Comece com uma estrutura pronta e personalize textos e cores.
            </span>
          </button>
        </section>
      </main>
      <Footer />

      {draft && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-950/60 px-4 py-8 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="certificate-editor-title"
        >
          <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
            <div className="bg-slate-100 p-5 sm:p-8 lg:flex lg:items-center">
              <div className="mx-auto w-full max-w-lg">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Pré-visualização
                </p>
                <CertificatePreview template={draft} />
              </div>
            </div>

            <form onSubmit={saveTemplate} className="p-5 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
                    Editor de certificado
                  </p>
                  <h2
                    id="certificate-editor-title"
                    className="mt-2 text-2xl font-black text-[#25304a]"
                  >
                    {templates.some((template) => template.id === draft.id)
                      ? "Editar modelo"
                      : "Novo modelo"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setDraft(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                  aria-label="Fechar editor"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mt-6 grid gap-4">
                <label className="text-sm font-bold text-slate-700">
                  Nome do modelo
                  <input
                    required
                    value={draft.name}
                    onChange={(event) =>
                      setDraft({ ...draft, name: event.target.value })
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="text-sm font-bold text-slate-700">
                  Texto superior
                  <input
                    required
                    value={draft.eyebrow}
                    onChange={(event) =>
                      setDraft({ ...draft, eyebrow: event.target.value })
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="text-sm font-bold text-slate-700">
                  Título
                  <input
                    required
                    value={draft.title}
                    onChange={(event) =>
                      setDraft({ ...draft, title: event.target.value })
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="text-sm font-bold text-slate-700">
                  Texto do certificado
                  <textarea
                    required
                    rows={3}
                    value={draft.body}
                    onChange={(event) =>
                      setDraft({ ...draft, body: event.target.value })
                    }
                    className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <span className="mt-1 block text-xs font-normal text-slate-400">
                    Use {"{aluno}"} e {"{curso}"} para preencher os dados automaticamente.
                  </span>
                </label>
                <label className="text-sm font-bold text-slate-700">
                  Assinatura
                  <input
                    required
                    value={draft.signature}
                    onChange={(event) =>
                      setDraft({ ...draft, signature: event.target.value })
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="text-sm font-bold text-slate-700">
                    Cor principal
                    <span className="mt-2 flex h-11 items-center gap-3 rounded-xl border border-slate-200 px-3">
                      <input
                        type="color"
                        value={draft.primaryColor}
                        onChange={(event) =>
                          setDraft({ ...draft, primaryColor: event.target.value })
                        }
                        className="h-7 w-9 cursor-pointer border-0 bg-transparent p-0"
                      />
                      <span className="text-xs font-medium uppercase text-slate-500">
                        {draft.primaryColor}
                      </span>
                    </span>
                  </label>
                  <label className="text-sm font-bold text-slate-700">
                    Cor da moldura
                    <span className="mt-2 flex h-11 items-center gap-3 rounded-xl border border-slate-200 px-3">
                      <input
                        type="color"
                        value={draft.accentColor}
                        onChange={(event) =>
                          setDraft({ ...draft, accentColor: event.target.value })
                        }
                        className="h-7 w-9 cursor-pointer border-0 bg-transparent p-0"
                      />
                      <span className="text-xs font-medium uppercase text-slate-500">
                        {draft.accentColor}
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setDraft(null)}
                  className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-bold text-white transition hover:bg-blue-700"
                >
                  <Save size={18} /> Salvar modelo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
