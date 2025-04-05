import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ANSI_COLORS } from './common/constants';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message =
      exception instanceof HttpException
        ? exception.getResponse()
        : {
            error: exception?.name,
            message: exception?.message,
            statusCode: status,
          };
    if (typeof message === 'string') {
      message = { error: message };
    }
    message = { ...message, path: request.url };
    this.logger.error(
      exception,
      `${ANSI_COLORS.RED}${JSON.stringify({ statusCode: status, path: request.url }, null, 2)}\n${exception.stack}${ANSI_COLORS.RESET}`,
    );
    response.status(status).json(message);
  }
}
