import { BadRequestException } from '@nestjs/common';
import {
  MAX_LESSON_PDF_BYTES,
  parsePdfAttachment,
} from './pdf-attachment.util';

describe('parsePdfAttachment', () => {
  const valid = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF\n');

  it('aceita PDF e preserva os bytes', () => {
    const parsed = parsePdfAttachment({
      nome_arquivo: 'material.pdf',
      dados_base64: valid.toString('base64'),
    });
    expect(parsed.nome_arquivo).toBe('material.pdf');
    expect(parsed.tamanho_bytes).toBe(valid.length);
    expect(parsed.conteudo).toEqual(valid);
  });

  it('rejeita conteúdo não-PDF e nomes com caminho', () => {
    expect(() =>
      parsePdfAttachment({ nome_arquivo: '', dados_base64: '' }),
    ).toThrow(BadRequestException);
    expect(() =>
      parsePdfAttachment({
        nome_arquivo: 'material.pdf',
        dados_base64: Buffer.from('outro arquivo').toString('base64'),
      }),
    ).toThrow(BadRequestException);
    expect(() =>
      parsePdfAttachment({
        nome_arquivo: '../material.pdf',
        dados_base64: valid.toString('base64'),
      }),
    ).toThrow(BadRequestException);
  });

  it('rejeita arquivo acima do limite antes de salvar', () => {
    expect(() =>
      parsePdfAttachment({
        nome_arquivo: 'grande.pdf',
        dados_base64: Buffer.alloc(MAX_LESSON_PDF_BYTES + 1).toString('base64'),
      }),
    ).toThrow(BadRequestException);
  });
});
