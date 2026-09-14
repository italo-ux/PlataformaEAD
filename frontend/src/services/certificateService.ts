import { apiFetch } from "./api";
import type { CertificateSummary } from "./journeyService";

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
};

export default certificateService;
