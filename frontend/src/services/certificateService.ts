import { apiFetch } from "./api";
import type { CertificateSummary } from "./journeyService";

export interface CertificateTemplateImage {
  name: string;
  src: string;
}

export interface CertificateTemplateSignature extends CertificateTemplateImage {
  identification: string;
}

export interface CertificateTemplate {
  id: string;
  name: string;
  eyebrow: string;
  title: string;
  body: string;
  signature: string;
  primaryColor: string;
  accentColor: string;
  isDefault: boolean;
  logos: CertificateTemplateImage[];
  signatures: CertificateTemplateSignature[];
}

export type CertificateTemplateInput = Omit<
  CertificateTemplate,
  "id" | "isDefault"
>;

export type LegacyCertificateTemplate = CertificateTemplateInput & {
  id: string;
  isDefault?: boolean;
};

async function parse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as
      | { message?: string | string[] }
      | null;
    const message = data?.message;
    throw new Error(
      Array.isArray(message)
        ? message.join(" ")
        : message || "Certificado não encontrado.",
    );
  }
  return response.json() as Promise<T>;
}

const certificateService = {
  list: () =>
    apiFetch("/usuarios/me/certificados").then(parse<CertificateSummary[]>),
  validate: (code: string) =>
    apiFetch(
      `/certificados/validar/${encodeURIComponent(code)}`,
      {},
      false,
    ).then(parse<CertificateSummary>),
  download: async (certificate: CertificateSummary) => {
    const response = await apiFetch(`/certificados/${certificate.id}/pdf`);
    if (!response.ok) throw new Error("Não foi possível baixar o certificado.");
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");
    link.href = url;
    link.download = `certificado-${certificate.codigo}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  },
  listTemplates: () =>
    apiFetch("/admin/modelos-certificado").then(parse<CertificateTemplate[]>),
  createTemplate: (template: CertificateTemplateInput) =>
    apiFetch("/admin/modelos-certificado", {
      method: "POST",
      body: JSON.stringify(template),
    }).then(parse<CertificateTemplate>),
  updateTemplate: (id: string, template: CertificateTemplateInput) =>
    apiFetch(`/admin/modelos-certificado/${id}`, {
      method: "PATCH",
      body: JSON.stringify(template),
    }).then(parse<CertificateTemplate>),
  setDefaultTemplate: (id: string) =>
    apiFetch(`/admin/modelos-certificado/${id}/padrao`, {
      method: "POST",
    }).then(parse<CertificateTemplate>),
  syncLegacyTemplates: (templates: LegacyCertificateTemplate[]) =>
    apiFetch("/admin/modelos-certificado/sincronizar", {
      method: "POST",
      body: JSON.stringify({
        templates: templates.map(({ id, ...template }) => ({
          ...template,
          clientId: id,
        })),
      }),
    }).then(parse<{ imported: number; skipped: number }>),
};

export default certificateService;
