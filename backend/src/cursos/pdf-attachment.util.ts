import { BadRequestException } from '@nestjs/common';

export const MAX_LESSON_PDF_BYTES = 6 * 1024 * 1024;

export interface PdfAttachmentInput {
  nome_arquivo: string;
  dados_base64: string;
}

export function parsePdfAttachment(input: PdfAttachmentInput) {
  if (
    !input ||
    typeof input.nome_arquivo !== 'string' ||
    typeof input.dados_base64 !== 'string'
  ) {
    throw new BadRequestException('Informe um arquivo PDF válido.');
  }
  const name = input.nome_arquivo.trim();
  const hasUnsafeCharacter = [...name].some((character) => {
    const code = character.charCodeAt(0);
    return character === '/' || character === '\\' || code < 32 || code === 127;
  });
  if (
    !name ||
    name.length > 255 ||
    !/\.pdf$/i.test(name) ||
    hasUnsafeCharacter
  ) {
    throw new BadRequestException('Informe um nome de arquivo PDF válido.');
  }
  const encoded = input.dados_base64;
  if (
    !encoded ||
    encoded.length > Math.ceil(MAX_LESSON_PDF_BYTES / 3) * 4 ||
    encoded.length % 4 !== 0 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)
  ) {
    throw new BadRequestException('O PDF deve ter no máximo 6 MiB.');
  }
  const bytes = Buffer.from(encoded, 'base64');
  if (
    bytes.length === 0 ||
    bytes.length > MAX_LESSON_PDF_BYTES ||
    !bytes.subarray(0, 5).equals(Buffer.from('%PDF-')) ||
    !bytes
      .subarray(Math.max(0, bytes.length - 1024))
      .includes(Buffer.from('%%EOF'))
  ) {
    throw new BadRequestException('O arquivo enviado não é um PDF válido.');
  }
  return { nome_arquivo: name, tamanho_bytes: bytes.length, conteudo: bytes };
}
