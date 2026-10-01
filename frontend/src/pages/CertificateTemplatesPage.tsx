import { useEffect, useState, type FormEvent, type ChangeEvent } from "react";
import {
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
import certificateService, {
  type CertificateTemplate,
  type CertificateTemplateInput,
  type LegacyCertificateTemplate,
} from "../services/certificateService";

const STORAGE_KEY = "ead.certificate.templates";

const defaultTemplates: LegacyCertificateTemplate[] = [
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
    logos: [],
    signatures: [],
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
    logos: [],
    signatures: [],
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
    logos: [],
    signatures: [],
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
  isDefault: false,
  logos: [],
  signatures: [],
};

function loadLegacyTemplates(): LegacyCertificateTemplate[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return defaultTemplates;
    const parsed = JSON.parse(saved) as unknown;
    return Array.isArray(parsed) && parsed.length > 0
      ? (parsed as LegacyCertificateTemplate[]).map((template) => ({
          ...template,
          logos: template.logos ?? [],
          signatures: template.signatures ?? [],
        }))
      : [];
  } catch {
    return [];
  }
}

function getSignatures(template: CertificateTemplate) {
  return template.signatures ?? [];
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
        <div className="w-full min-w-0">
          {(template.logos?.length ?? 0) > 0 && (
            <div className="mx-auto mb-2 flex h-10 w-full items-center justify-center gap-2 sm:h-12" aria-label="Logos do certificado">
              {template.logos!.map((logo, index) => (
                <img key={`${logo.name}-${index}`} src={logo.src} alt={logo.name}
                  className="h-full min-w-0 max-w-24 flex-1 object-contain" />
              ))}
            </div>
          )}
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
        <div className="flex w-full items-end justify-center gap-3" aria-label="Assinaturas do certificado">
          {getSignatures(template).length > 0 ? (
            getSignatures(template).map((signature, index) => (
              <div key={index} className="min-w-0 max-w-36 flex-1">
                {signature.src && <img src={signature.src} alt={`Assinatura de ${signature.identification || "signatário"}`} className="mb-1 h-8 w-full object-contain" />}
                <div className="mx-auto h-px w-full bg-slate-300" />
                <p className="mt-1 whitespace-pre-line break-words text-[7px] font-semibold text-slate-500">{signature.identification || "Identificação"}</p>
              </div>
            ))
          ) : (
            <div className="w-36">
              <div className="mx-auto h-px w-full bg-slate-300" />
              <p className="mt-1 whitespace-pre-line break-words text-[7px] font-semibold text-slate-500">{template.signature}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CertificateTemplatesPage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [draft, setDraft] = useState<CertificateTemplate | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [logoError, setLogoError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    void (async () => {
      try {
        const legacy = loadLegacyTemplates();
        if (legacy.length) await certificateService.syncLegacyTemplates(legacy);
        const loaded = await certificateService.listTemplates();
        if (!cancelled) setTemplates(loaded);
      } catch (reason) {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : "Não foi possível carregar os modelos.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const addImages = async (event: ChangeEvent<HTMLInputElement>, kind: "logos" | "signatures") => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!draft || !files.length || uploading) return;
    const draftId = draft.id;
    setLogoError("");
    setUploading(true);
    try {
      const logos = await Promise.all(files.map(async (file) => {
        if (file.size > 1024 * 1024) throw new Error("Cada imagem deve ter no máximo 1 MB.");
        const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());
        const signature = [137, 80, 78, 71, 13, 10, 26, 10];
        if (bytes.length !== 8 || signature.some((byte, index) => byte !== bytes[index])) {
          throw new Error("Selecione apenas imagens PNG.");
        }
        const src = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(`data:image/png;base64,${String(reader.result).split(",")[1]}`);
          reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
          reader.readAsDataURL(file);
        });
        await new Promise<void>((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve();
          image.onerror = () => reject(new Error("O arquivo PNG está inválido ou corrompido."));
          image.src = src;
        });
        return { name: file.name, src };
      }));
      setDraft((current) => {
        if (!current || current.id !== draftId) return current;
        return kind === "logos"
          ? { ...current, logos: [...(current.logos ?? []), ...logos] }
          : { ...current, signatures: [...getSignatures(current), ...logos.map((logo) => ({ ...logo, identification: "" }))] };
      });
    } catch (reason) {
      setLogoError(reason instanceof Error ? reason.message : "Não foi possível adicionar as imagens.");
    } finally {
      setUploading(false);
    }
  };

  const openNewTemplate = () => {
    setStatus("");
    setLogoError("");
    setDraft({ ...emptyTemplate, logos: [], signatures: [] });
  };

  const openTemplate = (template: CertificateTemplate) => {
    setStatus("");
    setLogoError("");
    setDraft({ ...template, signatures: getSignatures(template) });
  };

  const saveTemplate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft || uploading) return;
    if (getSignatures(draft).some((signature) => !signature.identification.trim())) {
      setLogoError("Preencha a identificação de cada assinatura.");
      return;
    }
    const exists = Boolean(draft.id);
    const id = draft.id;
    const input: CertificateTemplateInput = {
      name: draft.name,
      eyebrow: draft.eyebrow,
      title: draft.title,
      body: draft.body,
      signature: draft.signature,
      primaryColor: draft.primaryColor,
      accentColor: draft.accentColor,
      logos: draft.logos,
      signatures: draft.signatures,
    };
    setSaving(true);
    setError("");
    try {
      const saved = exists
        ? await certificateService.updateTemplate(id, input)
        : await certificateService.createTemplate(input);
      setTemplates((current) => exists
        ? current.map((template) => template.id === saved.id ? saved : template)
        : [...current, saved]);
      setDraft(null);
      setStatus(exists ? "Modelo atualizado com sucesso." : "Modelo criado com sucesso.");
    } catch (reason) {
      setLogoError(reason instanceof Error ? reason.message : "Não foi possível salvar o modelo.");
    } finally {
      setSaving(false);
    }
  };

  const setDefault = async (id: string) => {
    setError("");
    setStatus("");
    try {
      await certificateService.setDefaultTemplate(id);
      setTemplates((current) => current.map((template) => ({
        ...template,
        isDefault: template.id === id,
      })));
      setStatus("Modelo padrão atualizado. Ele será usado somente nas próximas emissões.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível definir o modelo padrão.");
    }
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
        {error && (
          <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <section
          aria-label="Modelos de certificado"
          className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
        >
          {loading && <p className="text-sm text-slate-500">Carregando modelos...</p>}
          {!loading && templates.map((template) => (
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
                <div className="flex shrink-0 gap-2">
                  {!template.isDefault && (
                    <button type="button" onClick={() => void setDefault(template.id)}
                      className="h-9 rounded-lg border border-blue-200 px-3 text-xs font-bold text-blue-700 hover:bg-blue-50">
                      Definir padrão
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => openTemplate(template)}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                    aria-label={`Editar modelo ${template.name}`}
                  >
                    <FilePenLine size={15} /> Editar
                  </button>
                </div>
              </div>
            </article>
          ))}

          {!loading && <button
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
          </button>}
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
          <div className="grid max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
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
                  disabled={uploading || saving}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mt-6 grid gap-4">
                <div>
                  <label className="text-sm font-bold text-slate-700">
                    Logos do certificado (PNG)
                    <input type="file" accept="image/png,.png" multiple disabled={uploading}
                      onChange={(event) => void addImages(event, "logos")}
                      className="mt-2 block w-full text-sm font-normal file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-semibold file:text-blue-700" />
                  </label>
                  <p className="mt-2 text-xs text-slate-500">Adicione uma ou mais logos. Elas aparecem lado a lado. Máximo de 1 MB por imagem.</p>
                  {uploading && <p role="status" className="mt-2 text-sm text-blue-700">Carregando imagens...</p>}
                  {logoError && <p role="alert" className="mt-2 text-sm text-red-700">{logoError}</p>}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {draft.logos?.map((logo, index) => (
                      <div key={`${logo.name}-${index}`} className="relative rounded-lg border border-slate-200 p-2 pr-7">
                        <img src={logo.src} alt={logo.name} className="h-10 w-16 object-contain" />
                        <button type="button" aria-label={`Remover logo ${logo.name}`} onClick={() => setDraft({ ...draft, logos: draft.logos?.filter((_, i) => i !== index) })} className="absolute right-1 top-1 rounded p-1 text-slate-500 hover:bg-slate-100"><X size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>
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
                <div>
                  <label className="text-sm font-bold text-slate-700">
                    Adicionar assinaturas (PNG)
                    <input type="file" accept="image/png,.png" multiple disabled={uploading}
                      onChange={(event) => void addImages(event, "signatures")}
                      className="mt-2 block w-full text-sm font-normal file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-semibold file:text-blue-700" />
                  </label>
                  <p className="mt-2 text-xs text-slate-500">As assinaturas ficam lado a lado, com a identificação abaixo. PNG de até 1 MB por imagem.</p>
                  <div className="mt-3 space-y-3">
                    {getSignatures(draft).map((signature, index) => (
                      <div key={index} className="rounded-xl border border-slate-200 p-3">
                        <div className="flex items-center justify-between gap-3">
                          {signature.src ? <img src={signature.src} alt={`Assinatura ${index + 1}`} className="h-12 min-w-0 max-w-40 object-contain" /> : <span className="text-xs text-slate-500">Assinatura existente</span>}
                          <button type="button" aria-label={`Remover assinatura ${index + 1}`} onClick={() => setDraft({ ...draft, signatures: getSignatures(draft).filter((_, i) => i !== index) })} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={16} /></button>
                        </div>
                        <label className="mt-3 block text-sm font-semibold text-slate-700">
                          Identificação da assinatura {index + 1}
                          <textarea required maxLength={150} rows={2} value={signature.identification}
                            placeholder="Nome e cargo"
                            onChange={(event) => setDraft({ ...draft, signatures: getSignatures(draft).map((item, i) => i === index ? { ...item, identification: event.target.value } : item) })}
                            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal outline-none focus:border-blue-500" />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <label className="text-sm font-bold text-slate-700">
                  Identificação textual padrão
                  <input required maxLength={180} value={draft.signature}
                    onChange={(event) => setDraft({ ...draft, signature: event.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                  <span className="mt-1 block text-xs font-normal text-slate-400">
                    Usada quando o modelo não possui uma imagem de assinatura.
                  </span>
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
                  disabled={uploading || saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading || saving}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-bold text-white transition hover:bg-blue-700"
                >
                  <Save size={18} /> {saving ? "Salvando..." : "Salvar modelo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
