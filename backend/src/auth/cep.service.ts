import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

export interface CepAddress {
  cep: string;
  rua: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  estado: string | null;
  complemento: string | null;
}

interface ViaCepResponse {
  cep?: unknown;
  logradouro?: unknown;
  complemento?: unknown;
  bairro?: unknown;
  localidade?: unknown;
  uf?: unknown;
  estado?: unknown;
  erro?: unknown;
}

@Injectable()
export class CepService {
  async findAddress(cep: string): Promise<CepAddress> {
    const normalizedCep = cep.replace(/\D/g, '');

    if (!/^\d{8}$/.test(normalizedCep)) {
      throw new BadRequestException('CEP deve conter 8 dígitos.');
    }

    let response: Response;
    try {
      response = await fetch(
        'https://viacep.com.br/ws/' + normalizedCep + '/json/',
        {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(5000),
        },
      );
    } catch {
      throw new ServiceUnavailableException(
        'Não foi possível consultar o CEP agora. Tente novamente.',
      );
    }

    if (!response.ok) {
      throw new BadGatewayException('O serviço de CEP retornou uma falha.');
    }

    let data: ViaCepResponse;
    try {
      data = (await response.json()) as ViaCepResponse;
    } catch {
      throw new BadGatewayException(
        'O serviço de CEP retornou dados inválidos.',
      );
    }

    if (data.erro === true) {
      throw new BadRequestException('CEP não encontrado.');
    }

    const returnedCep = this.optionalText(data.cep, 10)?.replace(/\D/g, '');
    const cidade = this.optionalText(data.localidade, 255);
    const uf = this.optionalText(data.uf, 2)?.toUpperCase() ?? null;

    if (returnedCep !== normalizedCep || !cidade || !uf) {
      throw new BadGatewayException(
        'O serviço de CEP retornou dados incompletos.',
      );
    }

    return {
      cep: normalizedCep,
      rua: this.optionalText(data.logradouro, 255),
      bairro: this.optionalText(data.bairro, 255),
      cidade,
      uf,
      estado: this.optionalText(data.estado, 100),
      complemento: this.optionalText(data.complemento, 255),
    };
  }

  private optionalText(value: unknown, maxLength: number): string | null {
    if (typeof value !== 'string') return null;
    const normalized = value.trim();
    return normalized ? normalized.slice(0, maxLength) : null;
  }
}
