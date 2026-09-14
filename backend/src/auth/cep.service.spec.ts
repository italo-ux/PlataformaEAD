import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { CepService } from './cep.service';

describe('CepService', () => {
  const originalFetch = global.fetch;
  let service: CepService;

  beforeEach(() => {
    service = new CepService();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('normalizes a CEP and maps only address data returned by ViaCEP', async () => {
    jest.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          cep: '01001-000',
          logradouro: ' Praça da Sé ',
          complemento: '',
          bairro: 'Sé',
          localidade: 'São Paulo',
          uf: 'sp',
          estado: 'São Paulo',
        }),
        { status: 200 },
      ),
    );

    await expect(service.findAddress('01001-000')).resolves.toEqual({
      cep: '01001000',
      rua: 'Praça da Sé',
      complemento: null,
      bairro: 'Sé',
      cidade: 'São Paulo',
      uf: 'SP',
      estado: 'São Paulo',
    });
  });

  it('rejects an invalid CEP before calling the provider', async () => {
    await expect(service.findAddress('123')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects a well-formed CEP that does not exist', async () => {
    jest
      .mocked(fetch)
      .mockResolvedValue(
        new Response(JSON.stringify({ erro: true }), { status: 200 }),
      );

    await expect(service.findAddress('99999999')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('reports provider connection failures without creating an address', async () => {
    jest.mocked(fetch).mockRejectedValue(new Error('network failure'));

    await expect(service.findAddress('01001000')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
