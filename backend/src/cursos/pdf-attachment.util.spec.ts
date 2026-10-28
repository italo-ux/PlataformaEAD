import { BadRequestException } from '@nestjs/common';
import { PDFDocument } from 'pdf-lib';
import {
  MAX_LESSON_PDF_BYTES,
  parsePdfAttachment,
} from './pdf-attachment.util';

describe('parsePdfAttachment', () => {
  let valid: Buffer;

  beforeAll(async () => {
    const document = await PDFDocument.create();
    document.addPage();
    valid = Buffer.from(await document.save());
  });

  it('aceita PDF e preserva os bytes', async () => {
    const parsed = await parsePdfAttachment({
      nome_arquivo: 'material.pdf',
      dados_base64: valid.toString('base64'),
    });
    expect(parsed.nome_arquivo).toBe('material.pdf');
    expect(parsed.tamanho_bytes).toBe(valid.length);
    expect(parsed.conteudo).toEqual(valid);
  });

  it('rejeita conteúdo não-PDF e nomes com caminho', async () => {
    await expect(
      parsePdfAttachment({ nome_arquivo: '', dados_base64: '' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      parsePdfAttachment({
        nome_arquivo: 'material.pdf',
        dados_base64: Buffer.from('outro arquivo').toString('base64'),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      parsePdfAttachment({
        nome_arquivo: '../material.pdf',
        dados_base64: valid.toString('base64'),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejeita um arquivo truncado com cabeçalho e marcador final', async () => {
    await expect(
      parsePdfAttachment({
        nome_arquivo: 'invalido.pdf',
        dados_base64: Buffer.from('%PDF-1.7\n%%EOF').toString('base64'),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejeita arquivo acima do limite antes de salvar', async () => {
    await expect(
      parsePdfAttachment({
        nome_arquivo: 'grande.pdf',
        dados_base64: Buffer.alloc(MAX_LESSON_PDF_BYTES + 1).toString('base64'),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
