import { ArgumentsHost, BadRequestException, Logger } from '@nestjs/common';
import {
  ApiExceptionFilter,
  INTERNAL_ERROR_MESSAGE,
} from './api-exception.filter';

describe('ApiExceptionFilter', () => {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({
        method: 'POST',
        originalUrl: '/cursos',
        url: '/cursos',
      }),
      getResponse: () => ({ status }),
    }),
  } as unknown as ArgumentsHost;

  beforeEach(() => jest.clearAllMocks());

  it('logs the technical error and returns only a safe message on 500', () => {
    const logger = jest.spyOn(Logger.prototype, 'error').mockImplementation();

    new ApiExceptionFilter().catch(
      new Error('password=secret database unavailable'),
      host,
    );

    expect(logger).toHaveBeenCalledWith(
      expect.stringContaining('password=secret database unavailable'),
      expect.any(String),
    );
    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      statusCode: 500,
      message: INTERNAL_ERROR_MESSAGE,
    });
    expect(JSON.stringify(json.mock.calls)).not.toContain('password=secret');
  });

  it('preserves actionable messages from expected client errors', () => {
    new ApiExceptionFilter().catch(
      new BadRequestException('Informe uma duração válida.'),
      host,
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Informe uma duração válida.' }),
    );
  });
});
