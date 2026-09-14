import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

export const INTERNAL_ERROR_MESSAGE =
  'Não foi possível concluir esta operação agora. Tente novamente em instantes.';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (status < 500) {
      const body =
        exception instanceof HttpException
          ? exception.getResponse()
          : {
              statusCode: status,
              message: 'Não foi possível concluir a operação.',
            };
      response
        .status(status)
        .json(
          typeof body === 'string'
            ? { statusCode: status, message: body }
            : body,
        );
      return;
    }

    const error =
      exception instanceof Error ? exception : new Error(String(exception));
    this.logger.error(
      `${request.method} ${request.originalUrl || request.url} -> ${status}: ${error.message}`,
      error.stack,
    );
    response.status(status).json({
      statusCode: status,
      message: INTERNAL_ERROR_MESSAGE,
    });
  }
}
