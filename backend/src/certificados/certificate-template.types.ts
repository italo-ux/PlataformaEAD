export type CertificateAssetKind = 'logo' | 'signature';

export interface CertificateTemplateSnapshot {
  templateId: string | null;
  name: string;
  eyebrow: string;
  title: string;
  body: string;
  signature: string;
  primaryColor: string;
  accentColor: string;
}

export const LEGACY_CERTIFICATE_TEMPLATE: CertificateTemplateSnapshot = {
  templateId: null,
  name: 'Certificado legado',
  eyebrow: 'Plataforma EAD Inovação Barueri',
  title: 'Certificado de conclusão',
  body: 'Certificamos que {aluno} concluiu com aproveitamento o curso {curso}.',
  signature: 'Inovação Barueri',
  primaryColor: '#2563EB',
  accentColor: '#173B75',
};
